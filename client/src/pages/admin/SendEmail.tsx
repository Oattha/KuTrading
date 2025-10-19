import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"

interface Report {
  id: number
  reason: string
  targetUser?: { email: string; name?: string }
  reporter?: { email: string }
}

export default function SendEmail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [message, setMessage] = useState("")
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)

  // 📦 ดึงข้อมูลรีพอร์ตนั้นมาโชว์
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get<Report[]>(`/reports`)
        const found = res.data.find((r: Report) => r.id === Number(id))
        setReport(found ?? null)
      } catch (err) {
        console.error("Error loading report:", err)
      }
    }
    fetchReport()
  }, [id])

  const handleSend = async () => {
    if (!message.trim()) return alert("⚠️ กรุณาพิมพ์ข้อความก่อนส่ง")
    try {
      setLoading(true)
      await api.post(`/reports/${id}/notify`, { message })
      alert("📧 ส่งอีเมลแจ้งเตือนสำเร็จแล้ว!")
      navigate("/admin/reports")
    } catch (err) {
      console.error(err)
      alert("❌ ส่งอีเมลไม่สำเร็จ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-indigo-600 mb-6">
        ✉️ ส่งอีเมลเตือนผู้ใช้ (Report ID: {id})
      </h1>

      {report && (
        <div className="mb-4 text-gray-700">
          <p>
            <b>ผู้ถูกรีพอร์ต:</b> {report.targetUser?.email || "—"}
          </p>
          <p>
            <b>เหตุผลการรีพอร์ต:</b> {report.reason}
          </p>
        </div>
      )}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full h-48 border rounded-lg p-4 text-gray-700"
        placeholder="พิมพ์ข้อความเตือนที่ต้องการส่ง..."
      />

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => navigate("/admin/reports")}
          className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
        >
          ย้อนกลับ
        </button>
        <button
          onClick={handleSend}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-white ${
            loading ? "bg-blue-400 cursor-wait" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "กำลังส่ง..." : "ส่งอีเมล"}
        </button>
      </div>
    </div>
  )
}
