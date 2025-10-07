import { useEffect, useState } from "react"
import { useAuth } from "@/store/auth"
import { api } from "@/lib/api"

interface UserDocument {
  id: number
  status: "submitted" | "approved" | "rejected"
  fileUrl?: string
  reviewedAt?: string | null
}

export default function KycStatus() {
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // โหลดข้อมูล user ใหม่จาก backend
    const fetchUser = async () => {
      setLoading(true)
      await refreshUser()
      setLoading(false)
    }
    fetchUser()
  }, [refreshUser])

  if (loading) return <p>⏳ กำลังโหลด...</p>
  if (!user) return <p>❌ คุณยังไม่ได้ล็อกอิน</p>

  const latestDoc: UserDocument | undefined = user.documents?.[0]

  return (
    <div className="max-w-lg mx-auto bg-white shadow rounded p-6">
      <h2 className="text-xl font-bold mb-4">สถานะการยืนยันตัวตน (KYC)</h2>

      {latestDoc ? (
        <div>
          <p>
            <strong>สถานะ:</strong>{" "}
            {latestDoc.status === "submitted" && (
              <span className="text-yellow-600">⏳ รอตรวจสอบ</span>
            )}
            {latestDoc.status === "approved" && (
              <span className="text-green-600">✅ ผ่านการตรวจสอบแล้ว</span>
            )}
            {latestDoc.status === "rejected" && (
              <span className="text-red-600">❌ เอกสารถูกปฏิเสธ</span>
            )}
          </p>

          {latestDoc.fileUrl && (
            <p className="mt-2">
              <a
                href={latestDoc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                ดูไฟล์ที่อัปโหลด
              </a>
            </p>
          )}

          {latestDoc.reviewedAt && (
            <p className="text-sm text-gray-500 mt-2">
              ตรวจสอบล่าสุด: {new Date(latestDoc.reviewedAt).toLocaleString()}
            </p>
          )}
        </div>
      ) : (
        <p className="text-gray-600">
          คุณยังไม่ได้อัปโหลดเอกสาร KYC{" "}
          <a href="/kyc-upload" className="text-blue-500 underline">
            (อัปโหลดที่นี่)
          </a>
        </p>
      )}
    </div>
  )
}
