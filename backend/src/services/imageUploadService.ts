import { Readable } from "node:stream";
import cloudinary from "../config/cloudinary.js";
import AppError from "../utils/AppError.js";

interface UploadedImage {
  url: string;
  publicId: string;
}

export const uploadImage = async (
  buffer: Buffer,
  folder: string,
): Promise<UploadedImage> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
      (error, result) => {
        if (error || !result) {
          reject(
            new AppError("Image upload failed", 500),
          );
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    Readable.from(buffer).pipe(stream);
  });
};

export const deleteImage = async (
  publicId: string,
): Promise<void> => {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new AppError("Image deletion failed", 500);
  }
};