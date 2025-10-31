import request from "supertest"

const baseURL = process.env.BASE_URL || "https://kutrading-server.onrender.com"

let token, postId

beforeAll(async () => {
  const res = await request(baseURL)
    .post("/api/auth/test-login")
    .send({ email: "testuser@gmail.com" })

  token = res.body.token
  console.log("✅ Token:", token)
})

describe("📰 POST MODULE (Production)", () => {
  it("สร้างโพสต์ได้", async () => {
    const res = await request(baseURL)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .field("content", "โพสต์เทสระบบ (Production)")

    expect([200, 201]).toContain(res.statusCode)
    postId = res.body.post?.id
    console.log("✅ Post created ID:", postId)
  })

  it("ดึงโพสต์ทั้งหมดได้", async () => {
    const res = await request(baseURL).get("/api/posts")

    expect([200, 201]).toContain(res.statusCode)
    expect(Array.isArray(res.body)).toBe(true)
    console.log("📦 Total posts:", res.body.length)
  })
})
