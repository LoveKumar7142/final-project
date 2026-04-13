import multer from "multer";

const storage = multer.memoryStorage();
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_ARCHIVE_SIZE = 50 * 1024 * 1024;
const MAX_GENERIC_SIZE = 20 * 1024 * 1024;

const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
]);

const allowedArchiveMimeTypes = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "application/x-7z-compressed",
  "application/vnd.rar",
  "application/x-rar-compressed",
]);

export const createUploadError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const createUploader = ({ maxSize, fileFilter }) =>
  multer({
    storage,
    limits: {
      fileSize: maxSize,
      files: 1,
    },
    fileFilter: (req, file, callback) => {
      try {
        // ✅ sanitize filename
        if (file.originalname) {
          file.originalname = file.originalname
            .replace(/[^a-zA-Z0-9.\-_]/g, "-")
            .replace(/\s+/g, "-");
        }

        fileFilter(file);
        callback(null, true);
      } catch (error) {
        callback(error);
      }
    },
  });

export const uploadImage = createUploader({
  maxSize: MAX_IMAGE_SIZE,
  fileFilter: (file) => {
    if (!allowedImageMimeTypes.has(file.mimetype)) {
      throw createUploadError(
        "Only JPG, PNG, WEBP, SVG, or GIF images are allowed",
      );
    }
  },
});

export const uploadArchive = createUploader({
  maxSize: MAX_ARCHIVE_SIZE,
  fileFilter: (file) => {
    const lowerName = String(file.originalname || "").toLowerCase();

    const validExtensions = [".zip", ".rar", ".7z"];
    const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));

    const validMime = allowedArchiveMimeTypes.has(file.mimetype);

    if (!validMime || !hasValidExt) {
      throw createUploadError("Only ZIP, RAR, or 7Z archives are allowed");
    }
  },
});

const allowedGenericMimeTypes = new Set([
  ...allowedImageMimeTypes,
  ...allowedArchiveMimeTypes,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
]);

const uploadAny = createUploader({
  maxSize: MAX_GENERIC_SIZE,
  fileFilter: (file) => {
    const lowerName = String(file.originalname || "").toLowerCase();
    const looksLikeArchive = [".zip", ".rar", ".7z"].some((ext) =>
      lowerName.endsWith(ext),
    );
    const looksLikeDoc = [".pdf", ".doc", ".docx", ".txt", ".csv"].some((ext) =>
      lowerName.endsWith(ext),
    );

    if (
      !looksLikeArchive &&
      !looksLikeDoc &&
      !allowedGenericMimeTypes.has(file.mimetype)
    ) {
      throw createUploadError(
        "Only Images, Archives, PDFs, and Documents are allowed",
      );
    }
  },
});

export default uploadAny;
