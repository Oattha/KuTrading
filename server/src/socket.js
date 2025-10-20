// C:\marketplace3\server\src\socket.js
import { Server } from "socket.io"

let io

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // ✅ frontend
      methods: ["GET", "POST"],
      credentials: true,
    },
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
          // ✅ กัน join ซ้ำ
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
      io.to(`conv_${conversationId}`).emit("message:read", {
        userId,
        lastReadMessageId,
      })
    })

    // ✅ รับ event เมื่อ frontend แจ้งว่าอ่าน noti แล้ว
    socket.on("notification:read", ({ id }) => {
      if (!id) return
      console.log("👁️ notification:read from client", id)
      io.emit("notification:read", { id }) // broadcast ไปทุก client
    })

    // ✅ รับ event เมื่อ frontend แจ้งว่าอ่านทั้งหมดแล้ว
    socket.on("notification:markAllRead", () => {
      console.log("✅ notification:markAllRead from client")
      io.emit("notification:markAllRead")
    })

    socket.on("disconnect", () => {
      console.log("❌ disconnected:", socket.id)
    })
  })

  return io
}

// ✅ ฟังก์ชันสำหรับ emit event จาก controller
export function getIO() {
  if (!io) {
    // 🧪 mock สำหรับโหมดเทสต์ (Jest)
    if (process.env.NODE_ENV === "test") {
      return {
        to: () => ({
          emit: () => {
            // mock เงียบ ๆ เพื่อไม่ให้ error ในเทสต์
          },
        }),
      }
    }

    // ❌ โหมดปกติถ้าไม่ได้ initSocket ให้แจ้งเตือนจริง
    throw new Error("Socket.io not initialized!")
  }

  return io
}
