import { useAuth } from "@/store/auth"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { FaHome, FaPlus, FaTimes, FaVideo, FaCamera, FaFilm } from "react-icons/fa"
import PostDetail, { Post } from "./posts/PostDetail"

export default function Home() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  // ฟอร์มโพสต์ใหม่
  const [newContent, setNewContent] = useState("")
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [posting, setPosting] = useState(false)

  const fetchPosts = async () => {
    try {
      const res = await api.get<Post[]>("/posts")
      const sorted = res.data.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setPosts(sorted)
    } catch (err) {
      console.error("Error fetching posts", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])
    }
  }

  const handleRemoveFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreatePost = async () => {
    if (!newContent.trim() && newFiles.length === 0) return
    try {
      setPosting(true)

      // 📦 แยกประเภทไฟล์ (รูป / วิดีโอ)
      const imageFiles = newFiles.filter((f) => f.type.startsWith("image"))
      const videoFiles = newFiles.filter((f) => f.type.startsWith("video"))

      const formData = new FormData()
      formData.append("content", newContent)
      imageFiles.forEach((file) => formData.append("files", file))

      const res = await api.post<{ id: string }>("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      const postId = res.data.id

      // 🎥 ถ้ามีวิดีโอ → อัปโหลดแยก
      if (videoFiles.length > 0) {
        const videoForm = new FormData()
        videoFiles.forEach((file) => videoForm.append("files", file))
        await api.post(`/posts/${postId}/videos`, videoForm, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      }

      setNewContent("")
      setNewFiles([])
      await fetchPosts()
    } catch (err) {
      console.error("Error creating post", err)
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 text-3xl font-bold text-gray-800">
        <FaHome className="text-indigo-500" />
        <h1>Home</h1>
      </div>
      <p className="mt-2 text-gray-600">สวัสดี {user?.name || "ผู้ใช้"} 👋</p>

      {/* ฟอร์มโพสต์ใหม่ */}
      <div className="mt-6 bg-white border rounded-2xl shadow-sm p-4">
        <textarea
          placeholder="คุณคิดจะแลกอะไรอยู่..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-indigo-300"
        />

        {/* ปุ่มแนว Facebook */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-3">
            <label
              htmlFor="fileInput"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer transition"
              title="เพิ่มรูปภาพหรือวิดีโอ"
            >
              <FaCamera /> <span className="text-sm">รูปภาพ/วิดีโอ</span>
            </label>
          </div>

          <button
            onClick={handleCreatePost}
            disabled={posting}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full text-sm shadow disabled:opacity-60 transition"
          >
            <FaPlus /> {posting ? "กำลังโพสต์..." : "โพสต์"}
          </button>
        </div>

        {/* ช่องเลือกไฟล์จริง */}
        <input
          id="fileInput"
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* พรีวิวไฟล์ */}
        {newFiles.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {newFiles.map((file, idx) => (
              <div key={idx} className="relative group">
                {file.type.startsWith("video") ? (
                  <video
                    src={URL.createObjectURL(file)}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                ) : (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                )}
                <button
                  onClick={() => handleRemoveFile(idx)}
                  className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ฟีดโพสต์ */}
      <div className="mt-8 space-y-6">
        {loading ? (
          <p className="text-gray-500">⏳ กำลังโหลดโพสต์...</p>
        ) : posts.length === 0 ? (
          <p className="text-gray-400 text-center">ยังไม่มีโพสต์</p>
        ) : (
          posts.map((p) => <PostDetail key={p.id} post={p} onRefresh={fetchPosts} />)
        )}
      </div>
    </div>
  )
}
