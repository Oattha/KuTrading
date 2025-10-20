import prisma from "../src/config/prisma.js"

describe("🧱 SYSTEM & DB Integrity", () => {
  it("user email ต้องไม่ซ้ำกัน", async () => {
    const users = await prisma.user.findMany()
    const emails = users.map(u => u.email)
    const uniqueEmails = new Set(emails)
    expect(uniqueEmails.size).toBe(emails.length)
  })
})
