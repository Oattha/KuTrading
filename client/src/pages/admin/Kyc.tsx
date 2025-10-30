import { useEffect, useState } from "react"
import { api } from "@/lib/api" // ✅ ใช้ instance api ที่ตั้งค่า baseURL และ interceptor แล้ว
import Button from "@/components/ui/button"
import { useAuth } from "@/store/auth"
import { KycDocument } from "@/types"

export default function Kyc() {
  const [docs, setDocs] = useState<KycDocument[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const { user, token } = useAuth()

  const docsPerPage = 5 // ✅ แสดง 5 รายการต่อหน้า

  // 📦 โหลดรายการเอกสารทั้งหมด
  useEffect(() => {
    if (!token) return

    const fetchDocs = async () => {
      try {
        setLoading(true)
        // ✅ ไม่ต้องใส่ /api/ ซ้ำ เพราะ baseURL = https://kutrading-server.onrender.com/api
        const res = await api.get<KycDocument[]>("/admin/kyc/pending")
        setDocs(res.data)
      } catch (err) {
        console.error("Error fetching KYC:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchDocs()
  }, [token])

  // 📋 Pagination logic
  const totalPages = Math.ceil(docs.length / docsPerPage)
  const indexOfLast = currentPage * docsPerPage
  const indexOfFirst = indexOfLast - docsPerPage
  const currentDocs = docs.slice(indexOfFirst, indexOfLast)

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  // ✅ Approve / Reject
  const handleAction = async (id: number, action: "approve" | "reject") => {
    if (!user || !token) return
    if (user.role !== "admin") {
      alert("คุณไม่มีสิทธิ์ทำรายการนี้")
      return
    }

    try {
      let payload: any = {}
      if (action === "reject") {
        const reason = prompt("กรุณากรอกเหตุผลในการ Reject:")
        if (!reason) return
        payload = { reason }
      }

      // ✅ ใช้ api instance ที่มี token interceptor แล้ว
      const res = await api.patch<{ message: string }>(
        `/admin/kyc/${id}/${action}`,
        payload
      )

      alert(res.data.message)
      // ✅ เอาเอกสารที่จัดการแล้วออกจากรายการ
      setDocs((prev) => prev.filter((d) => d.id !== id))
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || "ทำรายการไม่สำเร็จ")
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">KYC Verification</h2>

      {loading ? (
        <p className="text-gray-500">⏳ กำลังโหลดข้อมูล...</p>
      ) : docs.length === 0 ? (
        <p className="text-gray-500">ไม่มีรายการรอตรวจสอบ</p>
      ) : (
        <>
          <table className="w-full border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">File</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentDocs.map((d) => (
                <tr key={d.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{d.id}</td>
                  <td className="px-4 py-2">{d.user?.email}</td>
                  <td className="px-4 py-2">
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 underline"
                    >
                      ดูไฟล์
                    </a>
                  </td>
                  <td className="px-4 py-2 capitalize">{d.status}</td>
                  <td className="px-4 py-2 text-center">
                    <Button
                      onClick={() => handleAction(d.id, "approve")}
                      className="mr-2 bg-green-500 hover:bg-green-600"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleAction(d.id, "reject")}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Reject
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 🔹 Pagination Section */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                onClick={() => handlePageClick(currentPage - 1)}
                disabled={currentPage === 1}
                variant="secondary"
              >
                ⬅️ ก่อนหน้า
              </Button>

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

              <Button
                onClick={() => handlePageClick(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="secondary"
              >
                ถัดไป ➡️
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
