import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { AdminLog } from "@/types"
import { useNavigate } from "react-router-dom"

export default function Logs() {
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1) // ✅ เก็บ state หน้า
  const rowsPerPage = 10
  const navigate = useNavigate()

  useEffect(() => {
    const fetchLogs = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        setError("Unauthorized: No token found")
        navigate("/admin/login")
        return
      }

      try {
        const res = await api.get<AdminLog[]>("/admin/logs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setLogs(res.data)
      } catch (err: any) {
        console.error("Error fetching logs:", err)
        if (err.response?.status === 403) {
          setError("Forbidden: You are not allowed to view this page")
          navigate("/admin/login")
        } else {
          setError("Failed to fetch logs")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [navigate])

  if (loading) return <p className="text-center text-gray-500">Loading...</p>
  if (error) return <p className="text-center text-red-500">{error}</p>

  // ✅ Slice ข้อมูลตามหน้า
  const startIndex = (page - 1) * rowsPerPage
  const currentLogs = logs.slice(startIndex, startIndex + rowsPerPage)
  const totalPages = Math.ceil(logs.length / rowsPerPage)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Logs</h1>
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 border">ID</th>
              <th className="p-3 border">Action</th>
              <th className="p-3 border">Reason</th>
              <th className="p-3 border">Admin</th>
              <th className="p-3 border">Created At</th>
            </tr>
          </thead>
          <tbody>
            {currentLogs.length > 0 ? (
              currentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="p-3 border">{log.id}</td>
                  <td className="p-3 border">{log.action}</td>
                  <td className="p-3 border">{log.reason || "-"}</td>
                  <td className="p-3 border">
                    {log.admin?.name || log.admin?.email}
                  </td>
                  <td className="p-3 border">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="text-center text-gray-500 p-4 border"
                >
                  No logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Pagination Controls */}
      {logs.length > rowsPerPage && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
