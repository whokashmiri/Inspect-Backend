// media.controller.js

import cloudinary from "../../infrastructure/cloudinary.js";
import { projectService } from "../../application/project/project.service.js";
import { AppError } from "../../utils/AppError.js";

export const mediaController = {
  async signUpload(req, res) {
    const {
      projectId,
      mediaType,
      target = "asset",
    } = req.body;

    if (!projectId || !mediaType) {
      throw new AppError(
        "projectId and mediaType are required",
        400
      );
    }

    if (!["image", "voice", "video"].includes(mediaType)) {
      throw new AppError("Invalid mediaType", 400);
    }

    if (!["asset", "project"].includes(target)) {
      throw new AppError("Invalid upload target", 400);
    }

    if (target === "project") {
      if (mediaType !== "video") {
        throw new AppError(
          "Only videos can be uploaded to projects",
          400
        );
      }

      // Verify project access before issuing the signature.
      await projectService.getCompanyProjectOrThrow({
        userId: req.userId,
        projectId,
      });
    }

    const timestamp = Math.round(Date.now() / 1000);

    let folder;

    if (target === "project") {
      folder = `projects/${projectId}/videos`;
    } else if (mediaType === "voice") {
      folder = "assets/voice-notes";
    } else if (mediaType === "video") {
      folder = "assets/videos";
    } else {
      folder = "assets/images";
    }

    const resourceType =
      mediaType === "image" ? "image" : "video";

    const publicId =
      `ABM${projectId}_${target}_${mediaType}_${Date.now()}`;

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
      target,
    });
  },
};