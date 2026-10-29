import multer from "multer";
import AppError from "../utils/AppError.js";

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new AppError(
          "Only JPEG, PNG, and WebP images are allowed",
          400,
        ),
      );
    }

    callback(null, true);
  },
});

export default upload;