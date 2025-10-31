import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://kutrading_user:1gRi3AMvIWgAVhY1AkjnSTCnOy2U7ewR@dpg-d40rq92li9vc73btgri0-a.singapore-postgres.render.com/kutrading",
    },
  },
})

describe("🧱 SYSTEM & DB Integrity (Production)", () => {
  it("user email ต้องไม่ซ้ำกัน", async () => {
    const users = await prisma.user.findMany()
    const emails = users.map((u) => u.email)
    const uniqueEmails = new Set(emails)

    expect(uniqueEmails.size).toBe(emails.length)
    console.log(`✅ Users: ${emails.length}, Unique: ${uniqueEmails.size}`)
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })
})
