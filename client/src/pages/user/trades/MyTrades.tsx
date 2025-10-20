// C:\marketplace3\client\src\pages\user\trades\MyTrades.tsx
import { useMemo, useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useAuth } from "@/store/auth"

// ✅ import icons
import { FaStore, FaHandshake, FaUser, FaMapMarkerAlt, FaCalendarAlt, FaComments, FaStar, FaTrash } from "react-icons/fa"

type TradeStatus = "available" |"requested" | "pending" | "accepted" | "completed" | "canceled"

interface Trade {
  id: number
  buyerId: number
  sellerId: number
  postId: number
  location: string
  scheduledAt?: string
  updatedAt: string
  status: TradeStatus
  post?: { id: number; content: string }
  buyer?: { id: number; name: string; picture?: string }
  seller?: { id: number; name: string; picture?: string }
  offerText?: string
  offerImageUrl?: string
  conversationId?: number | null;
}

const statusLabel: Record<TradeStatus, string> = {
  available: "พร้อมแลกเปลี่ยน",
  requested: "รอดำเนินการ",
  pending: "กำลังนัดหมาย",
  accepted: "ยืนยันแล้ว",
  completed: "เสร็จสิ้น",
  canceled: "ยกเลิก",
}

const allowedStatuses: TradeStatus[] = ["available","requested", "pending", "accepted", "completed", "canceled"]

