import { Outlet } from "react-router-dom"
import Navbar from "@/components/user/Navbar"
import { socket } from "@/lib/socket"
import { useEffect } from "react"
import toast from "react-hot-toast"
import { useAuth } from "@/store/auth"

export default function UserLayout() {
  const { user } = useAuth()

  interface SocketNotification {
    id?: number
    title?: string
    body?: string
    postId?: number
    tradeId?: number
    isRead?: boolean
    createdAt?: string
  }

  useEffect(() => {
    if (!user?.id) return

    if (!socket.connected) socket.connect()
    socket.emit("register", { userId: user.id })
    console.log("📡 Registered socket for user:", user.id)

    // ✅ ฟัง event realtime
    const handleNew = (noti: SocketNotification) => {
      console.log("🔔 Realtime noti:", noti)
      toast(`🔔 ${noti.title || "คุณมีการแจ้งเตือนใหม่"}`)
    }

    // ✅ เมื่อ noti ถูกอ่าน (แจ้งให้ทุก tab รู้)
    const handleRead = ({ id }: { id?: number }) => {
      console.log("👁️ อ่าน noti แล้ว:", id)
      window.dispatchEvent(new CustomEvent("noti:read", { detail: id }))
    }

    // ✅ เมื่อ mark all แล้ว
    const handleMarkAll = () => {
      console.log("✅ อ่านทั้งหมดแล้ว")
      window.dispatchEvent(new Event("noti:markAllRead"))
    }

    socket.on("notification:new", handleNew)
    socket.on("notification:read", handleRead)
    socket.on("notification:markAllRead", handleMarkAll)

    return () => {
      socket.off("notification:new", handleNew)
      socket.off("notification:read", handleRead)
      socket.off("notification:markAllRead", handleMarkAll)
    }
  }, [user?.id])

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Navbar />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
