// controllers/reportController.js
import prisma from "../config/prisma.js"
import nodemailer from "nodemailer"

export const reportUser = async (req, res) => {
  try {
    const { targetUserId, reason } = req.body

    // 🧩 ตรวจสอบข้อมูลพื้นฐาน
    if (!targetUserId || !reason) {
      return res.status(400).json({ message: "ต้องระบุผู้ใช้และเหตุผล" })
    }

    if (targetUserId === req.user.id) {
      return res.status(400).json({ message: "ไม่สามารถรีพอร์ตตัวเองได้" })
    }

    // 🧱 สร้างรายการรีพอร์ตใหม่
    const report = await prisma.report.create({
      data: {
        reporterId: req.user.id,
        targetUserId: Number(targetUserId),
        reason,
        status: "open",
      },
    })

    // ✅ ดึงรายชื่อแอดมินทั้งหมด
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: { id: true, email: true },
    })

    // 📨 แจ้งเตือนแอดมินทุกคน
    await Promise.all(
      admins.map((admin) =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            type: "report",
            title: "มีการรีพอร์ตผู้ใช้ใหม่",
            body: `ผู้ใช้ ${req.user.email} ได้รีพอร์ตผู้ใช้ ID ${targetUserId}`,
            metadata: { reportId: report.id },
          },
        })
      )
    )

    return res.json({ message: "✅ ส่งรีพอร์ตสำเร็จ และแจ้งเตือนแอดมินแล้ว", report })
  } catch (e) {
    console.error("❌ REPORT USER ERROR:", e)
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการรีพอร์ต" })
  }
}



// ✅ แอดมินดูรีพอร์ตทั้งหมด
export const listReports = async (req, res) => {
  try {
    // ตรวจสอบสิทธิ์แอดมิน
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "ต้องเป็นแอดมินเท่านั้น" })
    }

    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        targetUser: { select: { id: true, name: true, email: true } },
      },
    })

    return res.json(reports)
  } catch (e) {
    console.error("❌ Error fetching reports:", e)
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงรีพอร์ต" })
  }
}

// ✅ แอดมินอัปเดตสถานะรีพอร์ต (ปิดเคส)
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    // ตรวจสอบสิทธิ์แอดมิน
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "ต้องเป็นแอดมินเท่านั้น" })
    }

    const report = await prisma.report.update({
      where: { id: Number(id) },
      data: {
        status,
        resolvedById: req.user.id,
        resolvedAt: new Date(),
      },
    })

    return res.json({ message: "✅ อัปเดตสถานะสำเร็จ", report })
  } catch (e) {
    console.error("❌ UPDATE REPORT ERROR:", e)
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตรีพอร์ต" })
  }
}

import prisma from "../config/prisma.js";
import SibApiV3Sdk from "sib-api-v3-sdk";

const brevoClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = brevoClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;
const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

const DEFAULT_SENDER = {
  email: process.env.SENDER_EMAIL || "facup877@gmail.com",
  name: "KU Trading Report Center",
};

// ✅ แจ้งผู้ใช้ที่ถูกรีพอร์ตทางอีเมล
export const notifyReportedUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    // 🧩 ดึงข้อมูลรีพอร์ตพร้อม relation ที่ถูกต้อง
    const report = await prisma.report.findUnique({
      where: { id: Number(id) },
      include: {
        targetUser: true,
        reporter: true,
      },
    });

    if (!report) {
      throw new Error("ไม่พบข้อมูลรีพอร์ตในระบบ");
    }

    if (!report.targetUser) {
      throw new Error("ไม่พบข้อมูลผู้ใช้ที่ถูกรายงาน (targetUser)");
    }

    // ✅ log debug
    console.log("📨 Sending report notification to:", report.targetUser.email);
    console.log("🧾 Reason:", report.reason);

    // ✅ ส่งอีเมลผ่าน Brevo API
    await emailApi.sendTransacEmail({
      sender: DEFAULT_SENDER,
      to: [{ email: report.targetUser.email }],
      subject: "🚨 แจ้งเตือนจากทีม KU Trading",
      htmlContent: `
        <p>เรียนคุณ <b>${report.targetUser.name || "ผู้ใช้"}</b>,</p>
        <p>บัญชีของคุณได้รับการรีพอร์ตในระบบ Marketplace.</p>
        <p><b>เหตุผล:</b> ${report.reason}</p>
        <p><b>ข้อความจากผู้ดูแล:</b> ${message}</p>
        <br/>
        <p>หากคุณคิดว่าเกิดความเข้าใจผิด โปรดติดต่อทีมแอดมินเพื่อตรวจสอบเพิ่มเติม</p>
        <hr/>
        <p style="font-size:12px;color:#888;">KU Trading Report Center</p>
      `,
    });

    console.log("✅ Report notification email sent successfully");
    return res.json({ message: "ส่งอีเมลสำเร็จแล้ว!" });
  } catch (e) {
    console.error("❌ notifyReportedUser error:", e);
    return res.status(500).json({ message: e.message });
  }
};

