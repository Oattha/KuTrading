// src/layouts/UserLayout.tsx
import { Outlet } from "react-router-dom"
import Navbar from "@/components/user/Navbar"

export default function UserLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
