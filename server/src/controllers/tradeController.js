import prisma from "../config/prisma.js"
import { v2 as cloudinary } from "cloudinary"
import fs from "fs/promises"
import { getIO } from "../socket.js"

// === สร้างเทรดใหม่ ===
// === สร้างเทรดใหม่ ===
export const createTrade = async (req, res) => {
  try {
    const { postId, location, scheduledAt, offerText } = req.body;

    if (!postId || !location) {
      return res.status(400).json({ message: "postId & location required" });
    }

    // ✅ ดึง sellerId จาก owner ของโพสต์
    const post = await prisma.post.findUnique({
      where: { id: Number(postId) },
      select: { authorId: true },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // ✅ ตรวจสอบว่าผู้ใช้เคยขอเทรดโพสต์นี้แล้วหรือยัง (ไม่ว่าผลจะเป็นยังไง)
    const existingTrade = await prisma.trade.findFirst({
      where: {
        buyerId: req.user.id,
        postId: Number(postId),
      },
    });

    if (existingTrade) {
      return res
        .status(400)
        .json({ message: "คุณได้ส่งคำขอเทรดสำหรับโพสต์นี้ไปแล้ว (ไม่สามารถขอซ้ำได้)" });
    }

    // ✅ อัปโหลดรูปไป Cloudinary ถ้ามีไฟล์
    let offerImageUrl = null;
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "marketplace/trades",
        });
        offerImageUrl = result.secure_url;
        if (req.file.path) await fs.unlink(req.file.path).catch(() => {});
      } catch (err) {
        console.error("Cloudinary upload error:", err);
      }
    }

    // ✅ ตรวจสอบวันที่
    let parsedDate = null;
    if (scheduledAt) {
      const ts = Date.parse(scheduledAt);
      if (!isNaN(ts)) parsedDate = new Date(ts);
    }

    // ✅ สร้าง trade ใหม่
    const trade = await prisma.trade.create({
      data: {
        buyerId: req.user.id,
        sellerId: post.authorId,
        postId: Number(postId),
        location,
        scheduledAt: parsedDate,
        status: "available",
        offerText: offerText || null,
        offerImageUrl,
      },
      include: {
        post: { select: { id: true, content: true } },
        buyer: { select: { id: true, name: true, avatarUrl: true } },
        seller: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // ✅ ตรวจสอบว่ามีห้องสนทนา one-to-one ระหว่าง buyer/seller อยู่แล้วไหม
// ✅ สร้าง conversation ใหม่สำหรับ trade นี้เท่านั้น (unique ต่อ tradeId)
let conversation = await prisma.conversation.findFirst({
  where: { tradeId: trade.id },
})

if (!conversation) {
  conversation = await prisma.conversation.create({
    data: {
      type: "trade",
      tradeId: trade.id,
      isGroup: false,
    },
  })

  // เพิ่ม participants แยกทีหลัง เพื่อหลีกเลี่ยง unique constraint ซ้ำ
  await prisma.conversationParticipant.createMany({
    data: [
      { conversationId: conversation.id, userId: req.user.id },
      { conversationId: conversation.id, userId: post.authorId },
    ],
    skipDuplicates: true, // ✅ ป้องกัน error P2002
  })
}


    // ✅ แจ้งเตือนผู้ขาย
    const noti = await prisma.notification.create({
      data: {
        userId: post.authorId,
        type: "trade",
        title: "มีคำขอแลกเปลี่ยนใหม่",
        body: `ผู้ใช้ #${req.user.id} ขอแลกกับโพสต์ #${postId}`,
        tradeId: trade.id,
      },
    });

    // 🔔 realtime → ส่งไปยังผู้ขาย
    getIO().to(`user_${post.authorId}`).emit("notification:new", noti);

    return res.status(201).json({ trade, conversationId: conversation.id });
  } catch (e) {
    console.error("Error creating trade:", e);
    return res.status(500).json({ message: "Error creating trade", error: e.message });
  }
};



// === อัปเดตสถานะเทรด ===
export const updateTradeStatus = async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { status } = req.body;

    const id = Number(tradeId);
    if (!id) return res.status(400).json({ message: "Missing tradeId" });

    const trade = await prisma.trade.findUnique({ where: { id } });
    if (!trade) return res.status(404).json({ message: "Trade not found" });

    // ✅ ตรวจสอบสิทธิ์
    if (trade.sellerId !== req.user.id) {
      return res.status(403).json({ message: "You are not the owner of this trade" });
    }

    const updated = await prisma.trade.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({ message: "Trade status updated", trade: updated });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error updating trade status" });
  }
};


// === อัปเดตสถานะเทรด พร้อมแจ้งเตือน ===
export const updateTradeStatusWithNotification = async (req, res) => {
  try {
    const { tradeId } = req.params
    const { status } = req.body  // available | requested | pending | accepted | completed | canceled

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