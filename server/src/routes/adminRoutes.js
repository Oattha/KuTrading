import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import prisma from "../config/prisma.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"
import nodemailer from "nodemailer"
import {
  listPendingKyc,
  approveKyc,
  rejectKyc as rejectSingleKyc, // ✅ เปลี่ยนชื่อชัดเจน
  listUsersAdmin,
  toggleBanUser,
  hideReview,
  resolveReport,
  deleteUser
} from "../controllers/adminController.js"

import {
  rejectKyc as rejectUserKyc // ✅ อีกตัวสำหรับ reject หลายไฟล์
} from "../controllers/kycAdminController.js"
import { getAdminLogs } from "../controllers/adminLogController.js";

const router = express.Router()

// Require admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" })
  next()
}

// 🟣 Admin login (เฉพาะ role admin เท่านั้น)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body
    const admin = await prisma.user.findUnique({ where: { email } })

    if (!admin) return res.status(404).json({ message: "User not found" })
    if (admin.role !== "admin")
      return res.status(403).json({ message: "Not authorized" })

    const valid = await bcrypt.compare(password, admin.password || "")
    if (!valid)
      return res.status(401).json({ message: "Invalid email or password" })

    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.json({
      message: "Admin login successful",
      user: { id: admin.id, email: admin.email, role: admin.role },
      token,
    })
  } catch (err) {
    console.error("Admin login error:", err)
    res.status(500).json({ message: "Internal server error" })
  }
})

// ----- KYC -----
router.get("/kyc/pending", authMiddleware, requireAdmin, listPendingKyc)
router.patch("/kyc/:docId/approve", authMiddleware, requireAdmin, approveKyc)
router.patch("/kyc/:docId/reject", authMiddleware, requireAdmin, rejectSingleKyc) // ✅ ทีละไฟล์
router.post("/kyc/:userId/reject", authMiddleware, requireAdmin, rejectUserKyc)   // ✅ ลบหลายไฟล์

// ----- Users -----
router.get("/users", authMiddleware, requireAdmin, listUsersAdmin)
router.patch("/users/:userId/toggle-ban", authMiddleware, requireAdmin, toggleBanUser)
// ✅ เพิ่มเส้นทางลบ user
router.delete("/users/:userId", authMiddleware, requireAdmin, deleteUser)
// ----- Moderation -----
router.patch("/reviews/:reviewId/hide", authMiddleware, requireAdmin, hideReview)
router.patch("/reports/:reportId/resolve", authMiddleware, requireAdmin, resolveReport)

// ----- Test Mail -----
router.get("/test-mail", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: req.user.email,
      subject: "Test mail ✅",
      text: "สวัสดีครับ นี่คือเมลทดสอบจากระบบ Marketplace",
    })

    res.json({ ok: true, messageId: info.messageId })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ----- Logs -----
router.get("/logs", authMiddleware, requireAdmin, getAdminLogs)

export default router
