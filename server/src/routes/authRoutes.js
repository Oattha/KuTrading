import express from 'express'
import { register, login , refresh  } from '../controllers/authController.js'
import passport from "../utils/passport.js"
const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)

// ✅ Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
)

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login", // หรือ path ที่คุณต้องการเมื่อ login ไม่สำเร็จ
    session: false,
  }),
  (req, res) => {
    // ที่นี่ req.user จะถูกตั้งโดย strategy callback ข้างบน
    const { user, token, refreshToken } = req.user

    // ส่งผลกลับไป front-end
    // คุณอาจจะ redirect ไปหน้า front-end พร้อม query string token หรือ return JSON
    // เช่น:
    const frontEndUrl = process.env.CLIENT_URL || "http://localhost:5173"
    // redirect พร้อม token, refreshToken
    return res.redirect(
      `${frontEndUrl}/oauth-success?token=${token}&refreshToken=${refreshToken}`
    )
  }
)


export default router
