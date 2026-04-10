import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

export const uploadBufferToCloudinary = async (fileBuffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });

export const destroyCloudinaryAsset = async (publicId, resourceType = "image") => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
  } catch (error) {
    console.warn("Cloudinary cleanup failed:", error.message);
  }
};

export const formatUploadResponse = (result) => ({
  message: "File uploaded successfully",
  url: result.secure_url,
  public_id: result.public_id,
  resource_type: result.resource_type,
  format: result.format,
  width: result.width,
  height: result.height,
  bytes: result.bytes,
  original_filename: result.original_filename,
});
