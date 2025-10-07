import dotenv from 'dotenv'
import http from 'http'            // ✅ เพิ่ม
import app from './app.js'
import { initSocket } from "./socket.js"

dotenv.config()
const PORT = process.env.PORT || 5001

// ✅ สร้าง http server จาก express app
const server = http.createServer(app)

// ✅ เริ่ม Socket.IO โดยส่ง server เข้าไป
initSocket(server)

// ✅ ใช้ server.listen แทน app.listen
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
})
