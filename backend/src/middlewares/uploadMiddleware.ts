import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import AppError from "../utils/AppError.js";

const uploadPath = "/tmp/uploads";

fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination(_req, _file, callback) {
    callback(null, uploadPath);
  },
  filename(_req, file, callback) {
    callback(null, `${randomUUID()}.xlsx`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (extension !== ".xlsx") {
    callback(
      new AppError("Only .xlsx Excel files are supported.", 400),
    );
    return;
  }
  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 5,
    parts: 6,
  },
});

export default upload;