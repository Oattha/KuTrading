import prisma from '../config/prisma.js'

// ✅ ดึงโปรไฟล์ตัวเอง
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
        documents: true,   // ✅ เพิ่ม include KYC documents
      },
    })

    if (!me) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.json(me)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Error getting profile' })
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

