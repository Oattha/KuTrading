import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { api } from "@/lib/api"

// ✅ type ของ response
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
    api
      .get(`/posts/${postId}`)
      .then((res) => setPost(res.data))
      .catch((err) => console.error("Error fetching post", err))
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
      if (scheduledAt) formData.append("scheduledAt", new Date(scheduledAt).toISOString())
      if (offerText) formData.append("offerText", offerText)
      if (file) formData.append("offerImage", file)

      const res = await api.post<CreateTradeResponse>("/trades", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      const { trade, conversationId } = res.data
      alert("สร้างเทรด + ห้องแชทสำเร็จ")
      navigate(`/trades/${trade.id}/chat/${conversationId}`)
    } catch (err) {
      console.error("Error creating trade", err)
      alert("ไม่สามารถสร้างเทรดได้")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center 
                 bg-gradient-to-br from-white/40 via-indigo-50/40 to-purple-100/50
                 backdrop-blur-2xl"
    >
      {/* กล่องหลัก */}
      <div
        className="bg-white/40 backdrop-blur-xl border border-white/30 
                   shadow-2xl rounded-3xl w-full max-w-lg p-8
                   transition-all duration-300 hover:shadow-indigo-200/70"
      >
        <h1 className="text-2xl font-bold text-center text-indigo-700 mb-2">
          สร้างการแลกเปลี่ยน
        </h1>
        <p className="text-center text-sm text-gray-600 mb-6">
          โพสต์ที่เลือก:{" "}
          <span className="font-semibold text-indigo-600">#{postId}</span>
        </p>

        {/* กล่องโพสต์ */}
        {post && (
          <div className="p-4 rounded-2xl bg-white/70 border border-indigo-100 shadow-sm mb-6">
            <p className="font-semibold text-gray-800">{post.content}</p>
            <p className="text-sm text-gray-500 mt-1">โดย {post.author?.name}</p>
          </div>
        )}

        {/* ฟอร์ม */}
        <div className="space-y-5">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📍 สถานที่นัดหมาย
            </label>
            <input
              type="text"
              placeholder="เช่น ตลาดนัด ม.เกษตร"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-indigo-200 rounded-xl px-4 py-2.5 
                         bg-white/70 shadow-inner focus:outline-none 
                         focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ⏰ วัน / เวลา นัดหมาย
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full border border-indigo-200 rounded-xl px-4 py-2.5 
                         bg-white/70 shadow-inner focus:outline-none 
                         focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>

          {/* Offer Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              💬 รายละเอียดข้อเสนอ
            </label>
            <textarea
              placeholder="ระบุรายละเอียดเพิ่มเติม เช่น แลกสินค้าหรือเงินสด"
              value={offerText}
              onChange={(e) => setOfferText(e.target.value)}
              rows={3}
              className="w-full border border-indigo-200 rounded-xl px-4 py-2.5 
                         bg-white/70 shadow-inner focus:outline-none 
                         focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>

          {/* File */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📸 รูปประกอบข้อเสนอ (ถ้ามี)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 
                         file:rounded-full file:border-0 file:text-sm file:font-semibold 
                         file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
            />
          </div>

          {/* Button */}
          <button
            onClick={handleCreateTrade}
            disabled={loading}
            className="w-full py-2.5 rounded-full text-white font-semibold 
                       bg-gradient-to-r from-indigo-500 to-purple-500
                       hover:from-indigo-600 hover:to-purple-600 
                       shadow-md hover:shadow-lg transition-all duration-200"
          >
            {loading ? "⏳ กำลังสร้าง..." : "✨ ยืนยันสร้างเทรด"}
          </button>
        </div>
      </div>
    </div>
  )
}
