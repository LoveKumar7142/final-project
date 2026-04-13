import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

// 🔥 CONFIGURATION (VERY IMPORTANT)
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// 🔍 DEBUG (optional but useful)
console.log("☁️ Cloudinary Config Loaded:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "✅ OK" : "❌ Missing",
});

// 🚀 UPLOAD FUNCTION
export const uploadBufferToCloudinary = async (fileBuffer, options = {}) => {
  try {
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
      throw new Error("Invalid file buffer");
    }

    const safeOptions = {
      folder: options.folder || "portfolio",
      resource_type: options.resource_type || "auto",
      public_id: options.public_id || undefined,
      overwrite: true,
    };

    return await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        safeOptions,
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary Upload Error:", error);
            return reject(error);
          }

          console.log("✅ Upload Success:", result.secure_url);
          resolve(result);
        }
      );

      streamifier.createReadStream(fileBuffer).pipe(stream);
    });

  } catch (error) {
    console.error("❌ UPLOAD ERROR:", error);
    throw error;
  }
};

// 🗑️ DELETE FUNCTION
export const destroyCloudinaryAsset = async (
  publicId,
  resourceType = "image"
) => {
  try {
    if (!publicId || typeof publicId !== "string") {
      console.warn("⚠️ Invalid public_id for delete");
      return;
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });

    console.log("🗑️ Deleted from Cloudinary:", publicId);
    return result;

  } catch (error) {
    console.error("❌ Cloudinary Delete Error:", error);
  }
};

// 📦 RESPONSE FORMATTER
export const formatUploadResponse = (result) => {
  if (!result) {
    return {
      message: "Upload failed",
      url: null,
      public_id: null,
    };
  }

  return {
    message: "File uploaded successfully",
    url: result.secure_url,
    public_id: result.public_id,
  };
};