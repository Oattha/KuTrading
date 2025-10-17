import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/store/auth"

const menu = [
  { path: "/admin/users", label: "Users" },
  { path: "/admin/kyc", label: "KYC Verification" },
  { path: "/admin/reviews", label: "Reviews" },
  { path: "/admin/reports", label: "Reports" },
  { path: "/admin/logs", label: "Logs" },
]

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const logout = useAuth((s) => s.logout)

  const handleLogout = () => {
    logout()
    navigate("/admin/login", { replace: true })
  }

  return (
    <div
      className={`
        fixed top-0 left-0 h-screen w-64 bg-gray-900 text-white flex flex-col
        shadow-lg z-50 transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      <div className="px-4 py-6 font-bold text-xl border-b border-gray-700 flex justify-between items-center">
        Admin Panel
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-lg font-bold"
        >
          ✕
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto mt-2 space-y-1">
        {menu.map((m) => (
          <Link
            key={m.path}
            to={m.path}
            className={`block px-4 py-2 rounded transition ${
              pathname === m.path
                ? "bg-gray-800 text-white font-semibold"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          >
            {m.label}
          </Link>
        ))}
      </nav>

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
