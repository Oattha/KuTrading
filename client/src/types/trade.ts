export interface Trade {
  id: number
  buyerId: number
  sellerId: number
  productId: number
  status: "requested" | "pending" | "accepted" | "completed" | "canceled"
  createdAt: string
  updatedAt: string
}
