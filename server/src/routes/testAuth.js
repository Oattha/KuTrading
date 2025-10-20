import express from "express"
import jwt from "jsonwebtoken"

const router = express.Router()

if (process.env.NODE_ENV === "test") {
  router.post("/test-login", (req, res) => {
    const { id = 1, email = "testuser@gmail.com" } = req.body
    const token = jwt.sign(
      { id, email, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    )
    return res.json({ token })
  })
}

export default router
