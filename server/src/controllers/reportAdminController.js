import prisma from "../config/prisma.js";
import SibApiV3Sdk from "sib-api-v3-sdk";

// ✅ ตั้งค่า Brevo API client
const brevoClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = brevoClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

// ✅ Sender ข้อมูลจาก env หรือ fallback
const DEFAULT_SENDER = {
  email: process.env.SENDER_EMAIL || "facup877@gmail.com",
  name: "KU Trading Admin Team",
};

// ==========================
// 📬 ส่งอีเมลแจ้งผู้ถูกรีพอร์ต
// ==========================
export const notifyReportedUser = async (req, res) => {
  try {
    const { id } = req.params; // id ของ report
    const { message } = req.body;

    // หารีพอร์ตนั้นก่อน
    const report = await prisma.report.findUnique({
      where: { id: Number(id) },
      include: {
        targetUser: true,
        reporter: true,
      },
    });

    if (!report || !report.targetUser) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้ที่ถูกรีพอร์ต" });
    }

    console.log(`📧 Sending report email to: ${report.targetUser.email}`);

    // ✅ ส่งอีเมลด้วย Brevo API
    await emailApi.sendTransacEmail({
      sender: DEFAULT_SENDER,
      to: [{ email: report.targetUser.email }],
      subject: `🚨 การแจ้งเตือนจากทีม KU Trading`,
      htmlContent: `
        <h3>เรียนคุณ ${report.targetUser.name || "ผู้ใช้"}</h3>
        <p>คุณได้รับการแจ้งเตือนจากระบบเนื่องจากมีการรีพอร์ตบัญชีของคุณ</p>
        <p><b>เหตุผล:</b> ${report.reason}</p>
        <p><b>ข้อความจากผู้ดูแล:</b></p>
        <blockquote style="background:#f3f4f6;padding:10px;border-left:3px solid #007BFF">
          ${message}
        </blockquote>
        <hr/>
        <p style="font-size:12px;color:#888;">KU Trading Marketplace System</p>
      `,
    });

    console.log("✅ Report email sent successfully");

    // ✅ Log การส่ง
    await prisma.adminActionLog.create({
      data: {
        adminId: req.user.id,
        action: "notify_reported_user",
        targetUserId: report.targetUser.id,
        details: { reportId: report.id, message },
      },
    });

    return res.json({ message: "ส่งอีเมลแจ้งเตือนผู้ใช้สำเร็จแล้ว" });
  } catch (e) {
    console.error("❌ notifyReportedUser error:", e);
    return res.status(500).json({
      message: "เกิดข้อผิดพลาดในการส่งอีเมลแจ้งเตือน",
      error: e.message,
    });
  }
};
