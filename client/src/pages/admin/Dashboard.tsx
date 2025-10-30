import { useEffect, useState } from "react"
import { api } from "@/lib/api" // ✅ ใช้ instance ที่ตั้ง baseURL แล้ว
import { useAuth } from "@/store/auth"
import { motion } from "framer-motion"
import {
  UserGroupIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"

// --- interface ---
interface User {
  id: number
  name: string
  email: string
}

interface Kyc {
  id: number
  status: string
}

interface Report {
  id: number
  description: string
}

export default function Dashboard() {
  const { token } = useAuth()
  const [stats, setStats] = useState({
    users: 0,
    pendingKyc: 0,
    reports: 0,
  })

  useEffect(() => {
    if (!token) return

    const fetchStats = async () => {
      try {
        // ✅ ไม่ต้องใส่ /api/ อีก เพราะ api.ts มี baseURL = "https://kutrading-server.onrender.com/api"
        const [usersRes, kycRes, reportsRes] = await Promise.all([
          api.get<User[]>("/users"),
          api.get<Kyc[]>("/admin/kyc"),
          api.get<Report[]>("/admin/reports"),
        ])

        setStats({
          users: usersRes.data.length,
          pendingKyc: kycRes.data.filter((k) => k.status === "pending").length,
          reports: reportsRes.data.length,
        })
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err)
      }
    }

    fetchStats()
  }, [token])

  const cards = [
    {
      title: "Users",
      value: stats.users,
      color: "bg-blue-500",
      icon: <UserGroupIcon className="h-10 w-10 text-white" />,
    },
    {
      title: "Pending KYC",
      value: stats.pendingKyc,
      color: "bg-yellow-500",
      icon: <DocumentCheckIcon className="h-10 w-10 text-white" />,
    },
    {
      title: "Reports",
      value: stats.reports,
      color: "bg-red-500",
      icon: <ExclamationTriangleIcon className="h-10 w-10 text-white" />,
    },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">📊 Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2, duration: 0.5 }}
            className={`${card.color} p-6 rounded-xl shadow-md flex items-center justify-between`}
          >
            <div>
              <h2 className="text-lg font-semibold text-white">{card.title}</h2>
              <p className="text-3xl font-bold text-white">{card.value}</p>
            </div>
            {card.icon}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
