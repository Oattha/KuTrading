import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/store/auth"
import { Link } from "react-router-dom"
import { socket } from "@/lib/socket"

interface Notification {
  id: number
  title: string | null
  body: string | null
  isRead: boolean
  createdAt: string
  postId?: number | null   // ✅ รองรับคลิกไปโพสต์
  tradeId?: number | null  // ✅ รองรับคลิกไปเทรด
}

export default function Notifications() {
  const { token } = useAuth()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  // ✅ โหลดการแจ้งเตือนครั้งแรก
  useEffect(() => {
    const fetchNoti = async () => {
      try {
        const res = await api.get<Notification[]>("/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setItems(res.data)
      } catch (err) {
        console.error("Error fetching notifications", err)
      } finally {
        setLoading(false)
      }
    }
    if (token) fetchNoti()
  }, [token])

  // ✅ Realtime Socket.IO
  useEffect(() => {
    socket.on("notification:new", (noti: Notification) => {
      setItems((prev) => [noti, ...prev]) // เพิ่มเข้า list บนสุด
    })

    socket.on("notification:read", ({ id }) => {
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
    })

    socket.on("notification:markAllRead", () => {
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
    })

    return () => {
      socket.off("notification:new")
      socket.off("notification:read")
      socket.off("notification:markAllRead")
    }
  }, [])

  // ✅ Mark ว่าอ่านแล้ว
const markAsRead = async (id: number) => {
  try {
    await api.patch(`/notifications/${id}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    })
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )

    // ✅ แจ้งให้ทุก tab อัปเดตทันที (รวมถึง Navbar)
    socket.emit("notification:read", { id })
  } catch (err) {
    console.error("Error marking as read", err)
  }
}


  // ✅ Mark all ว่าอ่านแล้ว
const markAllRead = async () => {
  try {
    await api.patch("/notifications/read-all", {}, {
      headers: { Authorization: `Bearer ${token}` },
    })
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))

    // ✅ แจ้งให้ทุก tab รีเซ็ตจุดแดง
    socket.emit("notification:markAllRead")
  } catch (err) {
    console.error("Error marking all read", err)
  }
}

  if (loading) return <p className="p-6">กำลังโหลด...</p>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">🔔 การแจ้งเตือน</h1>
        <button
          onClick={markAllRead}
          disabled={items.length === 0}
          className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
        >
          ทำเครื่องหมายว่าอ่านทั้งหมด
        </button>
      </div>

      <div className="space-y-3">
        {items.map((n) => (
          <Link
            key={n.id}
            to={
              n.postId
                ? `/posts/${n.postId}`
                : n.tradeId
                ? `/trades/${n.tradeId}`
                : "#"
            }
          >
            <div
              className={`p-4 rounded-xl border shadow-sm ${
                n.isRead ? "bg-white" : "bg-yellow-50"
              }`}
            >
              <div className="flex justify-between">
                <h2 className="font-semibold">{n.title || "ไม่มีหัวข้อ"}</h2>
                {!n.isRead && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      markAsRead(n.id)
                    }}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    อ่านแล้ว
                  </button>
                )}
              </div>
              <p className="text-gray-700">{n.body}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(n.createdAt).toLocaleString("th-TH")}
              </p>
            </div>
          </Link>
        ))}

        {items.length === 0 && (
          <div className="p-10 text-center text-gray-500 border rounded-xl">
            ❌ ไม่มีการแจ้งเตือน
          </div>
        )}
      </div>
    </div>
  )
}
