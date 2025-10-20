import { execSync } from "child_process";
import prisma from "./src/config/prisma.js";
import bcrypt from "bcryptjs";

beforeAll(async () => {
  try {
    console.log("🧹 Reset test database...");
    execSync("npx prisma migrate reset --force --skip-generate --skip-seed", {
      stdio: "inherit",
    });

    console.log("👤 สร้างผู้ใช้ทดสอบ (mock users)...");

    // ✅ ผู้ใช้หลัก (ใช้ใน test-login)
    await prisma.user.create({
      data: {
        email: "testuser@gmail.com",
        name: "Test User",
        avatarUrl: "https://via.placeholder.com/100", // ✅ ใช้ avatarUrl
        role: "user",
        status: "active",
        password: await bcrypt.hash("testpassword", 10),
      },
    });

    // ✅ ผู้ใช้ที่ใช้เทสจริงของคุณ (Garefafaw)
    await prisma.user.create({
      data: {
        email: "garefafaw@gmail.com",
        name: "Garefafaw",
        avatarUrl: "https://via.placeholder.com/100", // ✅ ใช้ avatarUrl
        role: "user",
        status: "active",
        password: await bcrypt.hash("garefafaw1", 10),
      },
    });

    console.log("✅ พร้อมสำหรับเทสทั้งหมดแล้ว");
  } catch (err) {
    console.error("⚠️ Database reset failed:", err.message);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
