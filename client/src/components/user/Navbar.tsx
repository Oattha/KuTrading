import { Link, useLocation } from "react-router-dom"
import { useAuth } from "@/store/auth"
import { useState, useEffect } from "react"
import { FaHome, FaExchangeAlt, FaComments, FaBell } from "react-icons/fa"
import logo from "@/assets/image/unnamed (2).png"
import { api } from "@/lib/api"
import { socket } from "@/lib/socket"
import toast from "react-hot-toast"

export default function Navbar() {
  const location = useLocation()
  const { user, logout, token } = useAuth()
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // ✅ โหลด noti ที่ยังไม่อ่านตอนแรก
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get("/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const notifications = res.data as Array<{ isRead: boolean; title?: string }>
        const unread = notifications.filter((n) => !n.isRead).length
        setUnreadCount(unread)
      } catch (err) {
        console.error("Error fetching notifications", err)
      }
    }
    if (token) fetchUnread()
  }, [token])

  // ✅ realtime socket
  useEffect(() => {
    if (!user?.id) return

    // 🟢 ได้ noti ใหม่
    socket.on("notification:new", (noti: { title?: string }) => {
      setUnreadCount((prev) => prev + 1)
      toast(`🔔 ${noti.title || "คุณมีการแจ้งเตือนใหม่"}`)
    })

    // 🟡 เมื่อมี noti ถูก mark ว่าอ่าน (เฉพาะ 1 อัน)
    socket.on("notification:read", ({ id }: { id: number }) => {
      console.log("👁️ notification read:", id)
      setUnreadCount((prev) => Math.max(prev - 1, 0))
    })

    // 🟢 เมื่อ mark ทั้งหมดว่าอ่าน
    socket.on("notification:markAllRead", () => {
      console.log("✅ mark all read")
      setUnreadCount(0)
    })

    return () => {
      socket.off("notification:new")
      socket.off("notification:read")
      socket.off("notification:markAllRead")
    }
  }, [user?.id])

  // ✅ ฟัง event จาก UserLayout ที่ส่งมา (อ่านแล้ว / อ่านทั้งหมด)
useEffect(() => {
  const handleRead = (e: Event) => {
    setUnreadCount((prev) => Math.max(prev - 1, 0))
  }

  const handleAll = () => {
    setUnreadCount(0)
  }

  window.addEventListener("noti:read", handleRead)
  window.addEventListener("noti:markAllRead", handleAll)

  return () => {
    window.removeEventListener("noti:read", handleRead)
    window.removeEventListener("noti:markAllRead", handleAll)
  }
}, [])



  return (
    <nav className="sticky top-0 z-50 border-b border-white/20 
                    bg-white/30 backdrop-blur-lg shadow-md 
                    px-6 py-3 flex items-center justify-between">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <img src={logo} alt="Logo"
          className="w-10 h-10 object-cover rounded-full shadow-md" />
      </Link>

      {/* Center Menu */}
      <ul className="flex gap-8">
        <li>
          <Link to="/"
            className={`flex flex-col items-center text-sm transition ${location.pathname === "/"
                ? "text-indigo-600 font-semibold"
                : "text-gray-600 hover:text-indigo-500"}`}>
            <FaHome size={18} />
            <span className="text-xs">Home</span>
          </Link>
        </li>

        <li>
          <Link to="/trades"
            className={`flex flex-col items-center text-sm transition ${location.pathname.startsWith("/trades")
                ? "text-indigo-600 font-semibold"
                : "text-gray-600 hover:text-indigo-500"}`}>
            <FaExchangeAlt size={18} />
            <span className="text-xs">Trades</span>
          </Link>
        </li>

        <li>
          <Link to="/chats"
            className={`flex flex-col items-center text-sm transition ${location.pathname.startsWith("/chats")
                ? "text-indigo-600 font-semibold"
                : "text-gray-600 hover:text-indigo-500"}`}>
            <FaComments size={18} />
            <span className="text-xs">Chats</span>
          </Link>
        </li>

        {/* Notifications + 🔴 dot */}
        <li className="relative">
          <Link to="/notifications"
            className={`flex flex-col items-center text-sm transition ${location.pathname.startsWith("/notifications")
                ? "text-indigo-600 font-semibold"
                : "text-gray-600 hover:text-indigo-500"}`}>
            <FaBell size={18} />
            <span className="text-xs">Notifications</span>

            {/* ✅ Dot แดง */}
            {unreadCount > 0 && (
              <span className="absolute top-0 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            )}
          </Link>
        </li>
      </ul>

      {/* Profile */}
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
