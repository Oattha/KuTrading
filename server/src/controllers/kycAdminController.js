import { v2 as cloudinary } from "cloudinary";
import prisma from "../config/prisma.js"


// Admin reject KYC documents
export const rejectKyc = async (req, res) => {
  try {
    const { userId } = req.params; // user ที่จะ reject
    const { reason } = req.body;   // เหตุผลในการ reject
    const adminId = req.user.id;   // แอดมินที่ล็อกอิน

    // หาไฟล์ทั้งหมดของ user
    const docs = await prisma.userDocument.findMany({
      where: { userId: Number(userId), status: "submitted" }
    });

    if (docs.length === 0) {
      return res.status(404).json({ ok: false, message: "No submitted KYC documents found" });
    }

    // ลบไฟล์ออกจาก Cloudinary
    for (const doc of docs) {
      try {
        await cloudinary.uploader.destroy(doc.publicId);
      } catch (err) {
        console.error("Cloudinary delete error:", err.message);
      }
    }

    // ลบเอกสารออกจาก DB
    await prisma.userDocument.deleteMany({
      where: { userId: Number(userId), status: "submitted" }
    });

    // อัปเดตสถานะ user กลับเป็น pending
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { status: "pending" }
    });

    // log action ของแอดมิน
    await prisma.adminActionLog.create({
      data: {
        adminId,
        action: "reject_kyc",
        targetUserId: Number(userId),
        details: { docCount: docs.length },
        reason: reason || null
      }
    });

    res.json({ ok: true, message: `Rejected KYC for user ${userId}`, deletedDocs: docs.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Reject KYC failed", error: err.message });
  }
};

export const uploadKyc = async (req, res) => {
  try {
    const files = req.files; // multer array("files")
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "กรุณาอัปโหลดไฟล์อย่างน้อย 1 ไฟล์" });
    }

    const uploadedDocs = [];
    for (const file of files) {
      // อัปโหลดไป Cloudinary
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "marketplace/kyc",
      });

      // บันทึกลง DB
      const doc = await prisma.userDocument.create({
        data: {
          userId: req.user.id,  // user ที่ login อยู่
          fileUrl: result.secure_url,
          publicId: result.public_id,
          status: "submitted",
        },
      });
      uploadedDocs.push(doc);
    }

    res.json({ ok: true, documents: uploadedDocs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
};