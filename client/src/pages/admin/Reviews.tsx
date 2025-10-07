import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import axios from "axios"
import { useAuth } from "@/store/auth"
import { Review } from "@/types/review"

export default function Reviews() {
  const { token } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get<Review[]>("/api/reviews/admin/reviews", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setReviews(res.data)
      } catch (err) {
        console.error("Error fetching reviews", err)
      } finally {
        setLoading(false)
      }
    }
    fetchReviews()
  }, [token])

  // ✅ toggle ซ่อน/เลิกซ่อน
  const toggleHideReview = async (id: number, hidden: boolean) => {
    try {
      await api.patch(
        `/admin/reviews/${id}/hide`,
        { hidden: !hidden },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, hidden: !hidden } : r))
      )
    } catch (err) {
      console.error("Error toggling review", err)
    }
  }

  if (loading) return <p className="p-6">Loading...</p>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">⭐ Reviews Management</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Reviewer</th>
              <th className="px-4 py-2 text-left">Reviewee</th>
              <th className="px-4 py-2 text-left">Rating</th>
              <th className="px-4 py-2 text-left">Comment</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="px-4 py-2 flex items-center gap-2">
                  {r.reviewer.avatarUrl && (
                    <img
                      src={r.reviewer.avatarUrl}
                      alt="avatar"
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  {r.reviewer.name || "Anonymous"}
                </td>
                <td className="px-4 py-2">{r.reviewee?.name || "N/A"}</td>
                <td className="px-4 py-2">⭐ {r.rating}/5</td>
                <td className="px-4 py-2">{r.comment || "-"}</td>
                <td className="px-4 py-2">
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-center">
                  {r.hidden ? (
                    <button
                      onClick={() => toggleHideReview(r.id, r.hidden)}
                      className="px-3 py-1 text-sm rounded bg-green-500 hover:bg-green-600 text-white"
                    >
                      Unhide
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleHideReview(r.id, r.hidden)}
                      className="px-3 py-1 text-sm rounded bg-red-500 hover:bg-red-600 text-white"
                    >
                      Hide
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
