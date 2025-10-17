import { useState } from "react"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useAuth } from "@/store/auth"
import { FaExchangeAlt, FaRegCommentDots } from "react-icons/fa"
import toast from "react-hot-toast"   // ✅ เพิ่มแจ้งเตือน
import { FaShareAlt } from "react-icons/fa"

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

interface PostVideo {
  id: number
  url: string
}
interface Like {
  userId: number
}

export interface Post {
  id: number
  content: string
  createdAt: string
  author: Author
  images?: PostImage[]
  videos?: PostVideo[]
  comments?: Comment[]
  likes?: Like[]
  tradeStatus?: "requested" | "pending" | "accepted" | "completed" | "canceled" | null
}

interface Props {
  post: Post
  onRefresh: () => Promise<void>
}

export default function PostDetail({ post, onRefresh }: Props) {
  const { user } = useAuth()
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  const [showCommentsModal, setShowCommentsModal] = useState(false)

  // ✅ state ใหม่ สำหรับแก้ไข
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState("")

  const handleToggleLike = async () => {
    try {
      await api.post(`/posts/${post.id}/like`, { postId: post.id })
      await onRefresh()
    } catch (err) {
      console.error("Error toggling like", err)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    try {
      setSubmitting(true)
      await api.post("/posts/comment", { postId: post.id, content: newComment })
      setNewComment("")
      await onRefresh()
    } catch (err) {
      console.error("Error adding comment", err)
    } finally {
      setSubmitting(false)
    }
  }

  // ✅ ฟังก์ชันแก้ไขความคิดเห็น
  const handleEditComment = async (id: number) => {
    if (!editContent.trim()) return toast.error("กรุณากรอกข้อความก่อนบันทึก")
    try {
      await api.patch(`/posts/comment/${id}`, { content: editContent })
      toast.success("แก้ไขความคิดเห็นแล้ว")
      setEditingId(null)
      await onRefresh()
    } catch (err) {
      console.error("Error editing comment", err)
      toast.error("แก้ไขไม่สำเร็จ")
    }
  }

  // ✅ ฟังก์ชันลบความคิดเห็น
  const handleDeleteComment = async (id: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบความคิดเห็นนี้?")) return
    try {
      await api.delete(`/posts/comment/${id}`)
      toast.success("ลบความคิดเห็นแล้ว")
      await onRefresh()
    } catch (err) {
      console.error("Error deleting comment", err)
      toast.error("ลบไม่สำเร็จ")
    }
  }

  return (
    <div className="border rounded-2xl shadow-sm bg-white hover:shadow-md transition p-5 space-y-4">
      {/* 🧍‍♂️ ผู้เขียนโพสต์ */}
      <div className="flex items-center gap-3">
        <Link to={`/profile/${post.author.id}`} className="flex items-center gap-3 hover:opacity-80">
          <img
            src={post.author.avatarUrl || "https://placehold.co/40"}
            alt={post.author.name}
            className="w-10 h-10 rounded-full object-cover border"
          />
          <div>
            <p className="font-semibold text-gray-800">{post.author.name}</p>
            <p className="text-xs text-gray-500">
              {new Date(post.createdAt).toLocaleString("th-TH")}
            </p>
          </div>
        </Link>
      </div>

      {/* ✏️ เนื้อหาโพสต์ */}
      <p className="text-gray-800 text-base leading-relaxed">{post.content}</p>

      {/* 🖼️ รูปภาพ */}
      {post.images && post.images.length > 0 && (
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
              className={`rounded-lg w-full cursor-pointer hover:opacity-90 transition ${
                post.images!.length === 1
                  ? "object-contain max-h-[70vh]"
                  : "object-cover h-56"
              }`}
            />
          ))}
        </div>
      )}

