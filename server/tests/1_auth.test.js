import request from "supertest"

const baseURL = process.env.BASE_URL || "https://kutrading-server.onrender.com"

let token

describe("🔐 AUTH MODULE (Production Google Mock Login)", () => {
  it("ควรล็อกอินทดสอบได้ผ่าน /test-login", async () => {
    const res = await request(baseURL)
      .post("/api/auth/test-login")
      .send({ email: "testuser@gmail.com" })

    expect([200, 201]).toContain(res.statusCode)
    expect(res.body).toHaveProperty("token")

    token = res.body.token
    console.log("✅ ได้รับ token:", token)
  })

  it("ควรเข้าถึงข้อมูลตัวเองได้ด้วย token", async () => {
    const res = await request(baseURL)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`)

    expect([200, 201]).toContain(res.statusCode)
    expect(res.body).toHaveProperty("email")
    console.log("✅ ผู้ใช้:", res.body.email)
  })
})
