import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/store/auth"

interface ProtectedRouteProps {
  children: React.ReactNode
  role?: "user" | "admin"
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, token, loading } = useAuth()
  const location = useLocation()

  // 🟡 ถ้ายังโหลด user อยู่ → แสดง loader
  if (loading) {
    return <p>กำลังตรวจสอบสิทธิ์...</p>
  }

  // ❌ ไม่มี token → ยังไม่ได้ login
  if (!token) {
    return (
      <Navigate
        to={role === "admin" ? "/admin/login" : "/login"}
        replace
        state={{ from: location }}
      />
    )
  }

  // ❌ login แล้ว แต่ role ไม่ตรง
  if (role && user?.role !== role) {
    return (
      <Navigate
        to={role === "admin" ? "/admin/login" : "/login"}
        replace
      />
    )
  }

  // ❌ ถูกแบน
  if (user?.status === "banned") {
    alert("บัญชีของคุณถูกแบน กรุณาติดต่อผู้ดูแลระบบ")
    return <Navigate to="/login" replace />
  }

  // 🔑 ถ้าเป็น user แต่ยังไม่ผ่าน KYC
// 🔑 ถ้าเป็น user แต่ยังไม่ผ่าน KYC
if (role === "user") {
  const kycApproved =
    user?.documents?.some(doc => doc.status === "approved") 
    || user?.status === "active" // ✅ fallback ถ้า admin อัปเดตสถานะเป็น active

  if (!kycApproved && location.pathname !== "/kyc-upload") {
    return <Navigate to="/kyc-upload" replace />
  }
}


  // ✅ ผ่านทุกเงื่อนไข
  return <>{children}</>
}
