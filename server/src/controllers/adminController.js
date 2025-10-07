import prisma from '../config/prisma.js'
import nodemailer from 'nodemailer'

// ⚡ transporter (SMTP — ตอน dev ใช้ Gmail หรือ Mailtrap ก็ได้)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
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
    const { docId } = req.params
    const doc = await prisma.userDocument.update({
      where: { id: Number(docId) },
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
    const { docId } = req.params
    const { reason } = req.body
    const doc = await prisma.userDocument.update({
      where: { id: Number(docId) },
      data: { 
        status: "rejected", 
        reviewedAt: new Date(), 
        reviewedById: req.user.id, 
        note: reason || null   // ✅ ใช้ note แทน rejectionReason
      },
      include: { user: true }
    })

    // ✅ บันทึก log
    await prisma.adminActionLog.create({
      data: {
        adminId: req.user.id,
        action: "reject_kyc",
        targetUserId: doc.userId,
        details: { docId: doc.id },
        reason: reason || null
      }
    })

    // ส่งอีเมลแจ้ง reject
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
      path: doc.fileUrl, // ✅ URL หรือ local path
      cid: "kycImg" // ✅ ต้องตรงกับ src="cid:kycImg"
    }
  ]
})


    return res.json({ message: "KYC rejected", doc })
  } catch (e) {
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
