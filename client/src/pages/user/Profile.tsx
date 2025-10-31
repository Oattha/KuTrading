import { useState, useEffect } from "react"
import { useAuth } from "@/store/auth"
import { api } from "@/lib/api"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Post, PagedPostsResponse } from "@/types/post"

import {
  FaUser,
  FaSignOutAlt,
  FaIdBadge,
  FaUserTag,
  FaEnvelope,
  FaUserShield,
  FaThumbsUp,
  FaRegCommentDots,
  FaComments,
  FaEllipsisV,
  FaStar,
} from "react-icons/fa"
import { MdPostAdd } from "react-icons/md"

// ✅ type ของ Conversation
interface Conversation {
  id: number
  isGroup?: boolean
  tradeId?: number | null
  type?: string
  participants?: { userId: number; user?: { id: number; name: string } }[]
}

// ✅ type ของ Review
interface Review {
  id: number
  rating: number
  comment: string | null
  createdAt: string
  reviewer: { id: number; name: string; avatarUrl?: string }
}

export default function Profile() {
  const { id } = useParams()
  const { user, setUser, logout } = useAuth()
  const navigate = useNavigate()

  const [profileUser, setProfileUser] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null)

  // ⭐ เพิ่ม state สำหรับรีวิว
  const [reviews, setReviews] = useState<Review[]>([])
  const [avgRating, setAvgRating] = useState<number>(0)
  const [showReviews, setShowReviews] = useState(false)
  const [loadingReviews, setLoadingReviews] = useState(false)

  // 📌 ปิดเมนูเมื่อคลิกนอก
  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(".post-menu")) setMenuOpenId(null)
    }
    document.addEventListener("click", close)
    return () => document.removeEventListener("click", close)
  }, [])

  // 📌 โหลดข้อมูลผู้ใช้
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (id) {
          const res = await api.get(`/users/${id}`)
          setProfileUser(res.data)
        } else {
          setProfileUser(user)
        }
      } catch (err) {
        console.error("Error fetching user:", err)
      }
    }
    fetchUser()
  }, [id, user])

  // 📌 โหลดโพสต์
  useEffect(() => {
    const fetchPosts = async () => {
      if (!profileUser) return
      try {
        setLoading(true)
        const res = await api.get<PagedPostsResponse>(
          `/posts/list/paged?page=1&pageSize=20&userId=${profileUser.id}`
        )
        setPosts(res.data.items || [])
      } catch (err) {
        console.error("Error fetching posts:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [profileUser])

  // ⭐ โหลดรีวิว
  useEffect(() => {
    if (!profileUser) return
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true)
        const res = await api.get<Review[]>(`/reviews/user/${profileUser.id}`)
        setReviews(res.data)
        const avg =
          res.data.reduce((acc, r) => acc + r.rating, 0) / (res.data.length || 1)
        setAvgRating(Number(avg.toFixed(1)))
      } catch (err) {
        console.error("Error fetching reviews:", err)
      } finally {
        setLoadingReviews(false)
      }
    }
    fetchReviews()
  }, [profileUser])

  if (!profileUser) {
    return <p className="p-6 text-center text-gray-500">⏳ กำลังโหลดข้อมูลผู้ใช้...</p>
  }

  // 📌 เปลี่ยนรูปโปรไฟล์
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || profileUser.id !== user.id) return
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      setUploading(true)
      setError(null)
      const res = await api.post<{ ok: boolean; url: string }>(
        "/users/profile-picture",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )

      if (res.data.ok) {
        setUser({ ...user, avatarUrl: res.data.url })
        setProfileUser({ ...profileUser, avatarUrl: res.data.url })
      }
    } catch (err) {
      console.error(err)
      setError("อัปโหลดรูปไม่สำเร็จ")
    } finally {
      setUploading(false)
    }
  }

  // 📌 ลบโพสต์
  const handleDelete = async (id: number) => {
    if (!confirm("คุณแน่ใจว่าต้องการลบโพสต์นี้?")) return
    try {
      await api.delete(`/posts/${id}`)
      setPosts((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error("Error deleting post:", err)
    }
  }

  // 📌 เริ่มแชท
  const handleStartChat = async () => {
    try {
      const res = await api.post<Conversation>("/chat/conversations", {
        otherUserId: profileUser.id,
      })
      const conversation = res.data
      navigate(`/chats/${conversation.id}`)
    } catch (err) {
      console.error("Error starting chat:", err)
    }
  }

  const handleReportUser = async (reason: string) => {
    try {
      const res = await api.post("/reports/user", {
        targetUserId: profileUser.id,
        reason,
      })
      alert("✅ ส่งรีพอร์ตสำเร็จ")
    } catch (err) {
      console.error("Error reporting user:", err)
      alert("❌ เกิดข้อผิดพลาดในการรีพอร์ต")
    }
  }


  return (
    <div className="p-6 max-w-5xl mx-auto space-y-12">
      {/* 🧍‍♂️ ส่วนโปรไฟล์ */}
      <section className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl shadow-md p-6">
        <h1 className="flex items-center gap-2 text-3xl font-extrabold text-indigo-600">
          <FaUser /> User Profile
        </h1>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-6">
          <img
            src={profileUser.avatarUrl || "https://placehold.co/120"}
            alt={profileUser.name}
            className="w-28 h-28 rounded-full object-cover border-4 border-indigo-300 shadow-sm"
          />

          <div className="flex-1 space-y-4">
            {/* ⭐ คะแนนเฉลี่ย */}
            <div className="flex items-center gap-2 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={i < Math.round(avgRating) ? "text-yellow-400" : "text-gray-300"}
                />
              ))}
              <span className="ml-2 text-gray-800 font-medium">
                {avgRating.toFixed(1)} / 5 ({reviews.length} รีวิว)
              </span>
              {reviews.length > 0 && (
                <button
                  onClick={() => setShowReviews(true)}
                  className="ml-3 text-sm text-indigo-600 underline hover:text-indigo-800"
                >
                  ดูรีวิวทั้งหมด
                </button>
              )}
            </div>

            {user && user.id !== profileUser.id && (
              <>
                <button
                  onClick={handleStartChat}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 shadow-md transition"
                >
                  <FaComments /> เริ่มแชทส่วนตัว
                </button>

                {/* 🔸 ปุ่มรีพอร์ต */}
                <button
                  onClick={() => {
                    const reason = prompt("กรุณากรอกเหตุผลที่ต้องการรีพอร์ตผู้ใช้นี้:")
                    if (!reason) return
                    handleReportUser(reason)
                  }}
                  className="w-full sm:w-auto mt-3 flex items-center justify-center gap-2 px-5 py-2 bg-rose-500 text-white font-medium rounded-full hover:bg-rose-600 shadow-md transition"
                >
                  🚨 รีพอร์ตผู้ใช้
                </button>
              </>
            )}


            {user && user.id === profileUser.id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เปลี่ยนรูปโปรไฟล์
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 
                             file:rounded-full file:border-0 file:text-sm file:font-semibold 
                             file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
                />
                {uploading && <p className="text-sm text-gray-500 mt-2">⏳ กำลังอัปโหลด...</p>}
                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
          <p>
            <FaUserTag className="inline mr-2 text-indigo-500" />
            <b>Name:</b> {profileUser.name}
          </p>

          {/* ✅ แสดงเฉพาะเจ้าของเท่านั้น */}
          {user && user.id === profileUser.id && (
            <>
              <p>
                <FaIdBadge className="inline mr-2 text-indigo-500" />
                <b>ID:</b> {profileUser.id}
              </p>
              <p>
                <FaEnvelope className="inline mr-2 text-indigo-500" />
                <b>Email:</b> {profileUser.email}
              </p>
              <p>
                <FaUserShield className="inline mr-2 text-indigo-500" />
                <b>Role:</b> {profileUser.role}
              </p>
            </>
          )}
        </div>

        {user && user.id === profileUser.id && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              แก้ไขชื่อผู้ใช้
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={profileUser.name}
                onChange={(e) =>
                  setProfileUser({ ...profileUser, name: e.target.value })
                }
                className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />
              <button
                onClick={async () => {
                  try {
                    const res = await api.put<{ name: string }>("/users/me", {
                      name: profileUser.name,
                    })
                    setUser({ ...user, name: res.data.name })
                    alert("✅ เปลี่ยนชื่อเรียบร้อยแล้ว!")
                  } catch (err: any) {
                    // ✅ ถ้า backend ส่งข้อความมาว่า “คุณสามารถเปลี่ยนชื่อได้อีกครั้งในอีก X วัน”
                    const msg =
                      err.response?.data?.message || "❌ เกิดข้อผิดพลาดในการเปลี่ยนชื่อ"
                    alert(msg)
                    console.error(err)
                  }
                }}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
              >
                บันทึก
              </button>

            </div>
          </div>
        )}


        {user && user.id === profileUser.id && (
          <button
            onClick={logout}
            className="mt-8 flex items-center gap-2 px-5 py-2 bg-rose-500 text-white font-medium rounded-full hover:bg-rose-600 shadow-md transition"
          >
            <FaSignOutAlt /> Logout
          </button>
        )}
      </section>

      {/* 🔹 Modal แสดงรีวิว */}
      {showReviews && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowReviews(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-[90%] max-w-xl max-h-[80vh] overflow-y-auto shadow-lg"
          >
            <h3 className="text-xl font-bold text-indigo-600 mb-4">
              รีวิวทั้งหมด ({reviews.length})
            </h3>

            {loadingReviews ? (
              <p className="text-gray-500">⏳ กำลังโหลด...</p>
            ) : reviews.length === 0 ? (
              <p className="text-gray-400">ยังไม่มีรีวิว</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="border-b border-gray-100 py-3">
                  <div className="flex items-center gap-3 mb-1">
                    <img
                      src={r.reviewer.avatarUrl || "https://placehold.co/40"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-800">{r.reviewer.name}</p>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={i < r.rating ? "text-yellow-400" : "text-gray-300"}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">{r.comment || "— ไม่มีข้อความ —"}</p>
                  <span className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleString("th-TH")}
                  </span>
                </div>
              ))
            )}

            <div className="mt-4 text-right">
              <button
                onClick={() => setShowReviews(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📰 ส่วนโพสต์ */}
      <section>
        <h2 className="flex items-center gap-2 text-2xl font-bold mb-6 text-purple-600">
          <MdPostAdd /> โพสต์ของฉัน
        </h2>

        {loading && <p className="text-gray-500">⏳ กำลังโหลดโพสต์...</p>}

        {!loading && posts.length === 0 && (
          <div className="p-10 text-center text-gray-500 border-2 border-dashed rounded-xl">
            ยังไม่มีโพสต์
          </div>
        )}

        {/* 🧩 แสดงโพสต์ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="relative group bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition"
            >
              {post.images && post.images.length > 0 ? (
                <img
                  src={post.images[0].url}
                  alt="post"
                  className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onClick={() => navigate(`/posts/${post.id}`)}
                />
              ) : post.videos && post.videos.length > 0 ? (
                <video
                  src={post.videos[0].url}
                  controls
                  className="w-full h-56 object-cover rounded-t-xl cursor-pointer"
                  onClick={() => navigate(`/posts/${post.id}`)}
                />
              ) : (
                <div
                  className="w-full h-56 flex items-center justify-center bg-gray-100 text-gray-400 cursor-pointer"
                  onClick={() => navigate(`/posts/${post.id}`)}
                >
                  ไม่มีรูปหรือวิดีโอ
                </div>
              )}

              {/* ⋮ เมนูสามจุด */}
              {user && user.id === profileUser.id && (
                <div className="absolute top-2 right-2 post-menu">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpenId((cur) => (cur === post.id ? null : post.id))
                    }}
                    className="p-2 rounded-full bg-white/80 hover:bg-white shadow"
                    aria-label="post menu"
                  >
                    <FaEllipsisV />
                  </button>

                  {menuOpenId === post.id && (
                    <div
                      className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          navigate(`/posts/${post.id}/edit`)
                          setMenuOpenId(null)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        ✏️ แก้ไขโพสต์
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpenId(null)
                          handleDelete(post.id)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-gray-100"
                      >
                        🗑️ ลบโพสต์
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* เนื้อหา */}
              <div className="p-4 flex flex-col h-full">
                <p className="mb-2 line-clamp-2 text-gray-800">{post.content}</p>
                <span className="block text-xs text-gray-500 mb-3 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <FaThumbsUp /> {post.likes.length}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaRegCommentDots /> {post.comments.length}
                  </span>
                </span>

                <Link
                  to={`/posts/${post.id}`}
                  className="mt-auto flex-1 px-3 py-1 text-center bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  ดูรายละเอียด
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
