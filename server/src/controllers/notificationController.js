import prisma from '../config/prisma.js'

export const listNotifications = async (req, res) => {
  try {
    const items = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    })
    return res.json(items)
  } catch {
    return res.status(500).json({ message: 'Error listing notifications' })
  }
}

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params
    const done = await prisma.notification.update({
      where: { id: Number(id) },
      data: { isRead: true }
    })
    return res.json(done)
  } catch {
    return res.status(500).json({ message: 'Error marking as read' })
  }
}
