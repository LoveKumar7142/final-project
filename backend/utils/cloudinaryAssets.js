export const uploadBufferToCloudinary = async (fileBuffer, options = {}) => {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    throw new Error("Invalid file buffer");
  }

  const safeOptions = {
    folder: options.folder || "uploads",
    resource_type: options.resource_type || "auto",
  };

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      safeOptions,
      (error, result) => {
        if (result) resolve(result);
        else reject(new Error("Upload failed"));
      },
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

export const destroyCloudinaryAsset = async (
  publicId,
  resourceType = "image",
) => {
  if (!publicId || typeof publicId !== "string") return;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
  } catch (error) {
    console.warn("Cloudinary cleanup failed");
  }
};

export const formatUploadResponse = (result) => ({
  message: "File uploaded successfully",
  url: result.secure_url,
  public_id: result.public_id,
});
