import { useLocation } from "react-router-dom"
import { useState } from "react"

export default function Reviews() {
  const query = new URLSearchParams(useLocation().search)
  const tradeId = query.get("tradeId")

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">⭐ ให้รีวิว</h1>
      <p className="text-gray-600 mt-2">คุณกำลังรีวิวรายการหมายเลข <b>{tradeId}</b></p>

      {/* Rating */}
      <div className="mt-4 flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className={`text-3xl ${rating >= star ? "text-yellow-400" : "text-gray-300"}`}
          >
            ★
          </button>
        ))}
      </div>

      {/* Comment */}
      <textarea
        placeholder="เขียนความคิดเห็น..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full border rounded-lg p-3 mt-4 min-h-[120px]"
      />

      <button
        onClick={() => alert(`ส่งรีวิวสำเร็จ!\nคะแนน: ${rating}\nข้อความ: ${comment}`)}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        ส่งรีวิว
      </button>
    </div>
  )
}
