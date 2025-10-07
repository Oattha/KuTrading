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

export default function Profile() {
  const { id } = useParams()
  const { user, setUser, logout } = useAuth()
  const navigate = useNavigate()

  const [profileUser, setProfileUser] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  // 📌 โหลดข้อมูล user
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

  // 📌 โหลดโพสต์เมื่อ profileUser เปลี่ยน
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

  if (!profileUser) {
    return <p className="p-6 text-center text-gray-500">⏳ กำลังโหลดข้อมูลผู้ใช้...</p>
  }

  // 📌 อัปโหลดรูปโปรไฟล์
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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-12">
      {/* ส่วนโปรไฟล์ */}
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
            {user && user.id !== profileUser.id && (
              <button
                onClick={handleStartChat}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 shadow-md transition"
              >
                <FaComments /> เริ่มแชทส่วนตัว
              </button>
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
                {uploading && (
                  <p className="text-sm text-gray-500 mt-2">⏳ กำลังอัปโหลด...</p>
                )}
                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
          <p><FaIdBadge className="inline mr-2 text-indigo-500" /> <span className="font-semibold">ID:</span> {profileUser.id}</p>
          <p><FaUserTag className="inline mr-2 text-indigo-500" /> <span className="font-semibold">Name:</span> {profileUser.name}</p>
          <p><FaEnvelope className="inline mr-2 text-indigo-500" /> <span className="font-semibold">Email:</span> {profileUser.email}</p>
          <p><FaUserShield className="inline mr-2 text-indigo-500" /> <span className="font-semibold">Role:</span> {profileUser.role}</p>
        </div>

        {user && user.id === profileUser.id && (
          <button
            onClick={logout}
            className="mt-8 flex items-center gap-2 px-5 py-2 bg-rose-500 text-white font-medium rounded-full hover:bg-rose-600 shadow-md transition"
          >
            <FaSignOutAlt /> Logout
          </button>
        )}
      </section>

      {/* ส่วนโพสต์ */}
      <section>
        <h2 className="flex items-center gap-2 text-2xl font-bold mb-6 text-purple-600">
          <MdPostAdd /> โพสต์ที่โต้ตอบ
        </h2>

        {loading && <p className="text-gray-500">⏳ กำลังโหลดโพสต์...</p>}

        {!loading && posts.length === 0 && (
          <div className="p-10 text-center text-gray-500 border-2 border-dashed rounded-xl">
            ยังไม่มีโพสต์
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="relative group bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition"
            >
              {post.images.length > 0 ? (
                <img
                  src={post.images[0].url}
                  alt="post"
                  className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-56 flex items-center justify-center bg-gray-100 text-gray-400">
                  ไม่มีรูป
                </div>
              )}

              <div className="p-4 flex flex-col h-full">
                <p className="mb-2 line-clamp-2 text-gray-800">{post.content}</p>
                <span className="block text-xs text-gray-500 mb-3 flex items-center gap-3">
                  <span className="flex items-center gap-1"><FaThumbsUp /> {post.likes.length}</span>
                  <span className="flex items-center gap-1"><FaRegCommentDots /> {post.comments.length}</span>
                </span>

                <div className="mt-auto flex justify-between gap-2">
                  <Link
                    to={`/user/posts/${post.id}`}
                    className="flex-1 px-3 py-1 text-center bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm"
                  >
                    ดู
                  </Link>
                  {user && user.id === profileUser.id && (
                    <>
                      <Link
                        to={`/user/posts/${post.id}/edit`}
                        className="flex-1 px-3 py-1 text-center bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 text-sm"
                      >
                        แก้ไข
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="flex-1 px-3 py-1 text-center bg-rose-500 text-white rounded-lg hover:bg-rose-600 text-sm"
                      >
                        ลบ
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
