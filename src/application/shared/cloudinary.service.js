import { Readable } from "stream";
import cloudinary from "../../infrastructure/cloudinary.js";
import { AppError } from "../../utils/AppError.js";

function uploadBuffer({ buffer, folder, resourceType, publicId }) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: publicId,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

export const cloudinaryService = {
  async uploadImage(file, assetKey) {
    try {
      const result = await uploadBuffer({
        buffer: file.buffer,
        folder: "assets/images",
        resourceType: "image",
        publicId: `ABM${assetKey}-${Date.now()}`,
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch {
      throw new AppError("Failed to upload image", 500);
    }
  },

  async uploadVoiceNote(file, assetKey) {
    try {
      const result = await uploadBuffer({
        buffer: file.buffer,
        folder: "assets/voice-notes",
        resourceType: "video", // correct for audio in Cloudinary
        publicId: `ABM${assetKey}-${Date.now()}`,
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        duration:
          typeof result.duration === "number"
            ? Math.round(result.duration)
            : null,
      };
    } catch {
      throw new AppError("Failed to upload voice note", 500);
    }
  },
};