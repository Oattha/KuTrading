import prisma from '../config/prisma.js'
import { v2 as cloudinary } from "cloudinary"
import fs from "fs/promises"
import { getIO } from "../socket.js"   // ✅ เพิ่มมาใช้ socket

export const upsertOneToOneConversation = async (req, res) => {
  try {
    const { otherUserId } = req.body
    if (!otherUserId) return res.status(400).json({ message: 'otherUserId required' })
    if (Number(otherUserId) === req.user.id)
      return res.status(400).json({ message: 'cannot chat with yourself' })

    // ✅ ค้นหาห้องที่เป็น private จริงๆ (ไม่รวม trade)
    const existing = await prisma.conversation.findFirst({
      where: {
        type: "private",
        isGroup: false,
        AND: [
          { participants: { some: { userId: req.user.id } } },
          { participants: { some: { userId: Number(otherUserId) } } },
        ],
      },
      include: { participants: true },
    })

    if (existing) {
      console.log("🟢 Found existing private conversation:", existing.id)
      return res.json(existing)
    }

    // ✅ ถ้าไม่เจอให้สร้างใหม่
    const conv = await prisma.conversation.create({
      data: {
        type: "private", // ⬅️ สำคัญมาก
        isGroup: false,
        participants: {
          create: [
            { userId: req.user.id },
            { userId: Number(otherUserId) },
          ],
        },
      },
      include: { participants: true },
    })

    console.log("🆕 Created new private conversation:", conv.id)
    return res.json(conv)
  } catch (e) {
    console.error("❌ Error creating conversation:", e)
    return res.status(500).json({ message: 'Error creating conversation', error: e.message })
  }
}


// ===== ดึงห้องทั้งหมดที่ user เข้าร่วม + นับ unread =====
export const myConversations = async (req, res) => {
  try {
    const userId = req.user.id

    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    })

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
  } catch (e) {
    console.error("Error fetching conversations", e)
    return res.status(500).json({ message: "Error fetching conversations" })
  }
}

// ===== mark conversation ว่าอ่านแล้ว =====
export const markConversationRead = async (req, res) => {
  try {
    const userId = req.user.id
    const { conversationId } = req.params

    const messages = await prisma.message.findMany({
      where: {
        conversationId: Number(conversationId),
        senderId: { not: userId },
        reads: { none: { userId } },
      },
      select: { id: true },
      orderBy: { createdAt: "asc" }
    })

    if (messages.length === 0) {
      return res.json({ message: "No unread messages" })
    }

    await prisma.messageRead.createMany({
      data: messages.map((m) => ({
        messageId: m.id,
        userId,
      })),
      skipDuplicates: true,
    })

    // ✅ Broadcast event ว่า user นี้อ่านแล้ว
    getIO().to(`conv_${conversationId}`).emit("message:read", {
      userId,
      lastReadMessageId: messages[messages.length - 1].id
    })

    return res.json({ message: "Marked as read", count: messages.length })
  } catch (e) {
    console.error("Error marking conversation read", e)
    return res.status(500).json({ message: "Error marking conversation read" })
  }
}

// === ส่งข้อความ ===
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body

    if (!conversationId && !req.file) {
      return res.status(400).json({ message: "conversationId required" })
    }
    if (!(text || req.file)) {
      return res.status(400).json({ message: "text or file required" })
    }

    let mediaUrl = null
    let type = "text"

    if (req.file) {
      try {
        let uploadResult
        // 🎥 ถ้าเป็นวิดีโอ
        if (req.file.mimetype.startsWith("video")) {
          uploadResult = await cloudinary.uploader.upload_large(req.file.path, {
            resource_type: "video",
            folder: "marketplace/messages",
            chunk_size: 6000000,
          })
          type = "video"
        } else {
          // 🖼️ ถ้าเป็นรูป
          uploadResult = await cloudinary.uploader.upload(req.file.path, {
            folder: "marketplace/messages",
          })
          type = "image"
        }

        mediaUrl = uploadResult.secure_url
        await fs.unlink(req.file.path).catch(() => {})
      } catch (err) {
        console.error("Cloudinary upload error:", err)
        return res.status(500).json({ message: "Error uploading file" })
      }
    }

    const msg = await prisma.message.create({
      data: {
        conversationId: Number(conversationId),
        senderId: req.user.id,
        type,
        text: text || null,
        mediaUrl,
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        conversation: { select: { id: true } },
      },
    })

    await prisma.conversation.update({
      where: { id: Number(conversationId) },
      data: { lastMessageAt: new Date() },
    })

    const conv = await prisma.conversation.findUnique({
      where: { id: Number(conversationId) },
      include: { participants: true },
    })

    const otherIds = conv.participants
      .map((p) => p.userId)
      .filter((uid) => uid !== req.user.id)

    if (otherIds.length > 0) {
      await prisma.notification.createMany({
        data: otherIds.map((uid) => ({
          userId: uid,
          type: "message",
          title: "ข้อความใหม่",
          body:
            type === "video"
              ? "🎥 วิดีโอใหม่"
              : type === "image"
              ? "📷 รูปภาพใหม่"
              : text,
        })),
      })
    }

    const payload = { ...msg, conversationId: msg.conversation.id }
    getIO().to(`conv_${conversationId}`).emit("message:new", payload)
    return res.json(payload)
  } catch (e) {
    console.error("Error sending message:", e)
    return res
      .status(500)
      .json({ message: "Error sending message", error: e.message })
  }
}


