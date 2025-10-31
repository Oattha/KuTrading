import { execSync } from "child_process";
import prisma from "./src/config/prisma.js";
import bcrypt from "bcryptjs";

beforeAll(async () => {
  console.log("🧹 Reset test database...");

  // ✅ ข้าม reset ถ้าเป็น production test (Render)
  if (process.env.BASE_URL?.includes("onrender.com")) {
    console.log("⏩ ข้ามการ reset DB (ใช้ฐานข้อมูล Production)");
    return;
  }

  try {
    // 🧱 Reset เฉพาะตอนรันทดสอบ local เท่านั้น
    execSync("npx prisma migrate reset --force --skip-generate --skip-seed", {
      stdio: "inherit",
    });

    console.log("👤 สร้างผู้ใช้ทดสอบ (mock users)...");

    // ✅ ผู้ใช้หลัก (ใช้ใน test-login)
    await prisma.user.create({
      data: {
        email: "testuser@gmail.com",
        name: "Test User",
        avatarUrl: "https://via.placeholder.com/100",
        role: "user",
        status: "active",
        password: await bcrypt.hash("testpassword", 10),
      },
    });

    // ✅ ผู้ใช้รอง (ตัวทดสอบเพิ่มเติม)
    await prisma.user.create({
      data: {
        email: "garefafaw@gmail.com",
        name: "Garefafaw",
        avatarUrl: "https://via.placeholder.com/100",
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
