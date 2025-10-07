// authMiddleware.js
import { verifyToken } from "../utils/jwt.js"

export const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization || ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  try {
    req.user = verifyToken(token)  // ✅ decode ค่า id, email, role
    next()
  } catch (e) {
    // ❌ แก้จาก 403 → 401
    return res.status(401).json({ message: "Token expired or invalid" })
  }
}

export const adminCheck = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin only" })
  }
  next()
}
