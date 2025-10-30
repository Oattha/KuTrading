// C:\marketplace3\server\src\socket.js
import { Server } from "socket.io"

let io

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",              // ✅ สำหรับพัฒนาในเครื่อง
        process.env.CLIENT_URL,               // ✅ สำหรับ production (Render)
      ].filter(Boolean),                      // กรอง null ออก
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],     // ✅ รองรับ fallback
  })

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id)

    // ✅ join ห้อง notification (แบบ handshake)
    const userId = socket.handshake.auth?.userId
    if (userId) {
      socket.join(`user_${userId}`)
      console.log(`🔔 User ${userId} joined notification room (handshake)`)
    }

    // ✅ join ห้อง notification (แบบ register event)
    socket.on("register", ({ userId }) => {
      if (userId) {
        const room = `user_${userId}`
        if (!socket.rooms.has(room)) {
          socket.join(room)
          console.log(`🔔 User ${userId} joined room via register()`)
        }
      }
    })

    // ✅ join ห้องแชท
    socket.on("joinRoom", ({ conversationId }) => {
      socket.join(`conv_${conversationId}`)
      console.log(`➡️ ${socket.id} joined room conv_${conversationId}`)
    })

    // ✅ broadcast ข้อความใหม่
    socket.on("message:new", (msg) => {
      console.log("📩 message:new", msg)
      io.to(`conv_${msg.conversationId}`).emit("message:new", msg)
    })

    // ✅ broadcast การอ่านแล้ว
    socket.on("message:read", ({ conversationId, userId, lastReadMessageId }) => {
      console.log("👁️ message:read", { conversationId, userId, lastReadMessageId })
      io.to(`conv_${conversationId}`).emit("message:read", { userId, lastReadMessageId })
    })

    // ✅ การแจ้งเตือน
    socket.on("notification:read", ({ id }) => {
      if (id) io.emit("notification:read", { id })
    })

    socket.on("notification:markAllRead", () => {
      io.emit("notification:markAllRead")
    })

    socket.on("disconnect", () => {
      console.log("❌ disconnected:", socket.id)
    })
  })

  return io
}

// ✅ ฟังก์ชัน emit event จาก controller
export function getIO() {
  if (!io) {
    if (process.env.NODE_ENV === "test") {
      return { to: () => ({ emit: () => {} }) }
    }
    throw new Error("Socket.io not initialized!")
  }
  return io
}
