// C:\marketplace3\server\src\socket.js
import { Server } from "socket.io"

let io

export function initSocket(server) {
io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",  // ✅ ใส่ origin ของ frontend ชัดเจน
    methods: ["GET", "POST"],
    credentials: true                 // ✅ ต้องใส่ด้วย
  },
})

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id)

    // join ห้องแชท (แก้ให้รับ object จาก client)
    socket.on("joinRoom", ({ conversationId }) => {
      socket.join(`conv_${conversationId}`)
      console.log(`➡️ ${socket.id} joined room conv_${conversationId}`)
    })

    // broadcast ข้อความใหม่
    socket.on("message:new", (msg) => {
      console.log("📩 message:new", msg)
      io.to(`conv_${msg.conversationId}`).emit("message:new", msg)
    })

    // broadcast การอ่านแล้ว
    socket.on("message:read", ({ conversationId, userId, lastReadMessageId }) => {
      console.log("👁️ message:read", { conversationId, userId, lastReadMessageId })
      io.to(`conv_${conversationId}`).emit("message:read", {
        userId,
        lastReadMessageId,
      })
    })

    socket.on("disconnect", () => {
      console.log("❌ disconnected:", socket.id)
    })
  })

  return io
}

// ฟังก์ชันสำหรับ emit event จาก controller ปกติ
export function getIO() {
  if (!io) throw new Error("Socket.io not initialized!")
  return io
}


