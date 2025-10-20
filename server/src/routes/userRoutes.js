import express from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js"
import upload from "../middlewares/upload.js"
import {
  getProfile,
  updateProfile,
  listUsers,
  uploadProfilePicture,getUserById, setPassword, verifyPassword
} from "../controllers/userController.js"
import { checkUserStatus } from "../middlewares/checkUserStatus.js"
import { uploadKyc } from "../controllers/kycController.js"   // ⬅️ เพิ่มตรงนี้

const router = express.Router()

router.get("/me", authMiddleware, getProfile)
router.put("/me", authMiddleware, updateProfile)
router.get("/", listUsers)
router.post("/profile-picture", authMiddleware, upload.single("file"), uploadProfilePicture)
router.get("/:id", getUserById)
// ตั้งรหัสผ่าน (สำหรับผู้ใช้ที่ลงทะเบียนผ่าน OAuth)
router.post("/set-password", authMiddleware, setPassword);

router.post("/verify-password", authMiddleware, verifyPassword)
// อัปโหลดเอกสาร KYC
router.post(
  "/kyc",
  authMiddleware,
  upload.array("files", 5),   // อัปโหลดได้ทีละหลายไฟล์
  uploadKyc
)

export default router
