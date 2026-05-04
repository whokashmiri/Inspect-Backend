import cloudinary from "../../infrastructure/cloudinary.js";
import { AppError } from "../../utils/AppError.js";

export const mediaController = {
  async signUpload(req, res) {
    const { projectId, mediaType } = req.body;

    if (!projectId || !mediaType) {
      throw new AppError("projectId and mediaType are required", 400);
    }

    const isVoice = mediaType === "voice";

    const timestamp = Math.round(Date.now() / 1000);
    const folder = isVoice ? "assets/voice-notes" : "assets/images";
    const publicId = `ABM${projectId}_${Date.now()}`;

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
      resourceType: isVoice ? "video" : "image",
    });
  },
};