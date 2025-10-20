import request from "supertest"
import app from "../src/app.js"

let token

beforeAll(async () => {
  const res = await request(app)
    .post("/api/auth/test-login")
    .send({ email: "testuser@gmail.com" })
  token = res.body.token
})

describe("🚨 REPORT MODULE", () => {
  it("รีพอร์ตผู้ใช้ได้", async () => {
    const res = await request(app)
      .post("/api/reports/user")
      .set("Authorization", `Bearer ${token}`)
      .send({ targetUserId: 2, reason: "ทดสอบระบบรีพอร์ต" })

    expect([200, 201]).toContain(res.statusCode)
  })
})
