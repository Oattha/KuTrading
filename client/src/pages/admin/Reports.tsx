import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { FaStar, FaEye } from "react-icons/fa"
import { useNavigate } from "react-router-dom"

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

interface Report {
  id: number
  reporter?: { email: string }
  targetUser?: { email: string }
  reason: string
  status: string
  createdAt?: string  
}


export default function Reports() {
  const [users, setUsers] = useState<User[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingReports, setLoadingReports] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  // เพิ่ม state สำหรับแบ่งหน้ารีพอร์ต
const [reportPage, setReportPage] = useState(1)
const reportsPerPage = 5
const totalReportPages = Math.ceil(reports.length / reportsPerPage)
const indexOfLastReport = reportPage * reportsPerPage
const indexOfFirstReport = indexOfLastReport - reportsPerPage
const currentReports = reports.slice(indexOfFirstReport, indexOfLastReport)

const navigate = useNavigate()



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

  // 📦 โหลดรายการรีพอร์ตทั้งหมด
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get<Report[]>("/reports")
        setReports(res.data)
      } catch (err) {
        console.error("Error fetching reports:", err)
      } finally {
        setLoadingReports(false)
      }
    }
    fetchReports()
  }, [])

  const handleReportPage = (page: number) => {
  if (page >= 1 && page <= totalReportPages) setReportPage(page)
}
  // 🔍 โหลดรีวิวของ user
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

  // 🧩 จัดหมวดคะแนน
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
    <div className="p-6 max-w-7xl mx-auto space-y-12">
      <h1 className="text-3xl font-bold mb-6">📑 รายงานพฤติกรรมและรีพอร์ตผู้ใช้</h1>

      {/* 🔹 ส่วนรีพอร์ตที่ผู้ใช้ส่งเข้ามา */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-rose-600">
          🚨 รายการรีพอร์ตที่ผู้ใช้ส่งเข้ามา
        </h2>
        {loadingReports ? (
          <p className="text-gray-500">⏳ กำลังโหลด...</p>
        ) : reports.length === 0 ? (
          <p className="text-gray-400">ยังไม่มีรีพอร์ต</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-xl shadow-md">
              <thead className="bg-rose-100 text-gray-700">
                <tr>
                  <th className="py-2 px-4 text-left">Reporter</th>
                  <th className="py-2 px-4 text-left">Target User</th>
                  <th className="py-2 px-4 text-left">Reason</th>
                  <th className="py-2 px-4 text-left">Date</th> 
                  <th className="py-2 px-4 text-center">Status</th>
                </tr>
              </thead>
<tbody>
  {currentReports.map((r) => (
    <tr key={r.id} className="border-b hover:bg-gray-50">
      <td className="py-2 px-4">{r.reporter?.email || "—"}</td>
      <td className="py-2 px-4">{r.targetUser?.email || "—"}</td>
      <td className="py-2 px-4">{r.reason}</td>

      {/* ✅ เพิ่มตรงนี้ */}
      <td className="py-2 px-4 text-gray-500">
        {r.createdAt ? new Date(r.createdAt).toLocaleString("th-TH") : "—"}
      </td>

<td className="text-center">
  <div className="flex flex-col items-center gap-2">
    {/* ปุ่มส่งอีเมล — แสดงตลอด */}
    <button
      onClick={() => navigate(`/admin/reports/${r.id}/notify`)}
      className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200 transition-all text-sm"
    >
      ✉️ ส่งอีเมลเตือน
    </button>

    {/* สถานะเคส */}
    {r.status === "open" ? (
      <button
        onClick={async () => {
          if (!confirm("ปิดเคสนี้ใช่ไหม?")) return
          await api.put(`/reports/${r.id}/status`, { status: "resolved" })
          alert("✅ ปิดเคสแล้ว")
          window.location.reload()
        }}
        className="px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200 transition-all text-sm"
      >
        ปิดเคส
      </button>
    ) : (
      <span className="px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-800 border border-green-300">
        ✅ ปิดแล้ว
      </span>
    )}
  </div>
</td>


    </tr>
  ))}
</tbody>


            </table>
          </div>
        )}

        {/* 🔹 Pagination ของรีพอร์ต */}
{totalReportPages > 1 && (
  <div className="flex justify-center items-center gap-2 mt-4">
    <button
      onClick={() => handleReportPage(reportPage - 1)}
      disabled={reportPage === 1}
      className={`px-3 py-1 rounded ${
        reportPage === 1
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
      }`}
    >
      ⬅️ ก่อนหน้า
    </button>

    {[...Array(totalReportPages)].map((_, i) => (
      <button
        key={i}
        onClick={() => handleReportPage(i + 1)}
        className={`px-3 py-1 rounded ${
          reportPage === i + 1
            ? "bg-rose-500 text-white"
            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
        }`}
      >
        {i + 1}
      </button>
    ))}

    <button
      onClick={() => handleReportPage(reportPage + 1)}
      disabled={reportPage === totalReportPages}
      className={`px-3 py-1 rounded ${
        reportPage === totalReportPages
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
      }`}
    >
      ถัดไป ➡️
    </button>
  </div>
)}

      </section>

      {/* 🔹 รายงานพฤติกรรมผู้ใช้ (คะแนนรีวิว) */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-indigo-600">
          ⭐ พฤติกรรมผู้ใช้จากคะแนนรีวิว
        </h2>

        {loading ? (
          <p className="text-gray-500">⏳ กำลังโหลด...</p>
        ) : (
          <div className="space-y-10">
            <Section
              title="🟢 ความประพฤติดี (คะแนน > 3.5)"
              users={good}
              onView={handleViewReviews}
            />
            <Section
              title="🟡 เริ่มไม่ดี (2.5 – 3.5)"
              users={mid}
              onView={handleViewReviews}
            />
            <Section
              title="🔴 ความประพฤติไม่ดี (ต่ำกว่า 2.5)"
              users={low}
              onView={handleViewReviews}
            />
          </div>
        )}
      </section>

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

// 🔹 Component แสดงตารางคะแนน
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
