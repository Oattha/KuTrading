import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { FaStar, FaUser, FaEye } from "react-icons/fa"

interface User {
  id: number
  name: string
  email: string
  role: string
  ratingAverage?: number
  ratingCount?: number
  avatarUrl?: string
}

interface Review {
  id: number
  rating: number
  comment: string | null
  createdAt: string
  reviewer: { id: number; name: string; avatarUrl?: string }
}

export default function Reports() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)

  // 📦 โหลดข้อมูลผู้ใช้ทั้งหมด
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get<User[]>("/users")
        setUsers(res.data)
      } catch (err) {
        console.error("Error fetching users:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  // 🔍 โหลดรีวิวเมื่อเลือก user
  const handleViewReviews = async (user: User) => {
    setSelectedUser(user)
    setLoadingReviews(true)
    try {
      const res = await api.get<Review[]>(`/reviews/user/${user.id}`)
      setReviews(res.data)
    } catch (err) {
      console.error("Error fetching reviews:", err)
    } finally {
      setLoadingReviews(false)
    }
  }

  // 🧩 ฟังก์ชันช่วยแบ่งหมวดคะแนน
  const categorizeUsers = () => {
    const good = users.filter((u) => (u.ratingAverage ?? 0) > 3.5)
    const mid = users.filter(
      (u) => (u.ratingAverage ?? 0) >= 2.5 && (u.ratingAverage ?? 0) <= 3.5
    )
    const low = users.filter((u) => (u.ratingAverage ?? 0) < 2.5)
    return { good, mid, low }
  }

  const { good, mid, low } = categorizeUsers()

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📑 รายงานพฤติกรรมผู้ใช้</h1>

      {loading ? (
        <p className="text-gray-500">⏳ กำลังโหลด...</p>
      ) : (
        <div className="space-y-10">
          {/* 🟢 ความประพฤติดี */}
          <Section
            title="🟢 ความประพฤติดี (คะแนน > 3.5)"
            users={good}
            onView={handleViewReviews}
          />

          {/* 🟡 เริ่มไม่ดี */}
          <Section
            title="🟡 เริ่มไม่ดี (2.5 – 3.5)"
            users={mid}
            onView={handleViewReviews}
          />

          {/* 🔴 ต่ำกว่าเกณฑ์ */}
          <Section
            title="🔴 ความประพฤติไม่ดี (ต่ำกว่า 2.5)"
            users={low}
            onView={handleViewReviews}
          />
        </div>
      )}

      {/* 🔹 Modal รีวิว */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setSelectedUser(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-[90%] max-w-2xl max-h-[80vh] overflow-y-auto shadow-lg"
          >
            <h3 className="text-xl font-bold text-indigo-600 mb-3">
              รีวิวของ {selectedUser.name}
            </h3>

            {loadingReviews ? (
              <p className="text-gray-500">⏳ กำลังโหลด...</p>
            ) : reviews.length === 0 ? (
              <p className="text-gray-400">ยังไม่มีรีวิว</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="border-b border-gray-100 py-3">
                  <div className="flex items-center gap-3 mb-1">
                    <img
                      src={r.reviewer.avatarUrl || "https://placehold.co/40"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-800">{r.reviewer.name}</p>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={i < r.rating ? "text-yellow-400" : "text-gray-300"}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">{r.comment || "— ไม่มีข้อความ —"}</p>
                  <span className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleString("th-TH")}
                  </span>
                </div>
              ))
            )}

            <div className="mt-4 text-right">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 🔹 Component สำหรับแต่ละ Section (เพิ่ม Pagination)
function Section({
  title,
  users,
  onView,
}: {
  title: string
  users: User[]
  onView: (u: User) => void
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 5
  const totalPages = Math.ceil(users.length / usersPerPage)
  const indexOfLast = currentPage * usersPerPage
  const indexOfFirst = indexOfLast - usersPerPage
  const currentUsers = users.slice(indexOfFirst, indexOfLast)

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>

      {users.length === 0 ? (
        <p className="text-gray-400 text-sm mb-6">ไม่มีผู้ใช้ในหมวดนี้</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-xl shadow-md overflow-hidden">
              <thead className="bg-indigo-100 text-gray-700">
                <tr>
                  <th className="py-2 px-3 text-left">ผู้ใช้</th>
                  <th className="py-2 px-3">อีเมล</th>
                  <th className="py-2 px-3">คะแนนเฉลี่ย</th>
                  <th className="py-2 px-3">จำนวนรีวิว</th>
                  <th className="py-2 px-3">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 flex items-center gap-3">
                      <img
                        src={u.avatarUrl || "https://placehold.co/40"}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span>{u.name}</span>
                    </td>
                    <td className="text-center">{u.email}</td>
                    <td className="text-center font-semibold text-yellow-600">
                      {(u.ratingAverage ?? 0).toFixed(1)}
                    </td>
                    <td className="text-center">{u.ratingCount ?? 0}</td>
                    <td className="text-center">
                      <button
                        onClick={() => onView(u)}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mx-auto"
                      >
                        <FaEye /> ดูรีวิว
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 🔹 Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                onClick={() => handlePageClick(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${
                  currentPage === 1
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
                  className={`px-3 py-1 rounded ${
                    currentPage === i + 1
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
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                ถัดไป ➡️
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
