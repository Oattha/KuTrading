import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { api } from "@/lib/api"
import { useAuth } from "@/store/auth"

// === Types ===
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

interface Post {
  id: number
  content: string
  createdAt: string
  author: Author
  images: PostImage[]
  comments: Comment[]
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // ดึงโพสต์
  const fetchPost = async () => {
    try {
      setLoading(true)
      const res = await api.get<Post>(`/posts/${id}`)
      setPost(res.data)
    } catch (err: any) {
      setError(err.response?.data?.message || "Error fetching post")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchPost()
  }, [id])

  // ส่งคอมเมนต์ใหม่
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !id) return
    try {
      setSubmitting(true)
      await api.post("/posts/comment", {
        postId: Number(id),
        content: newComment,
      })
      setNewComment("")
      fetchPost()
    } catch (err: any) {
      alert(err.response?.data?.message || "Error adding comment")
    } finally {
      setSubmitting(false)
    }
  }

  // ลบคอมเมนต์
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("คุณต้องการลบคอมเมนต์นี้หรือไม่?")) return
    try {
      await api.delete(`/posts/comment/${commentId}`)
      fetchPost()
    } catch (err: any) {
      alert(err.response?.data?.message || "Error deleting comment")
    }
  }

  if (loading) return <p>กำลังโหลด...</p>
  if (error) return <p className="text-red-500">{error}</p>
  if (!post) return <p>ไม่พบโพสต์</p>

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* ผู้เขียน */}
      <div className="flex items-center gap-3">
        <img
          src={post.author.avatarUrl || "https://via.placeholder.com/40"}
          alt={post.author.name}
          className="w-10 h-10 rounded-full"
        />
        <div>
          <p className="font-semibold">{post.author.name}</p>
          <p className="text-sm text-gray-500">
            {new Date(post.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* เนื้อหาโพสต์ */}
      <p className="text-lg">{post.content}</p>

      {/* รูปภาพ */}
      {post.images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {post.images.map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt="post"
              className="rounded-lg"
            />
          ))}
        </div>
      )}

      {/* คอมเมนต์ */}
      <div className="mt-6">
        <h3 className="font-semibold mb-3">ความคิดเห็น</h3>

        {/* ฟอร์มเพิ่มคอมเมนต์ */}
        <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="เขียนความคิดเห็น..."
            className="flex-1 border rounded-lg px-3 py-2"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
          >
            {submitting ? "กำลังส่ง..." : "ส่ง"}
          </button>
        </form>

        {post.comments.length === 0 ? (
          <p className="text-gray-500">ยังไม่มีความคิดเห็น</p>
        ) : (
          <div className="space-y-3">
            {post.comments.map((c) => (
              <div key={c.id} className="flex gap-3 items-start">
                <img
                  src={c.author.avatarUrl || "https://via.placeholder.com/32"}
                  alt={c.author.name}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-semibold">{c.author.name}</p>
                  <p>{c.content}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>
                {/* ปุ่มลบคอมเมนต์ (เฉพาะเจ้าของหรือ admin) */}
                {(user?.id === c.author.id || user?.role === "admin") && (
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="text-red-500 text-sm hover:underline"
                  >
                    ลบ
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