export default function MyTrades() {
  const { user } = useAuth()
  const [tab, setTab] = useState<"all" | TradeStatus>("all")
  const [q, setQ] = useState("")
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"seller" | "buyer">("seller") // ✅ toggle role

  useEffect(() => {
    const fetchTrades = async () => {
      setLoading(true)
      try {
        const res = await api.get<Trade[]>("/trades/my")
        setTrades(res.data)
      } catch (err) {
        console.error("Error fetching trades", err)
      } finally {
        setLoading(false)
      }
    }
    fetchTrades()
  }, [])

  const handleStatusChange = async (tradeId: number, newStatus: TradeStatus) => {
    try {
      const res = await api.patch<Trade>(`/trades/${tradeId}/status`, { status: newStatus })
      setTrades(prev =>
        prev.map(t => (t.id === tradeId ? { ...t, status: res.data.status } : t))
      )
    } catch (err) {
      console.error("Update status failed:", err)
      alert("อัปเดตสถานะไม่สำเร็จ")
    }
  }

  // ✅ NEW: ลบเทรด
  const handleDeleteTrade = async (tradeId: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบเทรดนี้?")) return
    try {
      await api.delete(`/trades/${tradeId}`)
      setTrades(prev => prev.filter(t => t.id !== tradeId))
    } catch (err) {
      console.error("Delete trade failed:", err)
      alert("ลบเทรดไม่สำเร็จ")
    }
  }

  // ✅ กรองตาม role ก่อน
  const filteredByRole = useMemo(() => {
    if (view === "seller") {
      return trades.filter(t => t.sellerId === user?.id)
    } else {
      return trades.filter(t => t.buyerId === user?.id)
    }
  }, [view, trades, user])

  // ✅ ต่อด้วยกรอง tab + ค้นหา
  const filtered = useMemo(() => {
    const base = tab === "all" ? filteredByRole : filteredByRole.filter(t => t.status === tab)
    return base.filter(t =>
      (t.post?.content || "").toLowerCase().includes(q.toLowerCase()) ||
      (t.buyer?.name || "").toLowerCase().includes(q.toLowerCase()) ||
      (t.seller?.name || "").toLowerCase().includes(q.toLowerCase()) ||
      t.location.toLowerCase().includes(q.toLowerCase())
    )
  }, [tab, q, filteredByRole])

  if (loading) {
    return <div className="p-10 text-center">กำลังโหลด...</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold"><FaHandshake className="inline mr-2" /> การแลกเปลี่ยนของฉัน</h1>
        <span className="hidden md:block text-sm text-gray-500">
          รวม {filteredByRole.length} รายการ
        </span>
      </div>

      {/* ✅ toggle role */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView("seller")}
          className={`px-3 py-1.5 rounded-lg text-sm border transition ${
            view === "seller"
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <FaStore className="inline mr-1" /> ฉันเป็นเจ้าของสินค้า
        </button>
        <button
          onClick={() => setView("buyer")}
          className={`px-3 py-1.5 rounded-lg text-sm border transition ${
            view === "buyer"
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <FaUser className="inline mr-1" /> ฉันเป็นผู้ขอแลก
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[ 
          { key: "all", label: "ทั้งหมด" },
          { key: "available", label: "พร้อมแลกเปลี่ยน" },
          { key: "requested", label: "รอดำเนินการ" },
          { key: "pending", label: "กำลังนัดหมาย" },
          { key: "accepted", label: "ยืนยันแล้ว" },
          { key: "completed", label: "เสร็จสิ้น" },
          { key: "canceled", label: "ยกเลิก" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              tab === t.key
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto w-full md:w-72">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="ค้นหา: โพสต์ / คนแลก / สถานที่"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      {/* Trade List */}
      <div className="space-y-3">
        {filtered.map(t => (
          <article
            key={t.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5"
          >
            <div className="flex flex-wrap items-center gap-3 mb-2 w-full">
              {/* dropdown: seller เปลี่ยนได้, buyer disabled */}
              <select
                value={t.status}
                disabled={view !== "seller"}
                onChange={e => handleStatusChange(t.id, e.target.value as TradeStatus)}
                className="border rounded px-2 py-1 text-sm disabled:bg-gray-100 disabled:text-gray-400"
              >
                {allowedStatuses.map(s => (
                  <option key={s} value={s}>
                    {statusLabel[s]}
                  </option>
                ))}
              </select>

              <span className="text-xs text-gray-500">
                อัปเดตล่าสุด {new Date(t.updatedAt).toLocaleString("th-TH")}
              </span>

              {/* ✅ ปุ่มลบเทรด: แสดงเฉพาะฝั่งผู้ขาย */}
              {view === "seller" && (
                <button
                  onClick={() => handleDeleteTrade(t.id)}
                  className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium transition"
                  title="ลบเทรดนี้"
                >
                  <FaTrash /> ลบเทรด
                </button>
              )}
            </div>

            {t.post && (
              <Link
                to={`/posts/${t.post.id}`}
                className="block mt-1 font-semibold text-gray-900 hover:text-indigo-600"
              >
                {t.post.content}
              </Link>
            )}

            {t.offerImageUrl && (
              <img
                src={t.offerImageUrl}
                alt={t.offerText || "ข้อเสนอแลกเปลี่ยน"}
                className="mt-2 max-h-40 object-contain rounded-lg border"
              />
            )}

            {t.offerText && <p className="mt-2 text-sm text-gray-700">{t.offerText}</p>}

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span><FaUser className="inline mr-1" /> {t.buyer?.name} ↔ {t.seller?.name}</span>
              <span><FaMapMarkerAlt className="inline mr-1" /> {t.location}</span>
              {t.scheduledAt && (
                <span><FaCalendarAlt className="inline mr-1" /> นัด: {new Date(t.scheduledAt).toLocaleString("th-TH")}</span>
              )}

              {/* ปุ่มไปแชท */}
              {t.conversationId ? (
                <Link
                  to={`/trades/${t.id}/chat/${t.conversationId}`}
                  className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-sm font-medium transition"
                >
                  <FaComments /> ไปยังแชท
                </Link>
              ) : (
                <span className="ml-auto text-sm text-gray-400">❌ ยังไม่มีห้องแชท</span>
              )}

              {/* ปุ่มไปรีวิว */}
              {t.status === "completed" && (
                <Link
                  to={`/trades/${t.id}/review`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 text-sm font-medium transition"
                >
                  <FaStar /> เขียนรีวิว
                </Link>
              )}
            </div>
          </article>
        ))}

        {filtered.length === 0 && (
          <div className="p-10 text-center text-gray-500 border border-dashed rounded-2xl">
            ไม่พบรายการที่ตรงกับเงื่อนไข
          </div>
        )}
      </div>
    </div>
  )
}
