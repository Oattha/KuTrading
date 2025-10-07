import express from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import { listNotifications, markAsRead } from '../controllers/notificationController.js'
const router = express.Router()

router.get('/', authMiddleware, listNotifications)
router.patch('/:id/read', authMiddleware, markAsRead)

export default router
