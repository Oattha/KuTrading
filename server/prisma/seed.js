import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash("admin123@", 10) // ตั้งรหัส admin123

  await prisma.user.upsert({
    where: { email: "facup877@gmail.com" },
    update: { password: hashed, role: "admin", name: "Admin" },
    create: {
      email: "facup877@gmail.com",
      password: hashed,
      role: "admin",
      name: "Admin"
    }
  })

  console.log("✅ Admin user ready: facup877@gmail.com / admin123")
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
