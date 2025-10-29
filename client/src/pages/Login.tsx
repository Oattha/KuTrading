import { useState } from "react"
import { useAuth, User } from "@/store/auth"
import { useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import logo from "@/assets/image/unnamed (2).png";

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
    setError("")
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

      // ✅ บันทึก token + user
      setAuth(user, res.data.token, res.data.refreshToken)

      navigate("/")
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK"
          ? "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้"
          : "เข้าสู่ระบบไม่สำเร็จ")
      setError(msg)
    }
  }

  const handleGoogleLogin = () => {
      window.location.href = "http://kutrading-server.onrender.com/api/auth/google"
    {/*window.location.href = "http://localhost:5001/api/auth/google"*/}
  }

  return (
    <div className="flex h-screen bg-gradient-to-r from-green-100 via-white to-green-100">
      {/* ซ้าย: ข่าวประชาสัมพันธ์ */}
      <div className="hidden md:flex w-1/2 flex-col justify-center items-center p-12">
        <div className="bg-white shadow-lg rounded-xl p-8 max-w-lg">
          <h2 className="text-xl font-bold mb-4">📢 ข่าวประชาสัมพันธ์</h2>
          <p className="text-sm text-gray-700">
            ระบบ <span className="font-semibold">KuTrading</span> รองรับทั้งการเข้าสู่ระบบด้วย{" "}
            <span className="font-semibold text-green-600">Google</span> และการเข้าสู่ระบบด้วย{" "}
            <span className="font-semibold text-green-600">อีเมล + รหัสผ่าน</span> สำหรับผู้ที่ตั้งรหัสแล้ว
          </p>
          <p className="mt-3 text-red-600 font-semibold">
            ⚠️ โปรดเข้าสู่ระบบเพื่อเริ่มต้นใช้งานระบบเทรดชุมชน
          </p>
        </div>
      </div>

      {/* ขวา: ฟอร์มเข้าสู่ระบบ */}
      <div className="flex w-full md:w-1/2 flex-col justify-center items-center bg-white">
        <div className="w-full max-w-sm p-8">
          <div className="flex flex-col items-center mb-6">

            <img
              src={logo}
              alt="KuTrading Logo"
              className="w-40 h-40 mb-2"
            />

            <h1 className="text-2xl font-bold text-green-800">KuTrading</h1>
            <p className="text-gray-600 text-sm mt-1">เข้าสู่ระบบจัดการบัญชี</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email & Password */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="อีเมล"
              className="w-full p-3 border rounded-lg focus:ring focus:ring-green-200"
              required
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่าน"
              className="w-full p-3 border rounded-lg focus:ring focus:ring-green-200"
              required
            />

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              เข้าสู่ระบบด้วยอีเมล
            </button>

            <div className="relative my-4 flex items-center">
              <div className="flex-grow border-t border-gray-300" />
              <span className="mx-3 text-gray-400 text-sm">หรือ</span>
              <div className="flex-grow border-t border-gray-300" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2 border border-gray-300 px-4 py-2 rounded-lg w-full hover:bg-gray-50 transition"
            >
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google"
                className="w-5 h-5"
              />
              <span>เข้าสู่ระบบด้วย Google</span>
            </button>
          </form>

          {/* สมัครสมาชิก */}
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

          {/* Footer */}
          <div className="mt-6 text-center border-t pt-4">
            <p className="text-sm text-gray-700">หากมีปัญหา กรุณาติดต่อผู้ดูแลระบบ</p>
            <p className="text-sm font-semibold text-green-700">
              📧 Email:{" "}
              <a href="mailto:support@kutrading.com" className="underline">
                support@kutrading.com
              </a>
            </p>
            <p className="text-sm font-semibold text-green-700">
              💬 Line:{" "}
              <a href="https://line.me/ti/p/~admin" target="_blank" className="underline">
                Line Admin
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
