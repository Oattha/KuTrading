import { useState, useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import { api } from "@/lib/api"
import { useAuth } from "@/store/auth"
import EmojiPicker from "emoji-picker-react"
import { io, Socket } from "socket.io-client"   // ✅ socket.io
import { ArrowDownCircle } from "lucide-react"
import { Link } from "react-router-dom"

interface User {
  id: number
  name: string
  avatarUrl?: string
}

interface Message {
  id: number
  senderId: number
  text?: string
  mediaUrl?: string
  createdAt: string
  sender?: User
  reads?: { userId: number; readAt: string }[]
  conversationId: number
}

interface Conversation {
  id: number
  participants: { user: User }[]
}

export default function ChatRoom() {
  const { id } = useParams<{ id: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [input, setInput] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true) // ✅ คุม auto scroll
  const [showScrollBtn, setShowScrollBtn] = useState(false) // ✅ แสดงปุ่ม scroll
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const socketRef = useRef<Socket | null>(null)   // ✅ socket ref
  const lastLoggedId = useRef<number | null>(null) // ✅ กัน log loop

  const { user } = useAuth()
  const myId = user?.id || Number(localStorage.getItem("userId"))

  useEffect(() => {
    if (!id) return

    // ✅ connect socket
    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      withCredentials: true,
    })
    socketRef.current = socket

    // join room
    socket.emit("joinRoom", { conversationId: id })

    // ฟังข้อความใหม่ realtime
    const handleNewMessage = (msg: Message) => {
      if (msg.conversationId === Number(id)) {
        setMessages((prev) => [...prev, msg])
      }
    }

    // ฟัง event ว่าอีกฝั่งอ่านแล้ว
    const handleRead = ({ userId, lastReadMessageId }: { userId: number; lastReadMessageId: number }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === lastReadMessageId
            ? {
                ...m,
                reads: [...(m.reads || []), { userId, readAt: new Date().toISOString() }],
              }
            : m
        )
      )
    }

    socket.on("message:new", handleNewMessage)
    socket.on("message:read", handleRead)

    return () => {
      socket.off("message:new", handleNewMessage)
      socket.off("message:read", handleRead)
      socket.disconnect()
    }
  }, [id])

  useEffect(() => {
    if (!id) return

    // ✅ โหลดข้อมูลห้อง
    api.get<Conversation[]>(`/chat/conversations`)
      .then(res => {
        const conv = res.data.find(c => c.id === Number(id)) || null
        setConversation(conv)
      })
      .catch(err => console.error("Error fetching conversation", err))

    // ✅ โหลดข้อความในห้อง
    api.get<Message[]>(`/chat/conversations/${id}/messages`)
      .then(res => setMessages(res.data))
      .catch(err => console.error("Error fetching messages", err))
  }, [id])

  // ✅ Mark conversation ว่าอ่านแล้ว (debounce 300ms)
// ✅ Mark conversation ว่าอ่านแล้ว (เฉพาะข้อความล่าสุด และไม่ยิงซ้ำ)
useEffect(() => {
  if (!id || messages.length === 0) return

  const lastMsg = messages[messages.length - 1]
  if (!lastMsg) return

  // 👉 ยิงเฉพาะถ้า msg ไม่ใช่ของเรา และยังไม่มี read ของเรา
  const alreadyRead = lastMsg.reads?.some(r => r.userId === myId)
  if (lastMsg.senderId !== myId && !alreadyRead) {
    const timeout = setTimeout(() => {
      api.post(`/chat/conversations/${id}/read`)
        .then(() => {
          socketRef.current?.emit("message:read", {
            conversationId: id,
            userId: myId,
            lastReadMessageId: lastMsg.id,
          })
        })
        .catch(err => console.error("Error marking as read", err))
    }, 300)

    return () => clearTimeout(timeout)
  }
}, [messages, id, myId])


  // ✅ scroll แค่ตอน autoScroll เป็น true
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, autoScroll])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 5
    setAutoScroll(isAtBottom)
    setShowScrollBtn(!isAtBottom) // ✅ ถ้าไม่อยู่ล่างสุด → โชว์ปุ่ม
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    setAutoScroll(true)
    setShowScrollBtn(false)
  }

  const handleSend = async () => {
    if ((!input.trim() && !file) || !id) return
    try {
      if (file) {
        const formData = new FormData()
        formData.append("conversationId", id)
        formData.append("files", file)
        await api.post<Message>("/chat/messages", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        setFile(null)
      } else {
        await api.post<Message>("/chat/messages", {
          conversationId: id,
          text: input,
        })
        setInput("")
      }
      // ❌ ไม่ต้อง setMessages เอง → backend broadcast ให้แล้ว
      setAutoScroll(true) // ✅ ส่งข้อความเอง → auto scroll ลงล่าง
    } catch (err) {
      console.error("Error sending message", err)
    }
  }

  const other = conversation?.participants.find(p => p.user.id !== myId)?.user

  // ✅ log myId แค่ตอนเปลี่ยน
  useEffect(() => {
    console.log("myId =", myId)
  }, [myId])

  // ✅ log messages เฉพาะตอนมีข้อความใหม่จริง ๆ
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last && last.id !== lastLoggedId.current) {
      console.log("📩 new message:", last)
      lastLoggedId.current = last.id
    }
  }, [messages])

