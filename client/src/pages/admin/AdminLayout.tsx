import { Outlet } from "react-router-dom";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";

import { useState } from "react"
import { FaBars } from "react-icons/fa"

export default function AdminLayout() {
  const [open, setOpen] = useState(true) // ✅ state ควบคุมเปิด–ปิด sidebar

  return (
    <div className="flex">
      {/* 🔹 Sidebar */}
      {/* @ts-ignore */}
      <Sidebar open={open} onClose={() => setOpen(false)} />

      {/* 🔹 ส่วนเนื้อหาหลัก */}
      <div className={`flex-1 min-h-screen bg-gray-50 transition-all duration-300 ${open ? "ml-64" : "ml-0"}`}>
        {/* 🔸 Topbar */}
        <header
          className="
            fixed top-0 left-0 right-0 
            h-14 bg-white shadow-md flex items-center justify-between 
            px-6 z-40
          "
        >
          <div className="flex items-center gap-3">
            {/* ปุ่ม toggle sidebar */}
            <button
              onClick={() => setOpen(!open)}
              className="text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              <FaBars size={20} />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">🔧 Admin Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-sm">Welcome, Admin</span>
            <img
              src="https://placehold.co/40x40"
              alt="avatar"
              className="w-9 h-9 rounded-full object-cover border"
            />
          </div>
        </header>

        {/* เนื้อหา (เว้น padding-top เพราะ Topbar fixed) */}
        <main className="pt-16 p-6">
          <Outlet />
        </main>
      </div>

      {/* ปุ่มเรียก sidebar กลับมา (ตอน sidebar ถูกซ่อน) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-1/2 left-0 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-r-lg shadow-lg hover:bg-gray-800 transition z-50"
        >
          ➤
        </button>
      )}
    </div>
  )
}
