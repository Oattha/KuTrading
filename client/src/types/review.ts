export interface Review {
  id: number
  tradeId: number
  reviewer: { id: number; name: string | null; avatarUrl?: string | null }
  reviewee: { id: number; name: string | null }
  rating: number
  comment?: string | null
  createdAt: string
  hidden: boolean   // 👈 เปลี่ยนจาก boolean | undefined → boolean
}
