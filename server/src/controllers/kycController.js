import prisma from "../config/prisma.js"
import cloudinary from "../config/cloudinary.js"

// อัปโหลดเอกสาร KYC (หลายไฟล์)
export const uploadKyc = async (req, res) => {
  try {
    const files = req.files
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "กรุณาอัปโหลดไฟล์อย่างน้อย 1 ไฟล์" })
    }

    const uploadedDocs = []

    for (const file of files) {
      // อัปโหลดไฟล์ไป Cloudinary
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "marketplace/kyc",
      })

      // บันทึก DB
      const doc = await prisma.userDocument.create({
        data: {
          userId: req.user.id,
          fileUrl: result.secure_url,
          publicId: result.public_id,
          status: "submitted",
        },
      })

      uploadedDocs.push(doc)
    }

    res.json({ ok: true, documents: uploadedDocs })
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, error: err.message })
  }
}
