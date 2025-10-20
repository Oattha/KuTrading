import prisma from '../config/prisma.js'
import bcrypt from "bcryptjs"

// ✅ ดึงโปรไฟล์ตัวเอง
// src/controllers/userController.js
export const getProfile = async (req, res) => {
  try {
    const me = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        posts: {
          include: {
            images: true,
            comments: true,
            likes: true,
          },
        },
        reviewsReceived: true,
        documents: true, // ✅ include KYC documents
      },
    })

    if (!me) {
      return res.status(404).json({ message: "User not found" })
    }

    // ✅ เพิ่มฟิลด์ passwordSet เพื่อให้ front-end รู้ว่าผู้ใช้มีรหัสผ่านหรือไม่
    const userSafe = {
      ...me,
      passwordSet: !!me.password, // true ถ้ามีรหัสผ่านในฐานข้อมูล
    }

    // ❌ ไม่ส่ง password จริงกลับไป (เพื่อความปลอดภัย)
    delete userSafe.password

    return res.json(userSafe)
  } catch (err) {
    console.error("Error in getProfile:", err)
    return res.status(500).json({ message: "Error getting profile" })
  }
}

// ✅ อัปเดตโปรไฟล์
export const updateProfile = async (req, res) => {
  try {
    const { name, bio, avatarUrl } = req.body
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, bio, avatarUrl },
    })
    return res.json(updated)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Error updating profile' })
  }
}

// ✅ ลิสต์ users ทั้งหมด
export const listUsers = async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        ratingAverage: true,
        ratingCount: true,
        avatarUrl: true,
        status: true,   // ✅ เผื่อ admin ใช้ดูว่า user active/pending/banned
      },
    })
    return res.json(users)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Error listing users' })
  }
}

// ✅ อัปโหลดรูปโปรไฟล์ (ใช้ Cloudinary)
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ ok: false, error: 'No file uploaded' })
    }

    const imageUrl = req.file.path // Cloudinary ส่ง URL กลับมา
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: imageUrl },
    })

    return res.json({ ok: true, url: updated.avatarUrl })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ ok: false, error: 'Upload failed' })
  }
}


// ✅ ดึงโปรไฟล์ user ตาม id
export const getUserById = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        posts: {
          include: { images: true, comments: true, likes: true },
        },
        reviewsReceived: true,
      },
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    return res.json(user)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Error getting user by id" })
  }
}

// ✅ ตั้งรหัสผ่าน (เฉพาะผู้ที่ login อยู่)
export const setPassword = async (req, res) => {
  try {
    const userId = req.user.id
    const { oldPassword, password } = req.body

    if (!password) {
      return res.status(400).json({ message: "กรุณากรอกรหัสผ่านใหม่" })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" })

    // 🔐 ถ้ามี password อยู่แล้ว → ต้องตรวจสอบรหัสเก่า
    if (user.password) {
      if (!oldPassword) {
        return res.status(400).json({ message: "กรุณากรอกรหัสผ่านเดิมก่อน" })
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password)
      if (!isMatch) {
        return res.status(401).json({ message: "รหัสผ่านเดิมไม่ถูกต้อง" })
      }
    }

    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    })

    return res.json({
      message: user.password ? "เปลี่ยนรหัสผ่านสำเร็จ" : "ตั้งรหัสผ่านสำเร็จ",
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการตั้งรหัสผ่าน" })
  }
}

export const verifyPassword = async (req, res) => {
  try {
    const userId = req.user.id
    const { oldPassword } = req.body

    if (!oldPassword)
      return res.status(400).json({ message: "กรุณากรอกรหัสผ่านเดิม" })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" })
    if (!user.password)
      return res.status(400).json({ message: "บัญชียังไม่มีรหัสผ่าน" })

    const match = await bcrypt.compare(oldPassword, user.password)
    if (!match)
      return res.status(401).json({ message: "รหัสผ่านเดิมไม่ถูกต้อง" })

    return res.json({ message: "รหัสผ่านถูกต้อง" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน" })
  }
}