{/* 🎥 วิดีโอ */}
{post.videos && post.videos.length > 0 && (
  <div className="mt-4 border-t border-gray-200 pt-4 flex flex-wrap gap-3 justify-center">
    {post.videos.map((vid, idx) => (
      <div
        key={idx}
        className="relative group cursor-pointer w-full sm:w-[48%] md:w-[45%] lg:w-[30%]"
        onClick={() => setSelectedVideo(vid.url)}
      >
        <video
          src={vid.url}
          className="rounded-lg border shadow-sm w-full h-64 object-cover hover:opacity-90 transition"
        />
        {/* Overlay เมื่อ hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition">
          <span className="text-white font-medium text-sm">▶ ดูวิดีโอเต็ม</span>
        </div>
      </div>
    ))}
  </div>
)}


{/* 🪟 Modal ดูวิดีโอเต็ม */}
{selectedVideo && (
  <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
<div
  className="relative flex justify-center items-center"
  onClick={(e) => {
    // ถ้าคลิกบริเวณนอกคลิป จะปิด modal
    if ((e.target as HTMLElement).tagName !== "VIDEO") {
      setSelectedVideo(null)
    }
  }}
>
  <video
    src={selectedVideo}
    controls
    autoPlay
    className="max-h-[80vh] max-w-[90vw] rounded-lg shadow-lg z-10"
  />
  <button
    onClick={() => setSelectedVideo(null)}
    className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-200 z-20"
  >
    ✕
  </button>
</div>

  </div>
)}


      {/* 🔍 Modal ดูรูปเต็ม */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="relative">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 bg-white rounded-full p-2 shadow hover:bg-gray-200"
            >
              ✕
            </button>
            <img
              src={selectedImage}
              alt="full"
              className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}

      {/* ❤️ ปุ่มถูกใจ */}
      <button
        onClick={handleToggleLike}
        className={`px-3 py-1 rounded-full text-sm font-medium shadow ${
          post.likes?.some((like) => like.userId === user?.id)
            ? "bg-red-500 text-white"
            : "bg-gray-200 text-gray-700"
        }`}
      >
        ❤️ {post.likes?.length ?? 0}
      </button>


{/* 🔗 ปุ่มแชร์โพสต์ */}
<button
  onClick={() => {
    const shareUrl = `${window.location.origin}/posts/${post.id}`
    navigator.clipboard.writeText(shareUrl)
    toast.success("คัดลอกลิงก์โพสต์แล้ว!")
  }}
  className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-sm font-medium shadow hover:bg-gray-300"
>
  <FaShareAlt className="inline-block mr-1" /> แชร์
</button>

      {/* 🔄 เทรด */}
      <div className="mt-2">
        {post.tradeStatus ? (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow bg-gray-300 text-gray-700">
            <FaExchangeAlt /> {post.tradeStatus}
          </span>
        ) : (
          <Link
            to={`/trades/create?postId=${post.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium shadow hover:bg-green-600 transition"
          >
            <FaExchangeAlt /> สร้างเทรด
          </Link>
        )}
      </div>

      {/* 💬 ความคิดเห็น (เพิ่มปุ่มแก้ไข/ลบ) */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FaRegCommentDots className="text-gray-600" />
          <h3 className="font-semibold text-gray-700">ความคิดเห็น</h3>
        </div>

        {(!post.comments || post.comments.length === 0) ? (
          <p className="text-gray-400 text-sm">ยังไม่มีความคิดเห็น</p>
        ) : (
          <div className="space-y-3">
            {post.comments.slice(-3).map((c) => (
              <div key={c.id} className="flex gap-2 items-start relative">
                <Link to={`/profile/${c.author.id}`} className="hover:opacity-80">
                  <img
                    src={c.author.avatarUrl || "https://placehold.co/32"}
                    alt={c.author.name}
                    className="w-8 h-8 rounded-full object-cover border"
                  />
                </Link>

                <div className="flex-1 bg-gray-50 rounded-lg p-2">
                  {editingId === c.id ? (
                    <>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm focus:ring focus:ring-blue-200"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleEditComment(c.id)}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                        >
                          บันทึก
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-sm text-gray-800">{c.author.name}</p>
                      <p className="text-sm">{c.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(c.createdAt).toLocaleString("th-TH")}
                      </p>

                      {user?.id === c.author.id && (
                        <div className="absolute top-1 right-2 flex gap-2 text-xs">
                          <button
                            onClick={() => {
                              setEditingId(c.id)
                              setEditContent(c.content)
                            }}
                            className="text-blue-600 hover:underline"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-red-600 hover:underline"
                          >
                            ลบ
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {post.comments.length > 3 && (
              <button
                onClick={() => setShowCommentsModal(true)}
                className="text-blue-500 text-sm hover:underline"
              >
                ดูความคิดเห็นทั้งหมด ({post.comments.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* ✍️ กล่องเพิ่มคอมเมนต์ */}
      <div className="flex items-center gap-2 mt-4">
        <img
          src={user?.avatarUrl || "https://placehold.co/32"}
          alt={user?.name || "me"}
          className="w-8 h-8 rounded-full object-cover border"
        />
        <input
          type="text"
          placeholder="เขียนความคิดเห็น..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 border rounded-full px-4 py-2 text-sm focus:ring focus:ring-blue-200"
        />
        <button
          onClick={handleAddComment}
          disabled={submitting}
          className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {submitting ? "..." : "ส่ง"}
        </button>
      </div>

      {/* 🪟 Modal ดูความคิดเห็นทั้งหมด */}
      {showCommentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-5 max-h-[80vh] overflow-y-auto relative flex flex-col">
            <button
              onClick={() => setShowCommentsModal(false)}
              className="absolute top-2 right-2 bg-gray-200 rounded-full px-3 py-1 hover:bg-gray-300"
            >
              ✕
            </button>
            <h3 className="font-semibold text-lg mb-4">ความคิดเห็นทั้งหมด</h3>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {post.comments?.map((c) => (
                <div key={c.id} className="flex gap-2 items-start relative">
                  <Link to={`/profile/${c.author.id}`} className="hover:opacity-80">
                    <img
                      src={c.author.avatarUrl || "https://placehold.co/32"}
                      alt={c.author.name}
                      className="w-8 h-8 rounded-full object-cover border"
                    />
                  </Link>
                  <div className="flex-1 bg-gray-50 rounded-lg p-2">
                    {editingId === c.id ? (
                      <>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full border rounded-lg p-2 text-sm focus:ring focus:ring-blue-200"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleEditComment(c.id)}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                          >
                            บันทึก
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-sm text-gray-800">{c.author.name}</p>
                        <p className="text-sm">{c.content}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(c.createdAt).toLocaleString("th-TH")}
                        </p>
                        {user?.id === c.author.id && (
                          <div className="absolute top-1 right-2 flex gap-2 text-xs">
                            <button
                              onClick={() => {
                                setEditingId(c.id)
                                setEditContent(c.content)
                              }}
                              className="text-blue-600 hover:underline"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="text-red-600 hover:underline"
                            >
                              ลบ
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ช่องเพิ่มคอมเมนต์ใหม่ */}
            <div className="flex items-center gap-2 mt-4 border-t pt-3">
              <img
                src={user?.avatarUrl || "https://placehold.co/32"}
                alt={user?.name || "me"}
                className="w-8 h-8 rounded-full object-cover border"
              />
              <input
                type="text"
                placeholder="เขียนความคิดเห็น..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 border rounded-full px-4 py-2 text-sm focus:ring focus:ring-blue-200"
              />
              <button
                onClick={handleAddComment}
                disabled={submitting}
                className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 disabled:opacity-50"
              >
                {submitting ? "..." : "ส่ง"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
