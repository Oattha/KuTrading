// client/src/types/index.ts

export interface KycDocument {
  id: number
  userId: number
  fileUrl: string
  status: "submitted" | "approved" | "rejected"
  user: {
    id: number
    email: string
  }
}

// client/src/types/index.ts
export interface AdminLog {
  id: number
  action: string
  reason?: string
  details?: any
  createdAt: string
  admin: {
    id: number
    name: string
    email: string
  }
}

// client/src/types/index.ts

export interface AppUser {
  id: number
  email: string
  status: "active" | "banned" | "pending" | string   // เผื่อค่าอื่น ๆ
  role?: string
  createdAt?: string
}
