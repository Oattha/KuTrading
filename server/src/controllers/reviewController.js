import prisma from '../config/prisma.js'

export const leaveReview = async (req, res) => {
  try {
    const { tradeId, revieweeId, rating, comment } = req.body
    if (!tradeId || !revieweeId || !rating) {
      return res.status(400).json({ message: 'tradeId, revieweeId, rating required' })
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'rating must be 1..5' })
    }

    // Ensure reviewer belongs to the trade
    const trade = await prisma.trade.findUnique({ where: { id: Number(tradeId) } })
    if (!trade || (trade.buyerId !== req.user.id && trade.sellerId !== req.user.id)) {
      return res.status(403).json({ message: 'Not your trade' })
    }

    // Create review
    const rv = await prisma.review.create({
      data: {
        tradeId: Number(tradeId),
        reviewerId: req.user.id,
        revieweeId: Number(revieweeId),
        rating: Number(rating),
        comment: comment || null,
      },
    })

    // Update aggregate rating on reviewee
    const agg = await prisma.review.aggregate({
      where: { revieweeId: Number(revieweeId) },
      _avg: { rating: true },
      _count: { rating: true },
    })

    await prisma.user.update({
      where: { id: Number(revieweeId) },
      data: {
        ratingAverage: agg._avg.rating || 0,
        ratingCount: agg._count.rating || 0,
      },
    })

    // Notify reviewee
    await prisma.notification.create({
      data: {
        userId: Number(revieweeId),
        type: 'review',
        title: 'คุณได้รับรีวิวใหม่',
        body: `คะแนน ${rating}/5`,
      },
    })

    return res.json(rv)
  } catch (e) {
    if (e.code === 'P2002') {
      // Prisma unique constraint → ห้ามรีวิวซ้ำ
      return res.status(400).json({ message: 'คุณได้รีวิวไปแล้ว' })
    }

    console.error("LEAVE REVIEW ERROR:", e)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งรีวิว', error: e.message })
  }
}


export const listReviewsForUser = async (req, res) => {
  try {
    const { userId } = req.params
    const list = await prisma.review.findMany({
      where: { revieweeId: Number(userId) },
      include: { reviewer: { select: { id: true, name: true, avatarUrl: true } }, trade: true },
      orderBy: { createdAt: 'desc' }
    })
    return res.json(list)
  } catch {
    return res.status(500).json({ message: 'Error listing reviews' })
  }
}


// controllers/reviewController.js
export const listAllReviews = async (_req, res) => {
  try {
    const list = await prisma.review.findMany({
      include: {
        reviewer: { select: { id: true, name: true, avatarUrl: true } },
        reviewee: { select: { id: true, name: true, avatarUrl: true } },
        trade: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return res.json(list)
  } catch (e) {
    return res.status(500).json({ message: 'Error listing all reviews', error: e.message })
  }
}


// controllers/reviewController.js
export const hideReview = async (req, res) => {
  try {
    const { id } = req.params

    const review = await prisma.review.update({
      where: { id: Number(id) },
      data: { hidden: true },
    })

    return res.json({ ok: true, message: `Review ${id} hidden`, review })
  } catch (e) {
    return res.status(500).json({ message: 'Error hiding review', error: e.message })
  }
}

export const unhideReview = async (req, res) => {
  try {
    const { id } = req.params

    const review = await prisma.review.update({
      where: { id: Number(id) },
      data: { hidden: false },
    })

    return res.json({ ok: true, message: `Review ${id} unhidden`, review })
  } catch (e) {
    return res.status(500).json({ message: 'Error unhiding review', error: e.message })
  }
}
