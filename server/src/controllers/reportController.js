// controllers/reportController.js
import prisma from "../config/prisma.js"
import nodemailer from "nodemailer"

export const reportUser = async (req, res) => {
  try {
    const { targetUserId, reason } = req.body

    // 🧩 ตรวจสอบข้อมูลพื้นฐาน
    if (!targetUserId || !reason) {
      return res.status(400).json({ message: "ต้องระบุผู้ใช้และเหตุผล" })
    }

    if (targetUserId === req.user.id) {
      return res.status(400).json({ message: "ไม่สามารถรีพอร์ตตัวเองได้" })
    }

    // 🧱 สร้างรายการรีพอร์ตใหม่
    const report = await prisma.report.create({
      data: {
        reporterId: req.user.id,
        targetUserId: Number(targetUserId),
        reason,
        status: "open",
      },
    })

    // ✅ ดึงรายชื่อแอดมินทั้งหมด
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: { id: true, email: true },
    })

    // 📨 แจ้งเตือนแอดมินทุกคน
    await Promise.all(
      admins.map((admin) =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            type: "report",
            title: "มีการรีพอร์ตผู้ใช้ใหม่",
            body: `ผู้ใช้ ${req.user.email} ได้รีพอร์ตผู้ใช้ ID ${targetUserId}`,
            metadata: { reportId: report.id },
          },
        })
      )
    )

    return res.json({ message: "✅ ส่งรีพอร์ตสำเร็จ และแจ้งเตือนแอดมินแล้ว", report })
  } catch (e) {
    console.error("❌ REPORT USER ERROR:", e)
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการรีพอร์ต" })
  }
}



// ✅ แอดมินดูรีพอร์ตทั้งหมด
export const listReports = async (req, res) => {
  try {
    // ตรวจสอบสิทธิ์แอดมิน
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "ต้องเป็นแอดมินเท่านั้น" })
    }

    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        targetUser: { select: { id: true, name: true, email: true } },
      },
    })

    return res.json(reports)
  } catch (e) {
    console.error("❌ Error fetching reports:", e)
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงรีพอร์ต" })
  }
}

// ✅ แอดมินอัปเดตสถานะรีพอร์ต (ปิดเคส)
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    // ตรวจสอบสิทธิ์แอดมิน
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "ต้องเป็นแอดมินเท่านั้น" })
    }

    const report = await prisma.report.update({
      where: { id: Number(id) },
      data: {
        status,
        resolvedById: req.user.id,
        resolvedAt: new Date(),
      },
    })

    return res.json({ message: "✅ อัปเดตสถานะสำเร็จ", report })
  } catch (e) {
    console.error("❌ UPDATE REPORT ERROR:", e)
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตรีพอร์ต" })
  }
}

export const notifyReportedUser = async (req, res) => {
  try {
    const { id } = req.params
    const { message } = req.body

    const report = await prisma.report.findUnique({
      where: { id: Number(id) },
      include: { targetUser: true, reporter: true },
    })

    if (!report || !report.targetUser?.email) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้เป้าหมาย" })
    }

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "กรุณาพิมพ์ข้อความเตือน" })
    }

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // ✅ ต้องใช้ true ถ้าใช้ port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

    await transporter.sendMail({
      from: `"KuTrading Admin" <${process.env.SMTP_USER}>`,
      to: report.targetUser.email,
      subject: "📢 แจ้งเตือนจาก KuTrading Community",
      html: `
        <h3>ถึงคุณ ${report.targetUser.name || "ผู้ใช้"}</h3>
        <p>ทางผู้ดูแลระบบมีข้อความเตือนดังนี้:</p>
        <blockquote style="background:#f8f8f8;padding:10px;border-left:4px solid #f87171;">
          ${message}
        </blockquote>
        <p style="margin-top:10px">เหตุผลการรีพอร์ต: <b>${report.reason}</b></p>
        <p>หากคุณคิดว่าเป็นความเข้าใจผิด โปรดติดต่อฝ่ายดูแลระบบ</p>
      `,
    })

    return res.json({ message: "ส่งอีเมลแจ้งเตือนสำเร็จ ✅" })
  } catch (e) {
    console.error("EMAIL SEND ERROR:", e)
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการส่งอีเมล" })
  }
}
