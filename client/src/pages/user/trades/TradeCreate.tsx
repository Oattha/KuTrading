import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { api } from "@/lib/api"

// ✅ กำหนด type ของ response จาก backend
interface CreateTradeResponse {
  trade: {
    id: number
    postId: number
    location: string
    scheduledAt?: string
    offerText?: string
    offerImage?: string
  }
  conversationId: number
}

export default function TradeCreate() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const postId = searchParams.get("postId")

  const [post, setPost] = useState<any>(null)
  const [location, setLocation] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [offerText, setOfferText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  // ✅ โหลดโพสต์
  useEffect(() => {
    if (!postId) return
    api.get(`/posts/${postId}`)
      .then(res => setPost(res.data))
      .catch(err => console.error("Error fetching post", err))
  }, [postId])

  const handleCreateTrade = async () => {
    if (!postId || !location) {
      alert("กรุณาใส่สถานที่")
      return
    }

    try {
      setLoading(true)

      const formData = new FormData()
      formData.append("postId", postId)
      formData.append("location", location)
      if (scheduledAt) {
        formData.append("scheduledAt", new Date(scheduledAt).toISOString())
      }
      if (offerText) {
        formData.append("offerText", offerText)
      }
      if (file) {
        formData.append("offerImage", file)
      }

      // ✅ backend จะ return { trade, conversationId }
      const res = await api.post<CreateTradeResponse>("/trades", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      const { trade, conversationId } = res.data
      alert("สร้างเทรด + ห้องแชทสำเร็จ")

      // 👉 พาไปที่หน้า TradeChatRoom (ใช้ tradeId + conversationId)
      navigate(`/trades/${trade.id}/chat/${conversationId}`)
    } catch (err) {
      console.error("Error creating trade", err)
      alert("ไม่สามารถสร้างเทรดได้")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">สร้างการแลกเปลี่ยน</h1>
      <p className="mb-2">โพสต์ที่เลือก: #{postId}</p>

      {post && (
        <div className="p-3 border rounded-lg mb-4 bg-gray-50">
          <p className="font-semibold">{post.content}</p>
          <p className="text-sm text-gray-500">โดย {post.author?.name}</p>
        </div>
      )}

      <div className="space-y-3">
        <input
          type="text"
          placeholder="สถานที่นัดหมาย"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
        <textarea
          placeholder="รายละเอียดข้อเสนอ"
          value={offerText}
          onChange={(e) => setOfferText(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full"
        />

        <button
          onClick={handleCreateTrade}
          disabled={loading}
          className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          {loading ? "กำลังสร้าง..." : "ยืนยันสร้างเทรด"}
        </button>
      </div>
    </div>
  )
}
