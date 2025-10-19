import express from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js"
import { reportUser, 
    listReports, 
    updateReportStatus,
    notifyReportedUser
 } from "../controllers/reportController.js"

const router = express.Router()

// 🧾 ผู้ใช้รีพอร์ต
router.post("/user", authMiddleware, reportUser)

// 🧾 แอดมินดูทั้งหมด
router.get("/", authMiddleware, listReports)

// 🧾 แอดมินอัปเดตสถานะรีพอร์ต
router.put("/:id/status", authMiddleware, updateReportStatus)

router.post("/:id/notify", authMiddleware, notifyReportedUser)

export default router
