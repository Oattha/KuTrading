import { Link, useLocation } from "react-router-dom"
import { useAuth } from "@/store/auth"
import { useState } from "react"
import { FaHome, FaExchangeAlt, FaComments, FaBell } from "react-icons/fa"
import logo from "@/assets/image/unnamed (2).png"   // ✅ import logo เข้ามา

const navItems = [
  { path: "/", icon: <FaHome size={18} />, label: "Home" },
  { path: "/trades", icon: <FaExchangeAlt size={18} />, label: "Trades" },
  { path: "/chats", icon: <FaComments size={18} />, label: "Chats" },
  { path: "/notifications", icon: <FaBell size={18} />, label: "Notifications" },
]

export default function Navbar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <nav
      className="sticky top-0 z-50 border-b border-white/20 
                 bg-white/30 backdrop-blur-lg shadow-md 
                 px-6 py-3 flex items-center justify-between"
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <img
          src={logo}
          alt="Logo"
          className="w-10 h-10 object-cover rounded-full shadow-md"
        />
        {/* ถ้าอยากใส่ชื่อกำกับด้วย เพิ่มตรงนี้ */}
        {/* <span className="font-bold text-green-500">OATTHAPHON.K</span> */}
      </Link>

      {/* Center Menu (Icons only) */}
      <ul className="flex gap-8">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`flex flex-col items-center text-sm transition ${
                location.pathname.startsWith(item.path)
                  ? "text-indigo-600 font-semibold"
                  : "text-gray-600 hover:text-indigo-500"
              }`}
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Profile Dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 focus:outline-none"
        >
          <img
            src={user?.avatarUrl || "https://placehold.co/40"}
            alt={user?.name || "profile"}
            className="w-10 h-10 rounded-full border-2 border-green-400 object-cover shadow-sm"
          />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 py-2 z-50">
            <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100 text-sm">
              👤 Profile
            </Link>
            <Link to="/kyc-upload" className="block px-4 py-2 hover:bg-gray-100 text-sm">
              🔑 KYC Verification
            </Link>
            <Link to="/settings" className="block px-4 py-2 hover:bg-gray-100 text-sm">
              ⚙️ Settings
            </Link>
            <button
              onClick={logout}
              className="block w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-500"
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
