import { useState } from "react"
import { useAuth, User } from "@/store/auth"
import { useNavigate } from "react-router-dom"
import { api } from "@/lib/api"

interface LoginResponse {
  user: Partial<User>
  token: string
  refreshToken: string
}

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { setAuth } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      })

      const user: User = {
        ...res.data.user,
        role: (res.data.user.role as User["role"]) ?? "user",
        status: (res.data.user.status as User["status"]) ?? "active",
      } as User

      setAuth(user, res.data.token, res.data.refreshToken)
      navigate("/")
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed")
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-r from-green-100 via-white to-green-100">
      {/* ซ้าย */}
      <div className="hidden md:flex w-1/2 flex-col justify-center items-center p-12">
        <div className="bg-white shadow-lg rounded-xl p-8 max-w-lg">
          <h2 className="text-xl font-bold mb-4">📢 ข่าวประชาสัมพันธ์</h2>
          <p className="text-sm text-gray-700">
            ประกาศสำหรับผู้ใช้งานระบบ <span className="font-semibold">KuTrading</span>
            โปรดเข้าสู่ระบบเพื่อตรวจสอบสิทธิ์และเริ่มต้นการใช้งานฟีเจอร์ทั้งหมด
          </p>
          <p className="mt-3 text-red-600 font-semibold">
            ⚠️ ระบบนี้ใช้สำหรับผู้ที่สมัครสมาชิกแล้วเท่านั้น
          </p>
        </div>
      </div>

      {/* ขวา */}
      <div className="flex w-full md:w-1/2 flex-col justify-center items-center bg-white">
        <div className="w-full max-w-sm p-8">
          <div className="flex flex-col items-center mb-6">
            <img
              src="src/assets/image/unnamed (2).png"
              alt="KuTrading Logo"
              className="w-40 h-40 mb-2"
            />
            <h1 className="text-2xl font-bold text-green-800">KuTrading</h1>
            <p className="text-gray-600 text-sm mt-1">เข้าสู่ระบบจัดการบัญชี</p>
          </div>

          {error && <p className="text-red-500 mb-3">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-3 border rounded-lg focus:ring focus:ring-green-200"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-3 border rounded-lg focus:ring focus:ring-green-200"
            />

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              เข้าสู่ระบบ KuTrading
            </button>
          </form>

          {/* ปุ่มสมัคร */}
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              ยังไม่มีบัญชี?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-green-600 font-semibold hover:underline"
              >
                สมัครเลย
              </button>
            </p>
          </div>

          {/* ✅ ช่องทางการติดต่อผู้ดูแลระบบ */}
          <div className="mt-6 text-center border-t pt-4">
            <p className="text-sm text-gray-700">หากมีปัญหา กรุณาติดต่อผู้ดูแลระบบ</p>
            <p className="text-sm font-semibold text-green-700">
              📧 Email: <a href="mailto:support@kutrading.com" className="underline">support@kutrading.com</a>
            </p>
            <p className="text-sm font-semibold text-green-700">
              💬 Line: <a href="https://line.me/ti/p/~admin" target="_blank" className="underline">Line Admin</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
