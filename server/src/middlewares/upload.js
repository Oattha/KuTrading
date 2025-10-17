import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "marketplace",
    allowed_formats: ["jpg", "png", "jpeg", "pdf", "mp4", "mov", "avi"], // ✅ เพิ่มวิดีโอ
    resource_type: "auto", // ✅ สำคัญมาก ต้องเพิ่ม
  },
});


const upload = multer({ storage });

export default upload;
