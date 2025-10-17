import express from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js"
import { checkUserStatus } from "../middlewares/checkUserStatus.js"
import upload from "../middlewares/upload.js"
import {
  createTrade,
  updateTradeStatus,
  myTrades,
  getTradeById, deleteTrade
} from "../controllers/tradeController.js"

const router = express.Router()

// ✅ ดึง trade ของฉัน
router.get("/my", authMiddleware, myTrades)

// ✅ สร้าง trade (แนบไฟล์ offerImage)
router.post(
  "/",
  authMiddleware,
  checkUserStatus,
  upload.single("offerImage"), 
  createTrade
)

// ✅ ดึง trade เดี่ยวตาม id
router.get("/:tradeId", authMiddleware, getTradeById)

// ✅ อัปเดตสถานะ trade
router.patch("/:tradeId/status", authMiddleware, updateTradeStatus)

router.delete("/:tradeId", authMiddleware, deleteTrade)


export default router
