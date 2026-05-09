import cloudinary from "../../infrastructure/cloudinary.js";
import { AppError } from "../../utils/AppError.js";

export const mediaController = {
  async signUpload(req, res) {
    const { projectId, mediaType } = req.body;

    if (!projectId || !mediaType) {
      throw new AppError("projectId and mediaType are required", 400);
    }

    if (!["image", "voice", "video"].includes(mediaType)) {
      throw new AppError("Invalid mediaType", 400);
    }

    const timestamp = Math.round(Date.now() / 1000);

    const folder =
      mediaType === "voice"
        ? "assets/voice-notes"
        : mediaType === "video"
        ? "assets/videos"
        : "assets/images";

    const resourceType =
      mediaType === "image" ? "image" : "video";

    const publicId = `ABM${projectId}_${mediaType}_${Date.now()}`;

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
        public_id: publicId,
      },
      process.env.CLOUDINARY_API_SECRET
    );

    return res.status(200).json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      signature,
      folder,
      publicId,
      resourceType,
    });
  },
};