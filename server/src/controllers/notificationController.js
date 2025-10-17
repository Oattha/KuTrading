import prisma from "../config/prisma.js"
import { getIO } from "../socket.js"

// ✅ ดึงการแจ้งเตือนของ user ที่ login (limit 50)
export const myNotifications = async (req, res) => {
  try {
    const list = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    return res.json(list)
  } catch (e) {
    console.error("Error fetching notifications:", e)
    return res.status(500).json({ message: "Error fetching notifications" })
  }
}

// ✅ mark ว่าอ่านแล้ว (เฉพาะ noti ของ user เอง)
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params
    const notif = await prisma.notification.updateMany({
      where: { id: Number(id), userId: req.user.id },
      data: { isRead: true },
    })

    // 🔔 แจ้ง frontend realtime
    getIO().to(`user_${req.user.id}`).emit("notification:read", { id: Number(id) })

    return res.json({ ok: true, updated: notif.count })
  } catch (e) {
    console.error("Error marking notification read:", e)
    return res.status(500).json({ message: "Error marking notification read" })
  }
}

// ✅ mark all ว่าอ่านแล้ว
export const markAllNotificationsRead = async (req, res) => {
  try {
    const notif = await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    })

    // 🔔 แจ้ง frontend realtime ให้ clear dot
    getIO().to(`user_${req.user.id}`).emit("notification:markAllRead")

    return res.json({ ok: true, updated: notif.count })
  } catch (e) {
    console.error("Error marking all notifications read:", e)
    return res.status(500).json({ message: "Error marking all read" })
  }
}


// ✅ สร้างการแจ้งเตือนใหม่
export const createNotification = async (userId, data) => {
  try {
    // บันทึกลง DB
    const notif = await prisma.notification.create({
      data: {
        userId,
        type: data.type || "system",
        title: data.title || null,
        body: data.body || null,
        metadata: data.metadata || {},
      },
    })

    // ส่ง realtime ไปยัง user นั้น
    getIO().to(`user_${userId}`).emit("notification:new", notif)

    return notif
  } catch (e) {
    console.error("Error creating notification:", e)
    throw e
  }
}