export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params
    const items = await prisma.message.findMany({
      where: { conversationId: Number(conversationId) },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        reads: { select: { userId: true, readAt: true } },
      },
    })
    return res.json(items)
  } catch (e) {
    console.error("Error fetching messages", e)
    return res.status(500).json({ message: "Error fetching messages" })
  }
}

export const myTradeConversations = async (req, res) => {
  try {
    const userId = req.user.id

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
        type: "trade",   // ✅ ต้องมี field type ใน schema.conversation
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    })

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
  } catch (e) {
    console.error("Error fetching trade conversations", e)
    return res.status(500).json({ message: "Error fetching trade conversations" })
  }
}
// ================== Trade-related controllers ==================

// ดึง conversation ของ tradeId ที่ user เป็นผู้ซื้อ/ผู้ขาย
export const getTradeConversation = async (req, res) => {
  try {
    const { tradeId } = req.params
    const userId = req.user.id

    const conv = await prisma.conversation.findFirst({
      where: {
        tradeId: Number(tradeId),
        type: "trade",
        participants: { some: { userId } }
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } }
        },
        trade: {
          include: {
            post: {
              select: {
                id: true,
                content: true,
                images: { select: { url: true } }   // ✅ include images ด้วย
              }
            }
          }
        }
      }
    })

    if (!conv) return res.status(404).json({ message: "Trade conversation not found" })

    return res.json({
      id: conv.id,
      type: conv.type,
      tradeId: conv.tradeId,
      tradeTitle: conv.trade?.post?.content || "สินค้า",
      tradeImage: conv.trade?.post?.images?.[0]?.url || null,
      participants: conv.participants
    })
  } catch (e) {
    console.error("Error fetching trade conversation", e)
    return res.status(500).json({ message: "Error fetching trade conversation" })
  }
}

// ================== Trade-related controllers ==================

// ✅ เริ่มต้นสร้างห้องแชทสินค้า/เทรด
export const startTradeConversation = async (req, res) => {
  try {
    const { tradeId } = req.params
    const userId = req.user.id   // ✅ ดึงจาก JWT ที่ authCheck แปะไว้

    // 1. ดึงข้อมูล trade
    const trade = await prisma.trade.findUnique({
      where: { id: Number(tradeId) },
      include: { buyer: true, seller: true }
    })
    if (!trade) return res.status(404).json({ message: "Trade not found" })

    // 2. หา conversation ที่มี tradeId + type = "trade"
    let conversation = await prisma.conversation.findFirst({
      where: {
        tradeId: trade.id,
        type: "trade"
      },
      include: { participants: true }
    })

    // 3. ถ้าไม่เจอ → สร้างใหม่
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          type: "trade",
          tradeId: trade.id,
          participants: {
            create: [
              { userId: trade.buyerId },
              { userId: trade.sellerId }
            ]
          }
        },
        include: { participants: { include: { user: true } } }
      })
    }

    return res.json(conversation)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Server error" })
  }
}

// ✅ ดึงแชทสินค้าทั้งหมดของ user
// ✅ ดึงแชทสินค้าทั้งหมดของ user
export const getTradeConversations = async (req, res) => {
  try {
    const userId = req.user.id

    const conversations = await prisma.conversation.findMany({
      where: {
        type: "trade",
        participants: { some: { userId } }
      },
      include: {
        trade: {
          include: {
            post: {
              select: {
                id: true,
                content: true,
                images: { select: { url: true } }
              }
            },
            buyer: { select: { id: true, name: true, avatarUrl: true } },
            seller: { select: { id: true, name: true, avatarUrl: true } }
          }
        },
        participants: { include: { user: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        },
        _count: {
          select: {
            messages: {
              where: {
                reads: { none: { userId } },   // ยังไม่อ่าน
                senderId: { not: userId }      // ไม่ใช่ข้อความที่เราส่งเอง
              }
            }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    })

    const mapped = conversations.map(c => {
      const tradeImage = c.trade?.post?.images?.[0]?.url || null
      const tradeTitle = c.trade?.post?.content || "สินค้า"

      // debug log
      console.log(
        `[getTradeConversations] convId=${c.id}, tradeId=${c.tradeId}, unread=${c._count.messages}`
      )

      return {
        id: c.id,
        tradeTitle,
        tradeImage,
        lastMessage: c.messages[0] || null,
        participants: c.participants,
        unreadCount: c._count.messages,   // ✅ เพิ่มส่งไป frontend
        updatedAt: c.updatedAt
      }
    })

    return res.json(mapped)
  } catch (err) {
    console.error("❌ getTradeConversations error:", err)
    return res.status(500).json({ message: "Server error" })
  }
}

// ✅ ดึงรายละเอียด conversation + trade ที่เกี่ยวข้อง
export const getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params
    const userId = req.user.id

    const conv = await prisma.conversation.findUnique({
      where: { id: Number(conversationId) },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } }
        },
        trade: {
          include: {
            post: {
              select: {
                id: true,
                content: true,
                images: { select: { url: true } }
              }
            }
          }
        }
      }
    })

    if (!conv) return res.status(404).json({ message: "Conversation not found" })

    return res.json({
      id: conv.id,
      tradeId: conv.tradeId,
      tradeTitle: conv.trade?.post?.content || "สินค้า",
      tradeImage: conv.trade?.post?.images?.[0]?.url || null,
      participants: conv.participants
    })
  } catch (e) {
    console.error("Error fetching conversation", e)
    return res.status(500).json({ message: "Error fetching conversation" })
  }
}


  