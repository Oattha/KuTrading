import axios from "axios"
import { useAuth } from "@/store/auth"

// ✅ ดึง URL จาก .env
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api"

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// type ของ refresh response
interface RefreshResponse {
  token: string
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config

    // 🔴 บัญชีถูกแบน
    if (err.response?.status === 403 && err.response?.data?.message === "บัญชีถูกแบน") {
      alert("บัญชีของคุณถูกแบน กรุณาติดต่อผู้ดูแลระบบ")
      useAuth.getState().logout()
      window.location.replace("/login")
      return Promise.reject(err)
    }

    // 🟡 token หมดอายุ → ขอ refresh token
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem("refreshToken")
        if (!refreshToken) throw new Error("No refresh token")

        // ✅ แก้ตรงนี้ด้วย ให้ใช้ API_URL จาก env
        const res = await axios.post<RefreshResponse>(
          `${API_URL.replace(/\/$/, "")}/auth/refresh`,
          { refreshToken }
        )

        const newToken = res.data.token
        localStorage.setItem("token", newToken)

        // retry request เดิม
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshErr) {
        console.error("Refresh failed:", refreshErr)
        useAuth.getState().logout()
        window.location.replace("/login")
      }
    }

    return Promise.reject(err)
  }
)

export type ApiResponse<T> = {
  data: T
  message?: string
}
