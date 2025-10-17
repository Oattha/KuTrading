import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { api } from "@/lib/api"
import { Post } from "@/types/post"

export default function EditPost() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [content, setContent] = useState("")
  const [visibility, setVisibility] = useState<"public" | "friendsOnly">("public")
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // 📌 โหลดโพสต์
  const fetchPost = async () => {
    if (!id) return
    try {
      setLoading(true)
      const res = await api.get<Post>(`/posts/${id}`)
      setPost(res.data)
      setContent(res.data.content)
      setVisibility(res.data.visibility || "public")
    } catch (err) {
      console.error("Error fetching post:", err)
    } finally {
      setLoading(false)
    }
  }

  // 📌 บันทึกการแก้ไข (รวมอัปโหลดวิดีโอ)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    try {
      await api.put(`/posts/${id}`, { content, visibility })

      if (newFiles.length > 0) {
        // 📦 แยกประเภทไฟล์
        const imageFiles = newFiles.filter(f => f.type.startsWith("image"))
        const videoFiles = newFiles.filter(f => f.type.startsWith("video"))

        // 🖼️ 1. อัปโหลดรูปใหม่
        if (imageFiles.length > 0) {
          const formData = new FormData()
          imageFiles.forEach(file => formData.append("files", file))
          await api.post(`/posts/${id}/images`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
        }

        // 🎥 2. อัปโหลดวิดีโอใหม่
        if (videoFiles.length > 0) {
          const videoForm = new FormData()
          videoFiles.forEach(file => videoForm.append("files", file))
          await api.post(`/posts/${id}/videos`, videoForm, {
            headers: { "Content-Type": "multipart/form-data" },
          })
        }
      }

      alert("อัปเดตโพสต์สำเร็จ ✅")
      navigate(`/posts/${id}`)
    } catch (err) {
      console.error("Error updating post:", err)
      alert("แก้ไขโพสต์ไม่สำเร็จ ❌")
    }
  }

  // 📌 ลบรูป
  const handleDeleteImage = async (imageId: number) => {
    if (!confirm("คุณแน่ใจว่าต้องการลบรูปนี้?")) return
    try {
      await api.delete(`/posts/images/${imageId}`)
      setPost(prev => prev ? { ...prev, images: prev.images.filter(img => img.id !== imageId) } : prev)
    } catch (err) {
      console.error("Error deleting image:", err)
    }
  }

  // 📌 ลบวิดีโอ
const handleDeleteVideo = async (videoId: number) => {
  if (!confirm("คุณแน่ใจว่าต้องการลบวิดีโอนี้?")) return
  try {
    await api.delete(`/posts/videos/${videoId}`)
    setPost(prev =>
      prev
        ? { ...prev, videos: prev.videos?.filter(v => v.id !== videoId) ?? [] }
        : prev
    )
  } catch (err) {
    console.error("Error deleting video:", err)
  }
}


  // 📌 ลบไฟล์ใหม่ (ก่อนอัปโหลด)
  const handleRemoveNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index))
  }

  useEffect(() => {
    fetchPost()
  }, [id])

  if (loading) return <p>⏳ กำลังโหลด...</p>
  if (!post) return <p>❌ ไม่พบโพสต์</p>

  return (
    <div className="max-w-xl mx-auto bg-white shadow p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">แก้ไขโพสต์</h2>

      <form onSubmit={handleUpdate} className="space-y-4">
        {/* 📝 เนื้อหาโพสต์ */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border rounded p-2"
          rows={4}
        />

        {/* 🌍 การมองเห็น */}
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as "public" | "friendsOnly")}
          className="border rounded p-2"
        >
          <option value="public">สาธารณะ</option>
          <option value="friendsOnly">เพื่อนเท่านั้น</option>
        </select>

        {/* 🖼️ รูปเก่า */}
        {post.images && post.images.length > 0 && (
          <div className="space-y-2">
            <p className="font-semibold">รูปที่มีอยู่:</p>
            <div className="flex gap-2 flex-wrap">
              {post.images.map((img) => (
                <div key={img.id} className="relative">
                  <img src={img.url} alt="post" className="h-32 rounded border" />
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

        {/* 🎥 วิดีโอเก่า */}
        {post.videos && post.videos.length > 0 && (
          <div className="space-y-2 mt-4">
            <p className="font-semibold">วิดีโอที่มีอยู่:</p>
            <div className="flex gap-3 flex-wrap">
              {post.videos.map((vid) => (
                <div key={vid.id} className="relative">
                  <video src={vid.url} controls className="h-40 rounded-lg border shadow-sm" />
                  <button
                    type="button"
                    onClick={() => handleDeleteVideo(vid.id)}
                    className="absolute top-0 right-0 bg-red-500 text-white px-1 text-xs rounded"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📤 เพิ่มไฟล์ใหม่ (รูปหรือวิดีโอ) */}
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 
                     file:rounded-full file:border-0 file:text-sm file:font-semibold 
                     file:bg-blue-500 file:text-white hover:file:bg-blue-600"
        />

        {/* 🧩 Preview ไฟล์ใหม่ */}
        {newFiles.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-3">
            {newFiles.map((file, idx) => (
              <div key={idx} className="relative">
                {file.type.startsWith("image") ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                ) : (
                  <video
                    src={URL.createObjectURL(file)}
                    className="w-full h-24 rounded-lg border object-cover"
                    muted
                    controls
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveNewFile(idx)}
                  className="absolute top-1 right-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 💾 ปุ่มบันทึก */}
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mt-4"
        >
          บันทึกการเปลี่ยนแปลง
        </button>
      </form>
    </div>
  )
}
