import request from "supertest"
import app from "../src/app.js"

let token

describe("🔐 AUTH MODULE (Mock Google Login)", () => {
  it("ควรล็อกอินทดสอบได้ผ่าน /test-login", async () => {
    const res = await request(app)
      .post("/api/auth/test-login")
      .send({ email: "testuser@gmail.com" })

    expect([200, 201]).toContain(res.statusCode)
    expect(res.body).toHaveProperty("token")
    token = res.body.token
  })

  it("ควรเข้าถึงข้อมูลตัวเองได้ด้วย token", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`)

    expect([200, 201]).toContain(res.statusCode)
    expect(res.body).toHaveProperty("email")
  })
})
