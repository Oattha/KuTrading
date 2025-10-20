// client/src/types/user.ts
export type UserRole = "user" | "admin"
export type UserStatus = "pending" | "active" | "banned"
export type KycStatus = "submitted" | "approved" | "rejected"

export interface UserDocument {
  id: number
  fileUrl: string
  status: KycStatus
  reviewedAt?: string | null
}

export interface User {
  id: number
  email: string
  name?: string
  avatarUrl?: string
  role: UserRole
  status: UserStatus   // ✅ ตรงกับ prisma แล้ว
  isEmailVerified: boolean
  documents?: UserDocument[]
  password?: string | null  // รหัสผ่านอาจเป็น null สำหรับผู้ใช้ที่ลงทะเบียนผ่าน OAuth
  
}

