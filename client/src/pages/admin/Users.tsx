import { useEffect, useState } from "react"
import axios from "axios"
import Button from "@/components/ui/button"
import { useAuth } from "@/store/auth"

type AppUser = {
  id: number
  email: string
  status: "pending" | "active" | "banned"
}

export default function Users() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const usersPerPage = 10
  const { token } = useAuth()

  useEffect(() => {
    if (!token) return

    const fetchUsers = async () => {
      try {
        setLoading(true)
        const res = await axios.get<AppUser[]>("/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setUsers(res.data)
      } catch (err) {
        console.error("Error fetching users:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [token])

  const toggleBan = async (id: number) => {
    if (!token) return

    const res = await axios.patch<AppUser>(
      `/api/admin/users/${id}/toggle-ban`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )

    alert(`User ${id} is now ${res.data.status}`)

    setUsers((prev) => prev.map((u) => (u.id === id ? res.data : u)))
  }

  // 📊 Pagination logic
  const indexOfLast = currentPage * usersPerPage
  const indexOfFirst = indexOfLast - usersPerPage
  const currentUsers = users.slice(indexOfFirst, indexOfLast)
  const totalPages = Math.ceil(users.length / usersPerPage)

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1)
  }
  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1)
  }

const deleteUser = async (id: number) => {
  if (!token) return
  if (!confirm("คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้? การลบไม่สามารถย้อนกลับได้")) return

  try {
    await axios.delete(`/api/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    alert("ลบผู้ใช้สำเร็จ")
    setUsers((prev) => prev.filter((u) => u.id !== id))
  } catch (err) {
    console.error("Error deleting user:", err)
    alert("ไม่สามารถลบผู้ใช้ได้")
  }
}

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Users</h2>

      {loading ? (
        <p className="text-gray-500">⏳ Loading...</p>
      ) : (
        <>
          <table className="w-full border rounded-md overflow-hidden">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-2 px-4">ID</th>
                <th className="py-2 px-4">Email</th>
                <th className="py-2 px-4 text-center">Status</th>
                <th className="py-2 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="py-2 px-4">{u.id}</td>
                  <td className="py-2 px-4">{u.email}</td>
                  <td className="py-2 px-4 text-center">
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
                  <td className="py-2 px-4 text-center">
                    <Button
                      variant={u.status === "banned" ? "primary" : "destructive"}
                      onClick={() => toggleBan(u.id)}
                    >
                      {u.status === "banned" ? "Unban" : "Ban"}
                    </Button>
                      <Button variant="secondary" onClick={() => deleteUser(u.id)}>
    🗑️ Delete
  </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 🔹 Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <Button
                onClick={handlePrev}
                disabled={currentPage === 1}
                variant="secondary"
              >
                ⬅️ หน้าก่อนหน้า
              </Button>

              <p className="text-sm text-gray-600">
                หน้า {currentPage} จาก {totalPages}
              </p>

              <Button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                variant="secondary"
              >
                หน้าถัดไป ➡️
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
