// // middleware/upload.middleware.js
// import multer from "multer";
// import path from "path";
// import fs from "fs";
// import { AppError } from "../../utils/AppError.js";

// const ensureDir = (dir) => {
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//   }
// };

// const IMAGE_DIR = "uploads/images";
// const AUDIO_DIR = "uploads/audio";

// ensureDir(IMAGE_DIR);
// ensureDir(AUDIO_DIR);

// // 📦 Disk storage (production safe)
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (file.fieldname === "images") {
//       return cb(null, IMAGE_DIR);
//     }
//     if (file.fieldname === "voiceNotes") {
//       return cb(null, AUDIO_DIR);
//     }
//     return cb(new AppError("Invalid field", 400));
//   },

//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     const uniqueName = `${file.fieldname}-${Date.now()}-${Math.round(
//       Math.random() * 1e9
//     )}${ext}`;
//     cb(null, uniqueName);
//   },
// });

// // 🛡️ File filter (more tolerant + safe)
// function fileFilter(_req, file, cb) {
//   const isImageField = file.fieldname === "images";
//   const isVoiceField = file.fieldname === "voiceNotes";

//   const mime = file.mimetype || "";

//   // Allow images
//   if (isImageField && mime.startsWith("image/")) {
//     return cb(null, true);
//   }

//   // Allow audio (handle mobile edge cases)
//   if (
//     isVoiceField &&
//     (mime.startsWith("audio/") ||
//       mime === "application/octet-stream")
//   ) {
//     return cb(null, true);
//   }

//   return cb(
//     new AppError(
//       `Invalid file type (${mime}) for field ${file.fieldname}`,
//       400
//     )
//   );
// }

// // 🚀 Multer instance
// export const uploadAssetMedia = multer({
//   storage,
//   fileFilter,
//   limits: {
//     fileSize: 15 * 1024 * 1024, // 15MB per file (safer)
//     files: 60, // total files allowed
//   },
// }).fields([
//   { name: "images", maxCount: 40 },
//   { name: "voiceNotes", maxCount: 10 },
// ]);