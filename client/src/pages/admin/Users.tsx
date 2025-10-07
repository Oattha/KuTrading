import { useEffect, useState } from "react"
import axios from "axios"
import Button from "@/components/ui/button"
import { useAuth } from "@/store/auth"

type AppUser = {
  id: number
  email: string
  status: "pending" | "active" | "banned"   // ✅ ใช้ status แทน enabled
}

export default function Users() {
  const [users, setUsers] = useState<AppUser[]>([])
  const { token } = useAuth()

  useEffect(() => {
    if (!token) return

    axios.get<AppUser[]>("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setUsers(res.data))
  }, [token])

  const toggleBan = async (id: number) => {
    if (!token) return

    const res = await axios.patch<AppUser>(
      `/api/admin/users/${id}/toggle-ban`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )

    alert(`User ${id} is now ${res.data.status}`) // ✅ แจ้งสถานะใหม่

    setUsers(users.map((u) =>
      u.id === id ? res.data : u
    ))
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Users</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th>ID</th>
            <th>Email</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b">
              <td>{u.id}</td>
              <td>{u.email}</td>
              <td>
                <span
                  className={
                    u.status === "banned"
                      ? "text-red-600 font-semibold"
                      : u.status === "active"
                      ? "text-green-600 font-semibold"
                      : "text-gray-600"
                  }
                >
                  {u.status}
                </span>
              </td>
              <td>
                <Button
                  variant={u.status === "banned" ? "primary" : "destructive"}
                  onClick={() => toggleBan(u.id)}
                >
                  {u.status === "banned" ? "Unban" : "Ban"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
