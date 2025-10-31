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
