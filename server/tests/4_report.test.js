import request from "supertest"

const baseURL = process.env.BASE_URL || "https://kutrading-server.onrender.com"

let token

beforeAll(async () => {
  // 🔐 ล็อกอินรับ token จาก production server
  const res = await request(baseURL)
    .post("/api/auth/test-login")
    .send({ email: "testuser@gmail.com" })

  token = res.body.token
  console.log("✅ Token:", token)
})

describe("🚨 REPORT MODULE (Production)", () => {
  it("รีพอร์ตผู้ใช้ได้จริงบนระบบ production", async () => {
    const res = await request(baseURL)
      .post("/api/reports/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        targetUserId: 3, // 🧠 ปรับตาม user ที่มีอยู่จริงใน production
        reason: "ทดสอบระบบรีพอร์ตบน Render (Production)",
      })

    expect([200, 201]).toContain(res.statusCode)
    console.log("✅ Report success:", res.body)
  })
})
