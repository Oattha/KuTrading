// tests/trade.test.js
import request from "supertest"
import app from "../src/app.js"

let token
let postId
let tradeId

beforeAll(async () => {
  // 🔐 ล็อกอินรับ token
  const res = await request(app)
    .post("/api/auth/test-login")
    .send({ email: "testuser@gmail.com" })
  token = res.body.token
})

describe("🔁 TRADE MODULE (with available state)", () => {
  it("🧱 สร้างโพสต์ใหม่สำหรับเทรด", async () => {
    const postRes = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .field("content", "โพสต์ทดสอบสำหรับสถานะ available")

    expect([200, 201]).toContain(postRes.statusCode)
    postId = postRes.body.post?.id || postRes.body.id
    expect(postId).toBeDefined()
  })

  it("✅ สร้างเทรดใหม่ได้ (สถานะเริ่มต้น available)", async () => {
    const res = await request(app)
      .post("/api/trades")
      .set("Authorization", `Bearer ${token}`)
      .send({
        postId,
        location: "KU KPS",
        offerText: "เสนอของเล่นแมว"
      })

    expect([200, 201]).toContain(res.statusCode)
    expect(res.body.trade).toHaveProperty("id")
    expect(res.body.trade.status).toBe("available")
    tradeId = res.body.trade.id
  })

  it("🚫 ป้องกันการขอเทรดซ้ำโพสต์เดิม (ถ้ายังอยู่ในสถานะ active)", async () => {
    const res = await request(app)
      .post("/api/trades")
      .set("Authorization", `Bearer ${token}`)
      .send({
        postId,
        location: "KU KPS",
        offerText: "เสนอของใหม่อีกครั้ง"
      })

    // ✅ ต้องถูกบล็อกเพราะยังมี trade เดิม active อยู่
    expect(res.statusCode).toBe(400)
    expect(res.body.message).toMatch(/ส่งคำขอเทรดสำหรับโพสต์นี้ไปแล้ว/)
  })

  it("🟡 เปลี่ยนสถานะ trade เป็น canceled ได้", async () => {
    const res = await request(app)
      .patch(`/api/trades/${tradeId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "canceled" })

    expect([200, 201]).toContain(res.statusCode)
    expect(res.body.trade.status).toBe("canceled")
  })

it("🚫 หลัง canceled แล้ว ไม่สามารถสร้างเทรดใหม่ในโพสต์เดิมได้อีก", async () => {
  const res = await request(app)
    .post("/api/trades")
    .set("Authorization", `Bearer ${token}`)
    .send({
      postId,
      location: "KU KPS",
      offerText: "พยายามขอเทรดใหม่หลังยกเลิก",
    })

  expect(res.statusCode).toBe(400)
  expect(res.body.message).toMatch(/ขอเทรดสำหรับโพสต์นี้ไปแล้ว/)
})
})