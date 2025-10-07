import prisma from '../config/prisma.js'
import bcrypt from 'bcryptjs'
import { signToken } from '../utils/jwt.js'
import jwt from 'jsonwebtoken' 

const signRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }  // refreshToken อายุ 7 วัน
  )
}

export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'email & password required' })
    }

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return res.status(409).json({ message: 'Email already in use' })
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { email, password: hashed, name },
      include: { documents: true },
    })

    const token = signToken(user)
    const refreshToken = signRefreshToken(user)  // ✅ generate refreshToken

    const { password: _, ...userSafe } = user

    return res.json({
      message: 'User registered',
      token,
      refreshToken,   // ✅ ไม่เป็น undefined แล้ว
      user: userSafe,
    })
  } catch (err) {
    return res.status(500).json({ message: 'Error registering', error: err.message })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        documents: {
          select: {
            id: true,
            status: true,
            fileUrl: true,
            reviewedAt: true,
          },
        },
      },
    })

    if (!user) return res.status(404).json({ message: 'User not found' })

    if (user.status === 'banned') {
      return res.status(403).json({ message: 'บัญชีนี้ถูกแบน กรุณาติดต่อผู้ดูแลระบบ' })
    }

    const valid = await bcrypt.compare(password, user.password || '')
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' })

    const token = signToken(user)
    const refreshToken = signRefreshToken(user)  // ✅ generate refreshToken

    const { password: _, ...userSafe } = user

    return res.json({
      message: 'Login successful',
      token,
      refreshToken,   // ✅ ไม่เป็น undefined แล้ว
      user: userSafe,
    })
  } catch (err) {
    return res.status(500).json({ message: 'Error logging in', error: err.message })
  }
}


// ✅ ฟังก์ชัน refresh token
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ message: "Refresh token required" })

    let decoded
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)
    } catch {
      return res.status(401).json({ message: "Invalid or expired refresh token" })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { documents: true }
    })
    if (!user) return res.status(404).json({ message: "User not found" })

    // ออก token ใหม่ทั้งคู่
    const newAccessToken = signToken(user)
    const newRefreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" })

    const { password, ...userSafe } = user

    return res.json({
      message: "Token refreshed",
      token: newAccessToken,
      refreshToken: newRefreshToken,   // ✅ ส่ง refreshToken ใหม่กลับไปด้วย
      user: userSafe
    })
  } catch (err) {
    return res.status(500).json({ message: "Error refreshing token", error: err.message })
  }
}

