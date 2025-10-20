import request from "supertest"
import app from "../src/app.js"

let token, postId

beforeAll(async () => {
  const res = await request(app)
    .post("/api/auth/test-login")
    .send({ email: "testuser@gmail.com" })
  token = res.body.token
})

describe("📰 POST MODULE", () => {
  it("สร้างโพสต์ได้", async () => {
    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .field("content", "โพสต์เทสระบบ")

    expect([200, 201]).toContain(res.statusCode)
    postId = res.body.post?.id
  })

  it("ดึงโพสต์ทั้งหมดได้", async () => {
    const res = await request(app).get("/api/posts")
    expect([200, 201]).toContain(res.statusCode)
    expect(Array.isArray(res.body)).toBe(true)
  })
})
