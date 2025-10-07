import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "marketplace",   // 📂 โฟลเดอร์ใน Cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "pdf"], // รองรับภาพและไฟล์
  },
});

const upload = multer({ storage });

export default upload;
