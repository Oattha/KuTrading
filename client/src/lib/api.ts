import axios from "axios"
import { useAuth } from "@/store/auth"

export const api = axios.create({
  baseURL: "http://localhost:5001/api",
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// type ของ refresh response (แก้เป็น token ให้ตรงกับ backend)
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

        const res = await axios.post<RefreshResponse>(
          "http://localhost:5001/api/auth/refresh",
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
