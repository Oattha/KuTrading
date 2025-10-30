import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/store/auth"
import { Review } from "@/types/review"

export default function Reviews() {
  const { token } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const reviewsPerPage = 8 // แสดงต่อหน้า 8 รีวิว

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // ✅ ใช้ api instance ที่มี baseURL + interceptor แล้ว
        const res = await api.get<Review[]>("/reviews/admin/reviews")
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
      if (hidden) {
        await api.patch(`/reviews/admin/reviews/${id}/unhide`) // ✅ unhide
      } else {
        await api.patch(`/reviews/admin/reviews/${id}/hide`)   // ✅ hide
      }

      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, hidden: !hidden } : r))
      )
    } catch (err) {
      console.error("Error toggling review", err)
    }
  }

  // ✅ Pagination logic
  const totalPages = Math.ceil(reviews.length / reviewsPerPage)
  const indexOfLast = currentPage * reviewsPerPage
  const indexOfFirst = indexOfLast - reviewsPerPage
  const currentReviews = reviews.slice(indexOfFirst, indexOfLast)

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
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
            {currentReviews.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
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

      {/* ✅ Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${currentPage === 1
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
          >
            ⬅️ ก่อนหน้า
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => handlePageClick(i + 1)}
              className={`px-3 py-1 rounded ${currentPage === i + 1
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded ${currentPage === totalPages
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
          >
            ถัดไป ➡️
          </button>
        </div>
      )}
    </div>
  )
}
