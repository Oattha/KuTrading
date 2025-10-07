import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { useAuth } from "@/store/auth"

interface Trade {
  id: number
  post?: { id: number; content: string }
  buyer?: { id: number; name: string }
  seller?: { id: number; name: string }
}

export default function TradeReview() {
  const { tradeId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [trade, setTrade] = useState<Trade | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)

  // โหลดข้อมูล trade
  useEffect(() => {
    if (!tradeId) return
    api.get<Trade>(`/trades/${tradeId}`)
      .then(res => setTrade(res.data))
      .catch(err => console.error("Error loading trade", err))
  }, [tradeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tradeId || !trade) return

    // หา revieweeId → อีกฝั่งของ trade
    const revieweeId =
      trade.buyer?.id === user?.id ? trade.seller?.id : trade.buyer?.id

    try {
      setLoading(true)
      await api.post("/reviews", {
        tradeId: trade.id,
        revieweeId,
        rating,
        comment,
      })
      alert("✅ ส่งรีวิวเรียบร้อย")
      navigate("/trades")
    } catch (err: any) {
      alert(err.response?.data?.message || "ส่งรีวิวไม่สำเร็จ")
    } finally {
      setLoading(false)
    }
  }

  if (!trade) return <p className="p-6">กำลังโหลดข้อมูลเทรด...</p>

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow">
      {/* 🔹 ส่วนแสดงรายละเอียดเทรด */}
      <div className="mb-6 border-b pb-4">
        <h2 className="text-lg font-semibold mb-2">รายละเอียดการแลกเปลี่ยน</h2>
        <p className="text-gray-700">
          <strong>คู่แลกเปลี่ยน:</strong>{" "}
          {trade.buyer?.id === user?.id ? trade.seller?.name : trade.buyer?.name}
        </p>
        {trade.post && (
          <p className="text-gray-700">
            <strong>โพสต์:</strong> {trade.post.content}
          </p>
        )}
      </div>

      {/* 🔹 ฟอร์มรีวิว */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">ให้คะแนน:</label>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                className={`text-2xl ${
                  star <= rating ? "text-yellow-400" : "text-gray-300"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-medium">ความคิดเห็นเพิ่มเติม:</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={4}
            className="w-full border rounded-lg p-2 text-sm"
            placeholder="พิมพ์ความคิดเห็น..."
          />
        </div>

        <button
          type="submit"
          disabled={loading || rating === 0}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "กำลังส่ง..." : "ส่งรีวิว"}
        </button>
      </form>
    </div>
  )
}
