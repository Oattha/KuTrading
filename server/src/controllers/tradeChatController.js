import prisma from "../config/prisma.js"
import { v2 as cloudinary } from "cloudinary"
import fs from "fs/promises"
import { getIO } from "../socket.js"   // ✅ ใช้ socket.io

// ===== [TRADE CHAT] หา/สร้างห้องแชท Trade =====
export const upsertTradeConversation = async (req, res) => {
  try {
    const { tradeId } = req.params
    const userId = req.user.id

    // ✅ ดึงข้อมูล trade
    const trade = await prisma.trade.findUnique({
      where: { id: Number(tradeId) },
      include: { buyer: true, seller: true },
    })
    if (!trade) return res.status(404).json({ message: "Trade not found" })

    // ✅ หา conversation เดิม
    let conversation = await prisma.conversation.findFirst({
      where: { tradeId: trade.id, type: "trade" },
      include: { participants: true },
    })

    // ✅ ถ้าไม่มี → สร้างใหม่
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          type: "trade",
          tradeId: trade.id,
          isGroup: false,
          participants: {
            create: [
              { userId: trade.buyerId },
              { userId: trade.sellerId },
            ],
          },
        },
        include: { participants: { include: { user: true } } },
      })
    }

    return res.json(conversation)
  } catch (err) {
    console.error("Error upsertTradeConversation", err)
    return res.status(500).json({ message: "Error creating trade conversation" })
  }
}

// ===== [TRADE CHAT] ดึงห้องแชท Trade ของฉัน =====
export const myTradeConversations = async (req, res) => {
  try {
    const userId = req.user.id

    const conversations = await prisma.conversation.findMany({
      where: { type: "trade", participants: { some: { userId } } },
      include: {
        participants: { include: { user: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        trade: {
          include: { post: { select: { id: true, content: true, images: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    // ✅ เพิ่ม unreadCount
    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            reads: { none: { userId } },
          },
        })
        return { ...conv, unreadCount }
      })
    )

    return res.json(withUnread)
  } catch (err) {
    console.error("Error myTradeConversations", err)
    return res.status(500).json({ message: "Error fetching trade conversations" })
  }
}

// ===== [TRADE CHAT] ส่งข้อความ =====
export const sendTradeMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body
    const userId = req.user.id

    if (!conversationId) return res.status(400).json({ message: "conversationId required" })
    if (!(text || req.file)) return res.status(400).json({ message: "text or file required" })

    let mediaUrl = null
    let type = "text"

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "marketplace/messages",
      })
      mediaUrl = result.secure_url
      type = "image"
      if (req.file.path) await fs.unlink(req.file.path).catch(() => {})
    }

    const msg = await prisma.message.create({
      data: {
        conversationId: Number(conversationId),
        senderId: userId,
        type,
        text: text || null,
        mediaUrl,
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    // ✅ update lastMessageAt
    await prisma.conversation.update({
      where: { id: Number(conversationId) },
      data: { lastMessageAt: new Date() },
    })

    // ✅ broadcast realtime
    getIO().to(`conv_${conversationId}`).emit("message:new", msg)

    return res.json(msg)
  } catch (err) {
    console.error("Error sendTradeMessage", err)
    return res.status(500).json({ message: "Error sending trade message" })
  }
}

// ===== [TRADE CHAT] Mark ว่าอ่านแล้ว =====
export const markTradeConversationRead = async (req, res) => {
  try {
    const { conversationId } = req.params
    const userId = req.user.id

    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId: Number(conversationId),
        senderId: { not: userId },
        reads: { none: { userId } },
      },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    })

    if (unreadMessages.length === 0) {
      return res.json({ message: "No unread messages" })
    }

    await prisma.messageRead.createMany({
      data: unreadMessages.map(m => ({ messageId: m.id, userId })),
      skipDuplicates: true,
    })

    getIO().to(`conv_${conversationId}`).emit("message:read", {
      userId,
      lastReadMessageId: unreadMessages[unreadMessages.length - 1].id,
    })

    return res.json({ message: "Marked as read", count: unreadMessages.length })
  } catch (err) {
    console.error("Error markTradeConversationRead", err)
    return res.status(500).json({ message: "Error marking trade conversation read" })
  }
}
