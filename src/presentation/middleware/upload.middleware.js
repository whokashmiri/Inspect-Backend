

// middleware/upload.middleware.js
import multer from "multer";
import { AppError } from "../../utils/AppError.js";

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  const isImage = file.fieldname === "images";
  const isVoice = file.fieldname === "voiceNotes";

  if (isImage && file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }

  if (isVoice && file.mimetype.startsWith("audio/")) {
    return cb(null, true);
  }

  return cb(new AppError(`Invalid file type for field ${file.fieldname}`, 400));
}

export const uploadAssetMedia = multer({
  storage,
  fileFilter,
  limits: {
    files: 20,
    fileSize: 25 * 1024 * 1024,
  },
}).fields([
  { name: "images", maxCount: 50 },
  { name: "voiceNotes", maxCount: 5 },
]);