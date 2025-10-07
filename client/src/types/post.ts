// client/src/types/post.ts
import { User } from "./user"

export interface PostImage {
  id: number
  url: string
  position?: number
}

export interface Comment {
  id: number
  content: string
  createdAt: string
  author?: User
}

export interface Like {
  id?: number
  userId?: number
  postId?: number
}

export interface Post {
  id: number
  content: string
  createdAt: string
  updatedAt?: string
  visibility: "public" | "friendsOnly"
  author?: User
  images: PostImage[]
  comments: Comment[]
  likes: Like[]
}

// ใช้กับ API /posts/list/paged
export interface PagedPostsResponse {
  ok: boolean
  total: number
  page: number
  pageSize: number
  items: Post[]
}
