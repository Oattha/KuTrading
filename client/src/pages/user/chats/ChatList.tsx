import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { socket } from "@/lib/socket"
import { useAuth } from "@/store/auth"
import { FaExchangeAlt } from "react-icons/fa"

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
  messages: Message[]
  updatedAt: string
  unreadCount: number
  tradeId?: number
}

export default function ChatList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    api.get<Conversation[]>("/chat/conversations").then(res => {
      setConversations(res.data.filter(c => !c.tradeId)) // ✅ filter เฉพาะ private
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
          conv.messages = [msg]
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
      {/* Header + ปุ่มไปหน้าแชทสินค้า */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">ห้องแชท</h2>
        <button
          onClick={() => navigate("/chats/trades")}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
                     bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
        >
          <FaExchangeAlt size={16} />
          <span>แชทสินค้า</span>
        </button>
      </div>

      <div className="space-y-2">
        {conversations.map(conv => {
          const lastMsg = conv.messages[0]
          const other = conv.participants.find(p => p.user.id !== user?.id)?.user

          return (
            <div
              key={conv.id}
              className="p-3 bg-white shadow rounded flex items-center justify-between cursor-pointer"
              onClick={() => navigate(`/chats/${conv.id}`)}
            >
              <div className="flex items-center gap-3">
                <img
                  src={other?.avatarUrl || "/default-avatar.png"}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium">{other?.name}</div>
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
