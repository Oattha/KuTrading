import { useState } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/store/auth"

// ✅ type สำหรับ response จาก API
interface ApiResponse {
  message: string
}

export default function Settings() {
  const { user, token } = useAuth()
  const [oldPassword, setOldPassword] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [oldPassValid, setOldPassValid] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  // ✅ ตรวจสอบรหัสผ่านเดิมแบบเรียลไทม์
  const handleVerifyOldPassword = async () => {
    if (!oldPassword) return
    try {
      const res = await api.post<ApiResponse>(
        "/users/verify-password",
        { oldPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setOldPassValid(true)
      setMessage(res.data.message || "รหัสผ่านถูกต้อง")
      setError("")
    } catch (err: any) {
      setOldPassValid(false)
      setMessage("")
      setError(err.response?.data?.message || "รหัสผ่านเดิมไม่ถูกต้อง")
    }
  }

  // ✅ ตั้งหรือเปลี่ยนรหัสผ่าน
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setError("")

    if (!password || !confirm) {
      setError("กรุณากรอกรหัสผ่านให้ครบ")
      return
    }
    if (password !== confirm) {
      setError("รหัสผ่านทั้งสองไม่ตรงกัน")
      return
    }

    try {
      setLoading(true)
      // ✅ ใช้ passwordSet จาก backend แทน user.password
      const body = user?.passwordSet ? { oldPassword, password } : { password }
      const res = await api.post<ApiResponse>(
        "/users/set-password",
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessage(res.data.message || "บันทึกรหัสผ่านสำเร็จ")
      setError("")
    } catch (err: any) {
      const msg = err.response?.data?.message || "เกิดข้อผิดพลาดในการตั้งรหัสผ่าน"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">⚙️ ตั้งค่าผู้ใช้</h1>
      <p className="text-gray-600 mb-6">จัดการบัญชีและความปลอดภัยของคุณ</p>

      <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">
          {user?.passwordSet ? "🔁 เปลี่ยนรหัสผ่าน" : "🔐 ตั้งรหัสผ่านใหม่"}
        </h2>

        <form onSubmit={handleSetPassword} className="space-y-4">
          {/* ✅ ถ้ามีรหัสเดิม ให้กรอก old password */}
{/* ✅ ถ้ามีรหัสผ่านอยู่แล้ว (passwordSet = true) → ให้กรอก old password */}
{user?.passwordSet && (
  <div>
    <label className="block text-sm font-medium mb-1">รหัสผ่านเดิม</label>
    <input
      type="password"
      value={oldPassword}
      onChange={(e) => setOldPassword(e.target.value)}
      onBlur={handleVerifyOldPassword}
      placeholder="ใส่รหัสผ่านเดิม"
      className={`w-full border p-2 rounded-lg focus:ring focus:ring-green-200 ${
        oldPassValid === false ? "border-red-400" : ""
      }`}
    />
    {oldPassValid === true && (
      <p className="text-green-600 text-sm">✅ รหัสผ่านเดิมถูกต้อง</p>
    )}
    {oldPassValid === false && (
      <p className="text-red-500 text-sm">❌ รหัสผ่านเดิมไม่ถูกต้อง</p>
    )}
  </div>
)}


          {/* ✅ ฟอร์มใส่รหัสใหม่ */}
          <div>
            <label className="block text-sm font-medium mb-1">รหัสผ่านใหม่</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ใส่รหัสผ่านใหม่"
              className="w-full border p-2 rounded-lg focus:ring focus:ring-green-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ยืนยันรหัสผ่านใหม่</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="พิมพ์รหัสซ้ำอีกครั้ง"
              className="w-full border p-2 rounded-lg focus:ring focus:ring-green-200"
            />
          </div>

          {/* ✅ แสดงข้อความ */}
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          {message && <p className="text-green-600 text-sm font-medium">{message}</p>}

          {/* ✅ ปุ่ม */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg text-white font-semibold transition ${
              loading
                ? "bg-green-300 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading
              ? "กำลังบันทึก..."
              : user?.passwordSet
              ? "เปลี่ยนรหัสผ่าน"
              : "ตั้งรหัสผ่าน"}
          </button>
        </form>
      </div>
    </div>
  )
}
