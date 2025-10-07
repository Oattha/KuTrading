import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/store/auth"

const menu = [
  { path: "/admin/users", label: "Users" },
  { path: "/admin/kyc", label: "KYC Verification" },
  { path: "/admin/reviews", label: "Reviews" },
  { path: "/admin/reports", label: "Reports" },
  { path: "/admin/logs", label: "Logs" },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const logout = useAuth(state => state.logout)

  const handleLogout = () => {
    logout()
    navigate("/admin/login", { replace: true })
  }

  return (
    <div className="w-64 h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-4 py-6 font-bold text-xl">Admin Panel</div>
      <nav className="flex-1 space-y-2">
        {menu.map(m => (
          <Link
            key={m.path}
            to={m.path}
            className={`block px-4 py-2 rounded hover:bg-gray-700 ${
              pathname === m.path ? "bg-gray-800" : ""
            }`}
          >
            {m.label}
          </Link>
        ))}
      </nav>
      {/* ปุ่ม Logout */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
