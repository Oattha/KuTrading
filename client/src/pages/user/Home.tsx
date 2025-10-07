import { useAuth } from "@/store/auth"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { FaHome, FaRegCommentDots, FaExchangeAlt, FaPlus, FaTimes } from "react-icons/fa"
import { Link } from "react-router-dom"

interface Author {
  id: number
  name: string
  email: string
  avatarUrl?: string
  role?: string
}

interface Comment {
  id: number
  content: string
  createdAt: string
  author: Author
}

interface PostImage {
  id: number
  url: string
}

interface Like {
  userId: number
}

interface Post {
  id: number
  content: string
  createdAt: string
  author: Author
  images: PostImage[]
  comments: Comment[]
  likes: Like[]   // ✅ เพิ่ม likes
}

export default function Home() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [newComments, setNewComments] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState<number | null>(null)

  // === ฟอร์มโพสต์ใหม่ ===
  const [newContent, setNewContent] = useState("")
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [posting, setPosting] = useState(false)

  // === Modal ดูรูปเต็ม ===
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // โหลดโพสต์
  const fetchPosts = async () => {
    try {
      const res = await api.get<Post[]>("/posts")
      const sorted = (res.data as Post[]).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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

  // เพิ่มคอมเมนต์
  const handleAddComment = async (postId: number) => {
    const content = newComments[postId]
    if (!content?.trim()) return
    try {
      setSubmitting(postId)
      await api.post("/posts/comment", { postId, content })
      await fetchPosts()
      setNewComments((prev) => ({ ...prev, [postId]: "" }))
    } catch (err) {
      console.error("Error adding comment", err)
    } finally {
      setSubmitting(null)
    }
  }

  // เลือกรูป (สะสมหลายรูปได้)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  // ลบรูปที่เลือกออก
  const handleRemoveFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // โพสต์ใหม่
  const handleCreatePost = async () => {
    if (!newContent.trim() && newFiles.length === 0) return
    try {
      setPosting(true)
      const formData = new FormData()
      formData.append("content", newContent)
      newFiles.forEach((file) => formData.append("files", file))
      await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      setNewContent("")
      setNewFiles([])
      await fetchPosts()
    } catch (err) {
      console.error("Error creating post", err)
    } finally {
      setPosting(false)
    }
  }

  // ✅ ฟังก์ชัน Toggle Like
  const handleToggleLike = async (postId: number) => {
    try {
      await api.post(`/posts/${postId}/like`, { postId })
      await fetchPosts()
    } catch (err) {
      console.error("Error toggling like", err)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* หัวข้อ Home */}
      <div className="flex items-center gap-2 text-3xl font-bold text-gray-800">
        <FaHome className="text-indigo-500" />
        <h1>Home</h1>
      </div>
      <p className="mt-2 text-gray-600">
        สวัสดี {user?.name || "ผู้ใช้"} 👋 ยินดีต้อนรับสู่ฟีดโพสต์
      </p>

      {/* ฟอร์มโพสต์ใหม่ */}
      <div className="mt-6 bg-white border rounded-2xl shadow-sm p-4">
        <div className="flex gap-3">
          <img
            src={user?.avatarUrl || "https://placehold.co/40"}
            alt={user?.name}
            className="w-10 h-10 rounded-full object-cover border"
          />
          <textarea
            placeholder="วันนี้จะแลกอะไรดี..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="flex-1 border rounded-xl px-3 py-2 text-sm resize-none focus:ring focus:ring-indigo-200"
          />
        </div>

        {/* แนบไฟล์ */}
        <div className="mt-3">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="text-sm text-gray-500"
          />

          {/* Preview รูปก่อนโพสต์ */}
          {newFiles.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {newFiles.map((file, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleRemoveFile(idx)}
                    className="absolute top-1 right-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex justify-end">
            <button
              onClick={handleCreatePost}
              disabled={posting}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-full text-sm hover:bg-indigo-600 disabled:opacity-50"
            >
              <FaPlus /> {posting ? "กำลังโพสต์..." : "โพสต์"}
            </button>
          </div>
        </div>
      </div>

      {/* ฟีดโพสต์ */}
      <div className="mt-8 space-y-6">
        {loading ? (
          <p className="text-gray-500">⏳ กำลังโหลดโพสต์...</p>
        ) : posts.length === 0 ? (
          <p className="text-gray-400 text-center">ยังไม่มีโพสต์</p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="border rounded-2xl shadow-sm bg-white hover:shadow-md transition p-5 space-y-4"
            >
              {/* ผู้เขียน */}
              <div className="flex items-center gap-3">
                <Link
                  to={`/profile/${post.author.id}`}
                  className="flex items-center gap-3 hover:opacity-80"
                >
                  <img
                    src={post.author.avatarUrl || "https://placehold.co/40"}
                    alt={post.author.name}
                    className="w-10 h-10 rounded-full object-cover border"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">
                      {post.author.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleString("th-TH")}
                    </p>
                  </div>
                </Link>
              </div>

              {/* เนื้อหาโพสต์ */}
              <p className="text-gray-800 text-base leading-relaxed">
                {post.content}
              </p>

              {/* รูปภาพ */}
              {post.images.length > 0 && (
                <div
                  className={`grid gap-2 ${
                    post.images.length === 1
                      ? "grid-cols-1"
                      : post.images.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-2 md:grid-cols-3"
                  }`}
                >
                  {post.images.map((img) => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt="post"
                      onClick={() => setSelectedImage(img.url)}
                      className="rounded-lg object-cover w-full h-56 hover:opacity-90 transition cursor-pointer"
                    />
                  ))}
                </div>
              )}

              {/* ✅ ปุ่มถูกใจ */}
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => handleToggleLike(post.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium shadow 
                              ${post.likes.some(like => like.userId === user?.id) 
                                ? "bg-red-500 text-white" 
                                : "bg-gray-200 text-gray-700"}`}
                >
                  ❤️ {post.likes.length}
                </button>
              </div>

              {/* ปุ่มสร้างเทรด */}
              <div className="mt-4">
                <Link
                  to={`/trades/create?postId=${post.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium shadow hover:bg-green-600 transition"
                >
                  <FaExchangeAlt /> สร้างเทรด
                </Link>
              </div>

              {/* คอมเมนต์ */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FaRegCommentDots className="text-gray-600" />
                  <h3 className="font-semibold text-gray-700">ความคิดเห็น</h3>
                </div>
                {post.comments.length === 0 ? (
                  <p className="text-gray-400 text-sm">ยังไม่มีความคิดเห็น</p>
                ) : (
                  <div className="space-y-3">
                    {post.comments.map((c) => (
                      <div key={c.id} className="flex gap-2 items-start">
                        <Link to={`/profile/${c.author.id}`} className="hover:opacity-80">
                          <img
                            src={c.author.avatarUrl || "https://placehold.co/32"}
                            alt={c.author.name}
                            className="w-8 h-8 rounded-full object-cover border"
                          />
                        </Link>
                        <div className="flex-1 bg-gray-50 rounded-lg p-2">
                          <p className="font-medium text-sm text-gray-800">
                            {c.author.name}
                          </p>
                          <p className="text-sm">{c.content}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(c.createdAt).toLocaleString("th-TH")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* กล่องเพิ่มคอมเมนต์ใหม่ */}
                <div className="flex items-center gap-2 mt-4">
                  <img
                    src={user?.avatarUrl || "https://placehold.co/32"}
                    alt={user?.name || "me"}
                    className="w-8 h-8 rounded-full object-cover border"
                  />
                  <input
                    type="text"
                    placeholder="เขียนความคิดเห็น..."
                    value={newComments[post.id] || ""}
                    onChange={(e) =>
                      setNewComments((prev) => ({
                        ...prev,
                        [post.id]: e.target.value,
                      }))
                    }
                    className="flex-1 border rounded-full px-4 py-2 text-sm focus:ring focus:ring-blue-200"
                  />
                  <button
                    onClick={() => handleAddComment(post.id)}
                    disabled={submitting === post.id}
                    className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 disabled:opacity-50"
                  >
                    {submitting === post.id ? "..." : "ส่ง"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal ดูรูปเต็ม */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="relative">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 bg-white rounded-full p-2 shadow hover:bg-gray-200"
            >
              <FaTimes />
            </button>
            <img
              src={selectedImage}
              alt="full"
              className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}
