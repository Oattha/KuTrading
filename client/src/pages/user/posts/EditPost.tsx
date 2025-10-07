import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { api } from "@/lib/api"
import { Post } from "@/types/post"   // ✅ ใช้ Post จาก types อย่างเดียว

export default function EditPost() {
  const { postId } = useParams<{ postId: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [content, setContent] = useState("")
  const [visibility, setVisibility] = useState<"public" | "friendsOnly">("public")
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchPost = async () => {
    try {
      setLoading(true)
      const res = await api.get<Post>(`/posts/${postId}`)  // ✅ ระบุ generic
      setPost(res.data)
      setContent(res.data.content)
      setVisibility(res.data.visibility || "public")
    } catch (err) {
      console.error("Error fetching post:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.put(`/posts/${postId}`, { content, visibility })

      if (newFiles.length > 0) {
        const formData = new FormData()
        newFiles.forEach((f) => formData.append("files", f))
        await api.post(`/posts/${postId}/images`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      }

      alert("อัปเดตโพสต์สำเร็จ")
      navigate(`/user/posts/${postId}`)
    } catch (err) {
      console.error("Error updating post:", err)
      alert("แก้ไขโพสต์ไม่สำเร็จ")
    }
  }

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm("คุณแน่ใจว่าต้องการลบรูปนี้?")) return
    try {
      await api.delete(`/posts/images/${imageId}`)
      setPost((prev) =>
        prev
          ? { ...prev, images: prev.images.filter((img) => img.id !== imageId) }
          : prev
      )
    } catch (err) {
      console.error("Error deleting image:", err)
    }
  }

  useEffect(() => {
    fetchPost()
  }, [postId])

  if (loading) return <p>⏳ กำลังโหลด...</p>
  if (!post) return <p>❌ ไม่พบโพสต์</p>

  return (
    <div className="max-w-xl mx-auto bg-white shadow p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">แก้ไขโพสต์</h2>
      <form onSubmit={handleUpdate} className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border rounded p-2"
          rows={4}
        />

        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as "public" | "friendsOnly")}
          className="border rounded p-2"
        >
          <option value="public">สาธารณะ</option>
          <option value="friendsOnly">เพื่อนเท่านั้น</option>
        </select>

        {/* รูปเก่า */}
        {post.images.length > 0 && (
          <div className="space-y-2">
            <p className="font-semibold">รูปที่มีอยู่:</p>
            <div className="flex gap-2 flex-wrap">
              {post.images.map((img) => (
                <div key={img.id} className="relative">
                  <img
                    src={img.url}
                    alt="post"
                    className="h-32 rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.id)}
                    className="absolute top-0 right-0 bg-red-500 text-white px-1 text-xs rounded"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* เพิ่มรูปใหม่ */}
        <input
          type="file"
          multiple
          onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
        />

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          บันทึกการเปลี่ยนแปลง
        </button>
      </form>
    </div>
  )
}
