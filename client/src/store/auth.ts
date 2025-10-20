import { create } from "zustand"
import { api } from "@/lib/api"

// ========== Interfaces ==========
export interface UserDocument {
  id: number
  status: "submitted" | "approved" | "rejected"
  fileUrl?: string
  reviewedAt?: string | null
}

export interface User {
  id: number
  name: string
  email: string
  role: "user" | "admin"
  status: "pending" | "active" | "banned"
  documents?: UserDocument[]
  avatarUrl?: string       // ✅ เพิ่มตรงนี้
  password?: string | null  // รหัสผ่านอาจเป็น null สำหรับผู้ใช้ที่ลงทะเบียนผ่าน OAuth
  passwordSet?: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  loading: boolean

  setAuth: (user: User, token: string, refreshToken: string) => void
  setUser: (user: User | null) => void   // ✅ เพิ่ม
  refreshUser: () => Promise<void>
  logout: () => void
}

// โหลดจาก localStorage
const storedUser = localStorage.getItem("user")
const storedToken = localStorage.getItem("token")
const storedRefresh = localStorage.getItem("refreshToken")

export const useAuth = create<AuthState>((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  refreshToken: storedRefresh || null,
  loading: false,

  setAuth: (user, token, refreshToken) => {
    localStorage.setItem("user", JSON.stringify(user))
    localStorage.setItem("token", token)
    localStorage.setItem("refreshToken", refreshToken)
    set({ user, token, refreshToken })
  },

  // ✅ ใช้ตอนอัปเดต avatar หรือข้อมูลอื่น ๆ
  setUser: (user) => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user))
    } else {
      localStorage.removeItem("user")
    }
    set({ user })
  },

  refreshUser: async () => {
    set({ loading: true })
    try {
      const res = await api.get<User>("/users/me")
      localStorage.setItem("user", JSON.stringify(res.data))
      set({ user: res.data, loading: false })
    } catch (err: any) {
      console.error("refreshUser error:", err)
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      localStorage.removeItem("refreshToken")
      set({ user: null, token: null, refreshToken: null, loading: false })
    }
  },

  logout: () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
    set({ user: null, token: null, refreshToken: null, loading: false })
  },
}))

// ✅ เพิ่ม alias ใหม่ (ห้ามตัดโค้ดเดิม)
export const useAuthStore = useAuth
