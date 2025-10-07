import express from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import { checkUserStatus } from "../middlewares/checkUserStatus.js"
import upload from "../middlewares/upload.js"
import {
  upsertOneToOneConversation,
  myConversations,
  sendMessage,
  getMessages,
  markConversationRead,
  getTradeConversation,
  getTradeConversations,getConversationById
} from '../controllers/chatController.js'

const router = express.Router()

// ===== One-to-One Chat =====
router.get('/conversations', authMiddleware, myConversations)
router.post('/conversations', authMiddleware, upsertOneToOneConversation)
router.get('/conversations/:conversationId', authMiddleware, getConversationById)
router.get('/conversations/:conversationId/messages', authMiddleware, getMessages)
router.post('/conversations/:conversationId/read', authMiddleware, markConversationRead)

// ===== Trade Chat =====
// ✅ ดึงห้องแชทเทรดทั้งหมดของ user
router.get('/trade-conversations', authMiddleware, getTradeConversations)

// ✅ ดึงห้องแชทเดี่ยวของ tradeId
router.get('/trade/:tradeId/conversation', authMiddleware, getTradeConversation)

// ===== ส่งข้อความ =====
router.post('/messages', authMiddleware, upload.single("files"), sendMessage)

export default router
