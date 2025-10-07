// middlewares/checkUserStatus.js
import prisma from "../config/prisma.js"

export const checkUserStatus = async (req, res, next) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: "Unauthorized" })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ message: "User not found" })

    if (user.status === "banned") {
      return res.status(403).json({ message: "บัญชีถูกแบน" })
    }

    req.user = user
    next()
  } catch (e) {
    return res.status(500).json({ message: "Error checking user status", error: e.message })
  }
}
