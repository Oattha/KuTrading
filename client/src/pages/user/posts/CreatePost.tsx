import { useState } from "react"
import { api } from "@/lib/api"
import { useNavigate } from "react-router-dom"

export default function CreatePost() {
  const [content, setContent] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return alert("กรุณากรอกเนื้อหาโพสต์")

    const formData = new FormData()
    formData.append("content", content)
    formData.append("visibility", "public")
    files.forEach((f) => formData.append("files", f))

    try {
      setLoading(true)
      const res = await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      console.log("สร้างโพสต์สำเร็จ:", res.data)
      navigate("/user/posts/myposts") // ไปหน้าของฉัน
    } catch (err: any) {
      console.error("Error creating post:", err.response?.data || err.message)
      alert("สร้างโพสต์ไม่สำเร็จ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto bg-white shadow p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">สร้างโพสต์ใหม่</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="คุณกำลังคิดอะไรอยู่..."
          className="w-full border rounded p-2"
          rows={4}
        />
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "กำลังโพสต์..." : "โพสต์"}
        </button>
      </form>
    </div>
  )
}
