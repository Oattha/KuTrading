import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { socket } from "@/lib/socket"
import { useAuth } from "@/store/auth"
import { FaArrowLeft } from "react-icons/fa"

interface User {
  id: number
  name: string
  avatarUrl?: string
}

interface Message {
  id: number
  conversationId: number
  senderId: number
  text?: string
  mediaUrl?: string
  type: "text" | "image"
  createdAt: string
}

interface Conversation {
  id: number
  participants: { user: User }[]
  lastMessage: Message | null       // ✅ ใช้ lastMessage แทน messages[0]
  updatedAt: string
  unreadCount: number
  tradeId?: number
  tradeTitle?: string
  tradeImage?: string | null
}

export default function TradeChatList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    // 🔹 โหลด trade-conversations
    api.get<Conversation[]>("/chat/trade-conversations").then(res => {
      setConversations(res.data)
      res.data.forEach(conv => {
        socket.emit("joinRoom", { conversationId: conv.id })
      })
    })

    socket.on("message:new", (msg: Message) => {
      setConversations(prev => {
        const updated = [...prev]
        const idx = updated.findIndex(c => c.id === msg.conversationId)
        if (idx !== -1) {
          const conv = { ...updated[idx] }
          conv.lastMessage = msg         // ✅ update lastMessage
          conv.updatedAt = msg.createdAt
          conv.unreadCount = Math.max(0, conv.unreadCount + 1)
          updated.splice(idx, 1)
          updated.unshift(conv)
        }
        return updated
      })
    })

    return () => {
      socket.off("message:new")
    }
  }, [])

  return (
    <div className="p-4">
      {/* Header + ปุ่มกลับไปหน้า ChatList */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">แชทสินค้า / เทรด</h2>
        <button
          onClick={() => navigate("/chats")}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
                     bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          <FaArrowLeft size={14} />
          <span>กลับแชทส่วนตัว</span>
        </button>
      </div>

      <div className="space-y-2">
        {conversations.map(conv => {
          const other = conv.participants.find(p => p.user.id !== user?.id)?.user
          const lastMsg = conv.lastMessage

          return (
            <div
              key={conv.id}
              className="p-3 bg-white shadow rounded flex items-center justify-between cursor-pointer"
              onClick={() => navigate(`/trades/${conv.tradeId}/chat/${conv.id}`)}
            >
              <div className="flex items-center gap-3">
                {/* 🔹 รูปสินค้า */}
                <img
                  src={conv.tradeImage || "/default-product.png"}
                  className="w-10 h-10 rounded-md object-cover"
                />
                <div>
                  {/* 🔹 ชื่อโพสต์สินค้า */}
                  <div className="font-medium">{conv.tradeTitle || other?.name}</div>
                  <div className="text-sm text-gray-500 truncate w-40">
                    {lastMsg?.text || (lastMsg?.mediaUrl ? "📷 รูปภาพ" : "—")}
                  </div>
                </div>
              </div>

              {conv.unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {conv.unreadCount}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
