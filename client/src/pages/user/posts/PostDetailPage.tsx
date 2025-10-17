import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import PostDetail, { Post } from "./PostDetail"

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPost = async () => {
    if (!id) return
    try {
      const res = await api.get<Post>(`/posts/${id}`)
      setPost(res.data)
    } catch (err) {
      console.error("Error fetching post", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPost()
  }, [id])

  if (loading) return <p className="p-6">กำลังโหลดโพสต์...</p>
  if (!post) return <p className="p-6">❌ ไม่พบโพสต์</p>

  return <PostDetail post={post} onRefresh={fetchPost} />
}
