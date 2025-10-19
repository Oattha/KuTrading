import { useState, useRef } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/store/auth"  // ✅ ดึงข้อมูลแอดมิน
import { FaBars } from "react-icons/fa"
import { Outlet } from "react-router-dom"  // ✅ เพิ่มบรรทัดนี้
import Sidebar from "@/components/admin/Sidebar"
export default function AdminLayout() {
  const [open, setOpen] = useState(true)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { user, setUser } = useAuth()
  const [uploading, setUploading] = useState(false)

  // ✅ ฟังก์ชันอัปโหลดรูปใหม่
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)

    try {
      setUploading(true)
      const res = await api.post<{ ok: boolean; url: string }>(
        "/users/profile-picture",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
      if (res.data.ok) {
        setUser({ ...user!, avatarUrl: res.data.url })
        alert("✅ อัปโหลดรูปสำเร็จ")
      }
    } catch (err) {
      console.error("Upload failed:", err)
      alert("❌ อัปโหลดรูปไม่สำเร็จ")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex">
      {/* Sidebar */}
      {/* @ts-ignore */}
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div
        className={`flex-1 min-h-screen bg-gray-50 transition-all duration-300 ${
          open ? "ml-64" : "ml-0"
        }`}
      >
        {/* Header */}
        <header
          className="
            fixed top-0 left-0 right-0 
            h-14 bg-white shadow-md flex items-center justify-between 
            px-6 z-40
          "
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(!open)}
              className="text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              <FaBars size={20} />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">
              🔧 Admin Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-sm">
              {uploading ? "Uploading..." : "Welcome, Admin"}
            </span>

            {/* ✅ รูปโปรไฟล์คลิกได้ */}
            <div className="relative">
              <img
                src={
                  user?.avatarUrl ||
                  "https://placehold.co/40x40?text=A"
                }
                alt="Admin Avatar"
                className="w-9 h-9 rounded-full object-cover border cursor-pointer hover:opacity-80"
                onClick={() => fileInputRef.current?.click()}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>
        </header>

        <main className="pt-16 p-6">
          <Outlet />
        </main>

        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="fixed top-1/2 left-0 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-r-lg shadow-lg hover:bg-gray-800 transition z-50"
          >
            ➤
          </button>
        )}
      </div>
    </div>
  )
}
