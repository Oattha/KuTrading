import request from "supertest"

const baseURL = process.env.BASE_URL || "https://kutrading-server.onrender.com"

let token
let postId
let tradeId

beforeAll(async () => {
  // 🔐 ล็อกอินรับ token จาก production server
  const res = await request(baseURL)
    .post("/api/auth/test-login")
    .send({ email: "testuser@gmail.com" })

  token = res.body.token
  console.log("✅ Token:", token)
})

describe("🔁 TRADE MODULE (Production)", () => {
  it("🧱 สร้างโพสต์ใหม่สำหรับเทรด", async () => {
    const postRes = await request(baseURL)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .field("content", "โพสต์ทดสอบสำหรับเทรด (Production)")

    expect([200, 201]).toContain(postRes.statusCode)
    postId = postRes.body.post?.id || postRes.body.id
    expect(postId).toBeDefined()
    console.log("✅ Post created:", postId)
  })

  it("✅ สร้างเทรดใหม่ได้ (สถานะเริ่มต้น available)", async () => {
    const res = await request(baseURL)
      .post("/api/trades")
      .set("Authorization", `Bearer ${token}`)
      .send({
        postId,
        location: "KU KPS",
        offerText: "เสนอของเล่นแมว (Production)",
      })

    expect([200, 201]).toContain(res.statusCode)
    expect(res.body.trade).toHaveProperty("id")
    expect(res.body.trade.status).toBe("available")

    tradeId = res.body.trade.id
    console.log("✅ Trade created:", tradeId)
  })

  it("🚫 ป้องกันการขอเทรดซ้ำโพสต์เดิม", async () => {
    const res = await request(baseURL)
      .post("/api/trades")
      .set("Authorization", `Bearer ${token}`)
      .send({
        postId,
        location: "KU KPS",
        offerText: "เสนอของใหม่อีกครั้ง (Production)",
      })

    expect(res.statusCode).toBe(400)
    expect(res.body.message).toMatch(/ส่งคำขอเทรดสำหรับโพสต์นี้ไปแล้ว/)
    console.log("⚠️ Prevented duplicate trade request")
  })

  it("🟡 เปลี่ยนสถานะ trade เป็น canceled ได้", async () => {
    const res = await request(baseURL)
      .patch(`/api/trades/${tradeId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "canceled" })

    expect([200, 201]).toContain(res.statusCode)
    expect(res.body.trade.status).toBe("canceled")
    console.log("🟡 Trade canceled")
  })

  it("🚫 หลัง canceled แล้ว ไม่สามารถสร้างเทรดใหม่ในโพสต์เดิมได้อีก", async () => {
    const res = await request(baseURL)
      .post("/api/trades")
      .set("Authorization", `Bearer ${token}`)
      .send({
        postId,
        location: "KU KPS",
        offerText: "พยายามขอเทรดใหม่หลังยกเลิก (Production)",
      })

    expect(res.statusCode).toBe(400)
    expect(res.body.message).toMatch(/ขอเทรดสำหรับโพสต์นี้ไปแล้ว/)
    console.log("✅ Prevented trade after cancel")
  })
})
