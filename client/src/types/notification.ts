export interface Notification {
  id: number
  userId: number
  type: "system" | "kyc" | "trade" | "review" | "message"
  message: string
  read: boolean
  createdAt: string
}
