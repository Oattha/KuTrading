import express from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js"
import {
  myNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notificationController.js"

const router = express.Router()

// ✅ ดึงการแจ้งเตือนของ user ที่ login
router.get("/", authMiddleware, myNotifications)

// ✅ mark ว่าอ่านแล้ว (ตาม id)
router.patch("/:id/read", authMiddleware, markNotificationRead)

// ✅ mark all ว่าอ่านแล้ว
router.patch("/read-all", authMiddleware, markAllNotificationsRead)

export default router
