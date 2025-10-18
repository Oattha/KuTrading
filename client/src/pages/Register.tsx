import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth, User } from "@/store/auth"
import { api } from "@/lib/api"

// type ของ login response
interface LoginResponse {
  user: Partial<User>
  token: string
  refreshToken: string
}

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const { setAuth } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // ✅ สมัครสมาชิก
      await api.post("/auth/register", { email, password, name })

      // ✅ auto login หลังสมัครเสร็จ
      const loginRes = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      })

      // ✅ map user ให้ตรงกับ type User
      const user: User = {
        ...loginRes.data.user,
        role: (loginRes.data.user?.role as User["role"]) ?? "user",
        status: (loginRes.data.user?.status as User["status"]) ?? "pending",
      } as User

      setAuth(user, loginRes.data.token, loginRes.data.refreshToken)
      navigate("/")
    } catch (err: any) {
      setError(err.response?.data?.message || "Register failed")
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-md w-80 space-y-4"
      >
        <h2 className="text-xl font-bold">Register</h2>
        {error && <p className="text-red-500">{error}</p>}

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full p-2 border rounded"
        />

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-2 border rounded"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-2 border rounded"
        />

{/* เส้นแบ่ง “หรือ” */}
<div className="flex items-center my-3">
  <div className="flex-grow border-t border-gray-300"></div>
  <span className="mx-2 text-gray-500 text-sm">หรือ</span>
  <div className="flex-grow border-t border-gray-300"></div>
</div>

{/* ปุ่มสมัครด้วย Google */}
<button
  onClick={() => (window.location.href = "http://localhost:5001/api/auth/google")}
  type="button"
  className="flex items-center justify-center gap-2 border border-gray-300 px-4 py-2 rounded-lg w-full hover:bg-gray-50 transition"
>
  <img
    src="https://developers.google.com/identity/images/g-logo.png"
    alt="Google"
    className="w-5 h-5"
  />
  <span>สมัครด้วย Google</span>
</button>

        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
        >
          Register
        </button>
      </form>
    </div>
  )
}
