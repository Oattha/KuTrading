import express from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import { checkUserStatus } from "../middlewares/checkUserStatus.js"
import upload from "../middlewares/upload.js"
import {
  upsertTradeConversation,
  myTradeConversations,
  sendTradeMessage,
  markTradeConversationRead,
} from "../controllers/tradeChatController.js"

const router = express.Router()

// ✅ หา/สร้างห้องแชท trade
router.post("/trade/:tradeId/conversation", authMiddleware, upsertTradeConversation)

// ✅ ดึงห้องแชท trade ทั้งหมดของฉัน
router.get("/trade-conversations", authMiddleware, myTradeConversations)

// ✅ ส่งข้อความ (trade)
router.post("/trade/messages", authMiddleware, sendTradeMessage)

// ✅ mark ว่าอ่านแล้ว (trade)
router.post("/trade/conversations/:conversationId/read", authMiddleware, markTradeConversationRead)

// ===== [TRADE CHAT] ดึงข้อความในห้อง trade =====
router.get("/trade/conversations/:conversationId/messages", authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params
    const messages = await prisma.message.findMany({
      where: { conversationId: Number(conversationId) },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        reads: true,
      },
      orderBy: { createdAt: "asc" },
    })
    return res.json(messages)
  } catch (err) {
    console.error("Error fetching trade messages", err)
    return res.status(500).json({ message: "Error fetching trade messages" })
  }
})

export default router
