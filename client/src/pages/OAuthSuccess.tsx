import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import { useAuth } from "@/store/auth"   // ✅ ดึง Zustand
import { api } from "@/lib/api"          // ✅ ใช้ axios instance
import { User } from "@/store/auth"  // ✅ หรือ "@/types/user" ถ้าคุณเก็บ type แยกไว้

export default function OAuthSuccess() {
  const navigate = useNavigate()
  const { setAuth } = useAuth()

  useEffect(() => {
    const handleAuth = async () => {
      const params = new URLSearchParams(window.location.search)
      const token = params.get("token")
      const refresh = params.get("refreshToken")

      if (!token) {
        toast.error("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่")
        navigate("/login")
        return
      }

      // ✅ เก็บ token ลง localStorage
      localStorage.setItem("token", token)
      localStorage.setItem("refreshToken", refresh || "")

      try {
        // ✅ ดึงข้อมูล user จาก backend ด้วย token ที่เพิ่งได้มา
const res = await api.get<User>("/users/me", {
  headers: { Authorization: `Bearer ${token}` },
})
setAuth(res.data, token, refresh || "")

        // ✅ เซ็ต state ใน Zustand (Auth store)
        setAuth(res.data, token, refresh || "")
        toast.success("เข้าสู่ระบบด้วย Google สำเร็จ!")

        // ✅ กลับหน้า Home
        setTimeout(() => navigate("/"), 1000)
      } catch (err) {
        console.error("❌ โหลดข้อมูลผู้ใช้ล้มเหลว:", err)
        toast.error("โหลดข้อมูลผู้ใช้ไม่สำเร็จ")
        navigate("/login")
      }
    }

    handleAuth()
  }, [navigate, setAuth])

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-700 mb-2">
          กำลังเข้าสู่ระบบด้วย Google...
        </p>
        <p className="text-sm text-gray-500">
          กรุณารอสักครู่ ระบบกำลังตรวจสอบข้อมูลของคุณ
        </p>
      </div>
    </div>
  )
}