return (
  <div className="flex flex-col h-screen">
{/* Header: ลอยค้างด้านบน */}
<div className="flex items-center gap-3 px-4 py-3 border-b bg-white shadow-sm flex-shrink-0">
  <Link
    to={`/profile/${other?.id}`}
    className="flex items-center gap-3 hover:opacity-80 transition"
  >
    {other?.avatarUrl ? (
      <img
        src={other.avatarUrl}
        alt={other.name}
        className="w-9 h-9 rounded-full"
      />
    ) : (
      <div className="w-9 h-9 rounded-full bg-gray-300" />
    )}
    <h2 className="font-semibold text-gray-900">
      {other ? other.name : `ห้องแชท #${id}`}
    </h2>
  </Link>
</div>


    {/* Messages: scroll แค่ส่วนนี้ */}
    <div
      className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3 pb-24"
      onScroll={handleScroll}
    >
      {messages.map((msg) => {
        const isMe = Number(msg.senderId) === Number(myId)

        const lastReadMessageId = messages
          .filter(m => m.senderId === myId)
          .filter(m => m.reads?.some(r => r.userId === other?.id))
          .map(m => m.id)
          .pop()

        return (
          <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
{!isMe && other && (
  <Link to={`/profile/${other.id}`} className="mr-2 self-end">
    <img
      src={other.avatarUrl}
      alt={other.name}
      className="w-8 h-8 rounded-full hover:opacity-80 transition"
    />
  </Link>
)}

            <div
              className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl text-sm shadow ${
                isMe
                  ? "bg-indigo-600 text-white rounded-br-none"
                  : "bg-white text-gray-900 border rounded-bl-none"
              }`}
            >
              {msg.text && <p>{msg.text}</p>}
              {msg.mediaUrl && (
                <img src={msg.mediaUrl} alt="media" className="mt-2 max-h-60 rounded-lg border" />
              )}
              <span className="text-xs opacity-70 block mt-1 text-right">
                {new Date(msg.createdAt).toLocaleTimeString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>

              {isMe && msg.id === lastReadMessageId && (
                <span className="text-[10px] text-gray-300 block mt-0.5 text-right">
                  ✔️ อ่านแล้ว
                </span>
              )}
            </div>
          </div>
        )
      })}

      {messages.length === 0 && (
        <p className="text-gray-500 text-center">ยังไม่มีข้อความ</p>
      )}
      <div ref={messagesEndRef} />
    </div>

    {/* ✅ ปุ่ม Scroll to bottom */}
    {showScrollBtn && (
      <button
        onClick={scrollToBottom}
        className="absolute bottom-24 right-6 
                   h-10 w-10 flex items-center justify-center
                   bg-white/40 backdrop-blur-md 
                   border border-white/30 
                   text-gray-800 
                   rounded-full shadow-lg 
                   hover:bg-white/60 
                   transition"
        aria-label="Scroll to bottom"
      >
        <ArrowDownCircle size={22} />
      </button>
    )}

    {/* Input bar */}
    <div
      className="fixed bottom-0 left-0 right-0 z-40
                 border-t bg-white/70 backdrop-blur-md
                 p-3 pt-2 flex items-end justify-center"
    >
        <div
          className="relative flex items-center gap-2 w-full max-w-3xl
                     bg-white/60 backdrop-blur-sm
                     border border-white/50 shadow-sm
                     rounded-full px-3 py-2"
        >
          {/* Emoji */}
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className="shrink-0 px-1 text-[20px] hover:opacity-80"
            aria-label="Emoji"
          >
            😀
          </button>
          {showEmoji && (
            <div className="absolute bottom-[110%] left-0 z-50 drop-shadow-lg">
              <EmojiPicker
                onEmojiClick={(e) => {
                  setInput((prev) => prev + e.emoji)
                  setShowEmoji(false)
                }}
                autoFocusSearch={false}
              />
            </div>
          )}

          {/* File upload */}
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <label
            htmlFor="fileInput"
            className="cursor-pointer text-[18px] hover:opacity-80"
            title="แนบรูปภาพ"
          >
            📷
          </label>

          {/* Input field */}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="พิมพ์ข้อความ..."
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            className="shrink-0 ml-1 h-9 w-9 rounded-full
                       bg-indigo-600 hover:bg-indigo-700
                       text-white grid place-items-center shadow-sm"
            aria-label="ส่ง"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}
