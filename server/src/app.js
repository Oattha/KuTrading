import express from 'express'
import cors from 'cors'
import dotenv from "dotenv"
dotenv.config()
import passport from './utils/passport.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import postRoutes from './routes/postRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import tradeRoutes from './routes/tradeRoutes.js'
import tradeChatRoutes from './routes/tradeChatRoutes.js' // ✅ trade chat
import reviewRoutes from './routes/reviewRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import adminRoutes from "./routes/adminRoutes.js"
import reportRoutes from "./routes/reportRoutes.js"

// test system
import testAuthRouter from "./routes/testAuth.js"

const app = express()

// ✅ ตั้งค่า CORS ให้ whitelist เฉพาะ domain ที่อนุญาต
const allowedOrigins = [
  "https://kutrading.onrender.com",  // frontend จริง (Vercel)
  "http://localhost:5173",           // สำหรับตอน dev
]

app.use(
  cors({
    origin: function (origin, callback) {
      // ถ้าไม่มี origin (เช่นจาก Postman) ให้ผ่าน
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: true, // ✅ จำเป็นถ้า frontend ส่ง token
  })
)

app.use(express.json())

app.get('/', (_req, res) => res.send('Marketplace API is running'))

app.use('/api/auth', authRoutes)
app.use("/api/admin", adminRoutes)
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/trades', tradeRoutes)
app.use('/api/trade-chat', tradeChatRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/notifications', notificationRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/reports", reportRoutes)
app.use(passport.initialize())

// สำหรับทดสอบในสภาพแวดล้อมทดสอบเท่านั้น
if (process.env.NODE_ENV === "test") {
  app.use("/api/auth", testAuthRouter)
}

export default app
