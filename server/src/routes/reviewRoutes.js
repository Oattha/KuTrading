import express from "express"
import { authMiddleware, adminCheck } from "../middlewares/authMiddleware.js"
import { checkUserStatus } from "../middlewares/checkUserStatus.js"
import {
  leaveReview,
  listReviewsForUser,
  listAllReviews,
  hideReview,
  unhideReview,
} from "../controllers/reviewController.js"

const router = express.Router()

// User
router.get("/user/:userId", listReviewsForUser)
router.post("/", authMiddleware, leaveReview)

// Admin only
router.get("/admin/reviews", authMiddleware, adminCheck, listAllReviews)
router.patch("/admin/reviews/:id/hide", authMiddleware, adminCheck, hideReview)
router.patch("/admin/reviews/:id/unhide", authMiddleware, adminCheck, unhideReview)

export default router
