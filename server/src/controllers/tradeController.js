import prisma from "../config/prisma.js"
import { v2 as cloudinary } from "cloudinary"
import fs from "fs/promises"
import { getIO } from "../socket.js"

// === สร้างเทรดใหม่ ===
// === สร้างเทรดใหม่ ===
// === สร้างเทรดใหม่ ===
export const createTrade = async (req, res) => {
  try {
    const { postId, location, scheduledAt, offerText } = req.body

    if (!postId || !location) {
      return res.status(400).json({ message: "postId & location required" })
    }

    // ✅ ดึง sellerId จาก owner ของโพสต์
    const post = await prisma.post.findUnique({
      where: { id: Number(postId) },
      select: { authorId: true },
    })

    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    // ✅ อัปโหลดรูปไป Cloudinary ถ้ามีไฟล์
    let offerImageUrl = null
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "marketplace/trades",
        })
        offerImageUrl = result.secure_url
        if (req.file.path) await fs.unlink(req.file.path).catch(() => { })
      } catch (err) {
        console.error("Cloudinary upload error:", err)
      }
    }

    // ✅ ตรวจสอบวันที่
    let parsedDate = null
    if (scheduledAt) {
      const ts = Date.parse(scheduledAt)
      if (!isNaN(ts)) parsedDate = new Date(ts)
    }

    // ✅ สร้าง trade
    const trade = await prisma.trade.create({
      data: {
        buyerId: req.user.id,
        sellerId: post.authorId,
        postId: Number(postId),
        location,
        scheduledAt: parsedDate,
        status: "requested",
        offerText: offerText || null,
        offerImageUrl,
      },
      include: {
        post: { select: { id: true, content: true } },
        buyer: { select: { id: true, name: true, avatarUrl: true } },
        seller: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    // ✅ หา/สร้าง conversation one-to-one
    // ✅ สร้าง conversation ใหม่สำหรับ trade โดยเฉพาะ
    const conversation = await prisma.conversation.create({
      data: {
        type: "trade",
        tradeId: trade.id,
        isGroup: false,
        participants: {
          create: [
            { userId: req.user.id },
            { userId: post.authorId },
          ],
        },
      },
    })

    // ✅ แจ้งเตือนผู้ขาย
    // ✅ แจ้งเตือนผู้ขาย
    const noti = await prisma.notification.create({
      data: {
        userId: post.authorId,
        type: "trade",
        title: "มีคำขอแลกเปลี่ยนใหม่",
        body: `ผู้ใช้ #${req.user.id} ขอแลกกับโพสต์ #${postId}`,
        tradeId: trade.id,
      },
    })

    // 🔔 realtime → ส่งไปยังผู้ขาย
    getIO().to(`user_${post.authorId}`).emit("notification:new", noti)


    return res.json({ trade, conversationId: conversation.id })
  } catch (e) {
    console.error("Error creating trade:", e)
    return res.status(500).json({ message: "Error creating trade", error: e.message })
  }
}



// === อัปเดตสถานะเทรด ===
export const updateTradeStatus = async (req, res) => {
  try {
    const { tradeId } = req.params
    const { status } = req.body
    const allowed = ["pending", "accepted", "completed", "canceled"]

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "invalid status" })
    }

    const updated = await prisma.trade.update({
      where: { id: Number(tradeId) },
      data: { status },
      include: {
        post: { select: { id: true, content: true } },
        buyer: { select: { id: true, name: true, avatarUrl: true } },
        seller: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    // ✅ สร้าง notification ใน DB
    const notis = await prisma.notification.createMany({
      data: [
        {
          userId: updated.buyerId,
          type: "trade",
          title: "อัปเดตสถานะเทรด",
          body: `สถานะ: ${status}`,
          tradeId: updated.id,
        },
        {
          userId: updated.sellerId,
          type: "trade",
          title: "อัปเดตสถานะเทรด",
          body: `สถานะ: ${status}`,
          tradeId: updated.id,
        },
      ],
    })

    // ✅ realtime emit ไปทั้งสองฝั่ง
    getIO().to(`user_${updated.buyerId}`).emit("notification:new", {
      userId: updated.buyerId,
      type: "trade",
      title: "อัปเดตสถานะเทรด",
      body: `สถานะ: ${status}`,
      tradeId: updated.id,
    })

    getIO().to(`user_${updated.sellerId}`).emit("notification:new", {
      userId: updated.sellerId,
      type: "trade",
      title: "อัปเดตสถานะเทรด",
      body: `สถานะ: ${status}`,
      tradeId: updated.id,
    })

    return res.json(updated)
  } catch (e) {
    console.error("Error updating trade:", e)
    return res
      .status(500)
      .json({ message: "Error updating trade", error: e.message })
  }
}

// === ดึง trade ของฉัน (ทั้ง buyer/seller) ===
export const myTrades = async (req, res) => {
  try {
    const list = await prisma.trade.findMany({
      where: { OR: [{ buyerId: req.user.id }, { sellerId: req.user.id }] },
      include: {
        post: { select: { id: true, content: true } },
        reviews: true,
        buyer: { select: { id: true, name: true, avatarUrl: true } },
        seller: { select: { id: true, name: true, avatarUrl: true } },
        // 👇 ชื่อฟิลด์ต้องเป็น "Conversation" ให้ตรง schema
        Conversation: {
          where: { type: 'trade' },   // enum ConversationType.trade
          select: { id: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
    })

    const withConv = list.map(t => ({
      ...t,
      offerImageUrl: t.offerImageUrl,
      offerText: t.offerText,
      // 👇 อ้างชื่อฟิลด์ให้ตรง ("Conversation")
      conversationId: t.Conversation?.[0]?.id ?? null,
    }))

    return res.json(withConv)
  } catch (e) {
    console.error('Error listing trades:', e)
    return res.status(500).json({ message: 'Error listing trades' })
  }
}



// === ดึง trade ตาม tradeId ===
export const getTradeById = async (req, res) => {
  try {
    const { tradeId } = req.params

    const trade = await prisma.trade.findUnique({
      where: { id: Number(tradeId) },
      include: {
        post: { select: { id: true, content: true } },
        reviews: true,
        buyer: { select: { id: true, name: true, avatarUrl: true } },
        seller: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    if (!trade) {
      return res.status(404).json({ message: "Trade not found" })
    }

    return res.json({
      ...trade,
      offerImageUrl: trade.offerImageUrl,
      offerText: trade.offerText,
    })
  } catch (e) {
    console.error("Error fetching trade:", e)
    return res.status(500).json({ message: "Error fetching trade", error: e.message })
  }
}


export const deleteTrade = async (req, res) => {
  try {
    const { tradeId } = req.params

    const trade = await prisma.trade.findUnique({ where: { id: Number(tradeId) } })
    if (!trade) return res.status(404).json({ message: "Trade not found" })

    // ✅ ตรวจสอบสิทธิ์: ให้เฉพาะ seller หรือตัวเองลบได้
    if (trade.sellerId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" })
    }

    await prisma.trade.delete({ where: { id: Number(tradeId) } })
    res.json({ message: "Trade deleted successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Error deleting trade" })
  }
}