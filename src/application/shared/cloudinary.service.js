// application/shared/cloudinary.service.js
import { Readable } from "stream";
import cloudinary from "../../infrastructure/cloudinary.js";
import { AppError } from "../../utils/AppError.js";

function uploadBuffer({
  buffer,
  folder,
  resourceType,
  publicId,
}) {
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
        resourceType: "video",
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
      throw new AppError(
        "Failed to upload voice note",
        500
      );
    }
  },

  async getProjectVideo({ projectId, publicId }) {
    const normalizedProjectId =
      String(projectId || "").trim();

    const normalizedPublicId =
      String(publicId || "").trim();

    if (!normalizedProjectId) {
      throw new AppError("Project ID is required", 400);
    }

    if (!normalizedPublicId) {
      throw new AppError(
        "Cloudinary publicId is required",
        400
      );
    }

    const expectedPrefix =
      `projects/${normalizedProjectId}/videos/`;

    if (!normalizedPublicId.startsWith(expectedPrefix)) {
      throw new AppError(
        "Video does not belong to this project",
        400
      );
    }

    try {
      const result = await cloudinary.api.resource(
        normalizedPublicId,
        {
          resource_type: "video",
          type: "upload",
        }
      );

      const format = String(
        result.format || "mp4"
      ).toLowerCase();

      const mimeTypes = {
        mp4: "video/mp4",
        mov: "video/quicktime",
        webm: "video/webm",
        avi: "video/x-msvideo",
        mkv: "video/x-matroska",
      };

      const thumbnailUrl = cloudinary.url(
        result.public_id,
        {
          secure: true,
          resource_type: "video",
          type: "upload",
          format: "jpg",
          transformation: [
            {
              start_offset: "0",
            },
          ],
        }
      );

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format,
        mimeType:
          mimeTypes[format] || `video/${format}`,
        sizeBytes: Number(result.bytes || 0),
        duration:
          typeof result.duration === "number"
            ? Math.round(result.duration)
            : null,
        thumbnailUrl,
      };
    } catch (error) {
      const statusCode = Number(
        error?.http_code ||
          error?.error?.http_code ||
          0
      );

      if (statusCode === 404) {
        throw new AppError(
          "Project video was not found in Cloudinary",
          404
        );
      }

      throw new AppError(
        "Failed to verify project video",
        500
      );
    }
  },
};