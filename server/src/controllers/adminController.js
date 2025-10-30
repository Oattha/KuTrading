import prisma from '../config/prisma.js'
import nodemailer from 'nodemailer'

// ⚡ transporter (SMTP — ตอน dev ใช้ Gmail หรือ Mailtrap ก็ได้)
// ⚡ transporter (SMTP — ใช้ Brevo)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,        // ✅ smtp-relay.brevo.com
  port: Number(process.env.SMTP_PORT), // ✅ 587
  secure: false, // ❌ ห้ามใช้ true ถ้าเป็น port 587
  auth: {
    user: process.env.SMTP_USER,       // ✅ 9a5a54001@smtp-brevo.com
    pass: process.env.SMTP_PASS,       // ✅ xsmtpsib-xxxx...
  },
})


// =====================
// KYC Verification
// =====================
export const listPendingKyc = async (_req, res) => {
  try {
    const docs = await prisma.userDocument.findMany({
      where: { status: "submitted" },
      include: { user: true }
    })
    return res.json(docs)
  } catch (e) {
    return res.status(500).json({ message: "Error listing pending KYC", error: e.message })
  }
}

export const approveKyc = async (req, res) => {
  try {
    const { id } = req.params   // ✅ แก้จาก docId → id
    const doc = await prisma.userDocument.update({
      where: { id: Number(id) }, // ✅ แก้ docId → id
      data: { 
        status: "approved", 
        reviewedAt: new Date(), 
        reviewedById: req.user.id 
      },
      include: { user: true }
    })

    // ✅ บันทึก log
    await prisma.adminActionLog.create({
      data: {
        adminId: req.user.id,
        action: "approve_kyc",
        targetUserId: doc.userId,
        details: { docId: doc.id }
      }
    })

    // ส่งอีเมลแจ้ง approve
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: doc.user.email,
      subject: "KYC Approved ✅",
      text: `สวัสดี ${doc.user.name || "ผู้ใช้"}, เอกสารของคุณได้รับการอนุมัติแล้ว`
    })

    return res.json({ message: "KYC approved. กรุณา logout และ login ใหม่", doc })
  } catch (e) {
    return res.status(500).json({ message: "Error approving KYC", error: e.message })
  }
}

export const rejectKyc = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    const doc = await prisma.userDocument.update({
      where: { id: Number(id) },
      data: { 
        status: "rejected", 
        reviewedAt: new Date(), 
        reviewedById: req.user.id, 
        note: reason || null
      },
      include: { user: true }
    })

    await prisma.adminActionLog.create({
      data: {
        adminId: req.user.id,
        action: "reject_kyc",
        targetUserId: doc.userId,
        details: { docId: doc.id },
        reason: reason || null
      }
    })

    // ✅ เพิ่ม log debug
    console.log("📤 Sending reject email to:", doc.user.email)
    console.log("🖼️ File URL:", doc.fileUrl)

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: doc.user.email,
        subject: "KYC Rejected ❌",
        html: `
          <p>สวัสดี ${doc.user.name || "ผู้ใช้"},</p>
          <p>เอกสารของคุณถูกปฏิเสธ ❌</p>
          <p><b>เหตุผล:</b> ${reason}</p>
          <p>รูปที่คุณส่งมา:</p>
          <img src="cid:kycImg" style="max-width:400px;" />
        `,
        attachments: [
          {
            filename: "kyc.jpg",
            path: doc.fileUrl,
            cid: "kycImg",
          },
        ],
      })
      console.log("✅ Email sent successfully!")
    } catch (mailErr) {
      console.error("❌ Email send error:", mailErr)
    }

    return res.json({ message: "KYC rejected", doc })
  } catch (e) {
    console.error("❌ rejectKyc error:", e)
    return res.status(500).json({ message: "Error rejecting KYC", error: e.message })
  }
}


// =====================
// User Management
// =====================
export const listUsersAdmin = async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        documents: true, // ✅ ใช้ชื่อ relation ที่ตรงกับ schema
      },
    })
    return res.json(users)
  } catch (e) {
    console.error("❌ listUsersAdmin error:", e)
    return res.status(500).json({ message: "Error listing users", error: e.message })
  }
}

export const toggleBanUser = async (req, res) => {
  try {
    const { userId } = req.params
    const u = await prisma.user.findUnique({ where: { id: Number(userId) } })
    if (!u) return res.status(404).json({ message: "User not found" })

    const updated = await prisma.user.update({
      where: { id: u.id },
      data: { status: u.status === "banned" ? "active" : "banned" } // ✅ toggle
    })
    return res.json(updated)
  } catch (e) {
    console.error("❌ toggleBanUser error:", e)
    return res.status(500).json({ message: "Error toggling ban", error: e.message })
  }
}

// =====================
// Moderation
// =====================
export const hideReview = async (req, res) => {
  try {
    const { reviewId } = req.params
    const updated = await prisma.review.update({
      where: { id: Number(reviewId) },
      data: { hidden: true }
    })
    return res.json({ message: "Review hidden", updated })
  } catch {
    return res.status(500).json({ message: "Error hiding review" })
  }
}

export const resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params
    const updated = await prisma.report.update({
      where: { id: Number(reportId) },
      data: { resolvedAt: new Date(), resolvedById: req.user.id }
    })
    return res.json({ message: "Report resolved", updated })
  } catch {
    return res.status(500).json({ message: "Error resolving report" })
  }
}

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      include: {
        documents: true,
        posts: true,
        tradesAsBuyer: true,
        tradesAsSeller: true,
      },
    })

    if (!user) return res.status(404).json({ message: "User not found" })

    // ✅ ลบ KYC, Post, Trade
    await prisma.userDocument.deleteMany({ where: { userId: user.id } })
    await prisma.post.deleteMany({ where: { authorId: user.id } })
    await prisma.trade.deleteMany({
      where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    })

    // ✅ log ก่อนลบ
    await prisma.adminActionLog.create({
      data: {
        adminId: req.user.id,
        action: "delete_user",
        targetUserId: user.id,
        details: { email: user.email },
      },
    })

    // ✅ แล้วค่อยลบ user
    await prisma.user.delete({ where: { id: user.id } })

    // ✅ ส่งอีเมลแจ้ง (optional)
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: user.email,
        subject: "Account Deleted ❌",
        text: `สวัสดี ${user.name || "ผู้ใช้"}, บัญชีของคุณถูกลบออกโดยผู้ดูแลระบบ`,
      })
    } catch (e) {
      console.warn("⚠️ Failed to send deletion email:", e.message)
    }

    return res.json({ message: `User ${user.email} deleted successfully` })
  } catch (e) {
    console.error("❌ deleteUser error:", e)
    return res.status(500).json({ message: "Error deleting user", error: e.message })
  }
}
