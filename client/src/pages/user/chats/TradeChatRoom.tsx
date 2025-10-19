import { useState, useEffect, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useAuth } from "@/store/auth"
import EmojiPicker from "emoji-picker-react"
import { io, Socket } from "socket.io-client"
import { ArrowDownCircle, X } from "lucide-react"

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
  type?: "text" | "image" | "video"
  createdAt: string
  sender?: User
  reads?: { userId: number; readAt: string }[]
  conversationId: number
}

interface Conversation {
  id: number
  tradeId?: number
  tradeTitle?: string
  tradeImage?: string
  participants: { user: User }[]
}

export default function TradeChatRoom() {
  const { tradeId, conversationId } = useParams<{ tradeId: string; conversationId: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [input, setInput] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const { user } = useAuth()
  const myId = user?.id || Number(localStorage.getItem("userId"))

  // ✅ connect socket
  useEffect(() => {
    if (!conversationId) return
    const socket = io(import.meta.env.VITE_SOCKET_URL, { withCredentials: true })
    socketRef.current = socket

    socket.emit("joinRoom", { conversationId })

    const handleNewMessage = (msg: Message) => {
      if (msg.conversationId === Number(conversationId)) {
        setMessages((prev) => [...prev, msg])
      }
    }

    const handleRead = ({ userId, lastReadMessageId }: { userId: number; lastReadMessageId: number }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === lastReadMessageId
            ? { ...m, reads: [...(m.reads || []), { userId, readAt: new Date().toISOString() }] }
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
  }, [conversationId])

  // ✅ โหลดข้อมูลห้อง + ข้อความ
  useEffect(() => {
    if (!conversationId) return
    api.get<Conversation>(`/chat/conversations/${conversationId}`)
      .then((res) => setConversation(res.data))
      .catch((err) => console.error("Error fetching conversation", err))

    api.get<Message[]>(`/chat/conversations/${conversationId}/messages`)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("Error fetching messages", err))
  }, [conversationId])

  // ✅ Mark as read
  useEffect(() => {
    if (!conversationId || messages.length === 0) return
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg) return

    const alreadyRead = lastMsg.reads?.some((r) => r.userId === myId)
    if (lastMsg.senderId !== myId && !alreadyRead) {
      const timeout = setTimeout(() => {
        api.post(`/chat/conversations/${conversationId}/read`)
          .then(() => {
            socketRef.current?.emit("message:read", {
              conversationId,
              userId: myId,
              lastReadMessageId: lastMsg.id,
            })
          })
          .catch((err) => console.error("Error marking as read", err))
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [messages, conversationId, myId])

  // ✅ auto scroll
  useEffect(() => {
    if (autoScroll) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, autoScroll])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 5
    setAutoScroll(isAtBottom)
    setShowScrollBtn(!isAtBottom)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    setAutoScroll(true)
    setShowScrollBtn(false)
  }

  // ✅ preview ก่อนส่ง
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    if (selectedFile) setPreviewUrl(URL.createObjectURL(selectedFile))
  }

  const handleCancelFile = () => {
    setFile(null)
    setPreviewUrl(null)
  }

  // ✅ ส่งข้อความ
  const handleSend = async () => {
    if ((!input.trim() && !file) || !conversationId) return
    try {
      if (file) {
        const formData = new FormData()
        formData.append("conversationId", conversationId)
        formData.append("files", file)
        await api.post<Message>("/chat/messages", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        handleCancelFile()
      } else {
        await api.post<Message>("/chat/messages", { conversationId, text: input })
        setInput("")
      }
      setAutoScroll(true)
    } catch (err) {
      console.error("Error sending message", err)
    }
  }

  const other = conversation?.participants.find((p) => p.user.id !== myId)?.user

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shadow-sm flex-shrink-0">
        {conversation?.tradeImage ? (
          <img src={conversation.tradeImage} alt="trade" className="w-9 h-9 rounded-md object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-md bg-gray-300" />
        )}
        <h2 className="font-semibold text-gray-900">
          ห้องเทรด #{tradeId} — {conversation?.tradeTitle || other?.name}
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3 pb-32" onScroll={handleScroll}>
        {messages.map((msg) => {
          const isMe = msg.senderId === myId
          const lastReadMessageId = messages
            .filter((m) => m.senderId === myId)
            .filter((m) => m.reads?.some((r) => r.userId === other?.id))
            .map((m) => m.id)
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
                  isMe ? "bg-indigo-600 text-white rounded-br-none" : "bg-white text-gray-900 border rounded-bl-none"
                }`}
              >
                {msg.text && <p>{msg.text}</p>}
                {msg.mediaUrl && msg.type === "video" ? (
                  <video src={msg.mediaUrl} controls className="mt-2 max-h-60 rounded-lg border" />
                ) : msg.mediaUrl ? (
                  <img src={msg.mediaUrl} alt="media" className="mt-2 max-h-60 rounded-lg border" />
                ) : null}
                <span className="text-xs opacity-70 block mt-1 text-right">
                  {new Date(msg.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {isMe && msg.id === lastReadMessageId && (
                  <span className="text-[10px] text-gray-300 block mt-0.5 text-right">✔️ อ่านแล้ว</span>
                )}
              </div>
            </div>
          )
        })}

        {messages.length === 0 && <p className="text-gray-500 text-center">ยังไม่มีข้อความ</p>}
        <div ref={messagesEndRef} />

                  {/* จุดอ้างอิงเลื่อนลง */}
  <div ref={messagesEndRef} />

  {/* ✅ ปุ่มลูกศรเลื่อนลง */}
{showScrollBtn && (
  <button
    onClick={scrollToBottom}
    className="fixed bottom-24 right-5 z-50
               p-3 rounded-full
               bg-white/30 border border-white/40
               backdrop-blur-md
               text-indigo-600 shadow-lg
               hover:bg-white/40 hover:scale-110
               transition-all duration-300"
  >
    <ArrowDownCircle size={26} />
  </button>
  )}
      </div>

      {/* ✅ Preview ก่อนส่ง */}
      {previewUrl && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center z-50">
          <div className="relative bg-white border rounded-2xl p-2 shadow-lg max-w-[200px]">
            <button
              onClick={handleCancelFile}
              className="absolute top-1 right-1 bg-black/40 text-white rounded-full p-1 hover:bg-black/60"
              aria-label="ยกเลิก"
            >
              <X size={14} />
            </button>
            {file?.type.startsWith("video") ? (
              <video src={previewUrl} className="rounded-xl max-h-40" controls />
            ) : (
              <img src={previewUrl} className="rounded-xl max-h-40 object-cover" />
            )}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/70 backdrop-blur-md p-3 pt-2 flex items-end justify-center">
        <div className="relative flex items-center gap-2 w-full max-w-3xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm rounded-full px-3 py-2">
          {/* Emoji */}
          <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="shrink-0 px-1 text-[20px] hover:opacity-80" aria-label="Emoji">
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

          {/* Upload */}
          <input id="fileInput" type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
          <label htmlFor="fileInput" className="cursor-pointer text-[18px] hover:opacity-80" title="แนบไฟล์">
            📷🎥
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
            className="shrink-0 ml-1 h-9 w-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white grid place-items-center shadow-sm"
            aria-label="ส่ง"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}
