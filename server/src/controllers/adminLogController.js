import prisma from "../config/prisma.js";

export const getAdminLogs = async (req, res) => {   // ✅ แก้ชื่อตรงนี้
  try {
    const logs = await prisma.adminActionLog.findMany({
      include: { admin: true }, // ดึงข้อมูล admin (email, name)
      orderBy: { createdAt: "desc" }
    });

    res.json(logs);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ message: "Error fetching logs" });
  }
};
