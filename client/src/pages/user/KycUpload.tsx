import { useState } from "react"
import { useAuth } from "@/store/auth"
import { api, ApiResponse } from "@/lib/api"
import { motion } from "framer-motion"

export default function KycUpload() {
  const [idCard, setIdCard] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user, logout } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!idCard || !selfie) {
      setError("กรุณาอัปโหลดไฟล์ทั้งสองอย่าง")
      return
    }

    try {
      const formData = new FormData()
      formData.append("files", idCard)
      formData.append("files", selfie)

      const res = await api.post<ApiResponse<{ message: string }>>(
        "/users/kyc",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )

      alert(res.data.message || "ส่ง KYC สำเร็จแล้ว 🎉 กรุณา login ใหม่")
      logout()
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || "ไม่สามารถอัปโหลดได้")
    }
  }

  const userStatus = user?.status || "pending"

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🔑 KYC Verification</h1>

      {userStatus === "active" ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120 }}
          className="bg-green-100 border border-green-300 rounded-xl p-6 text-center shadow-lg"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="text-6xl mb-4"
          >
            ✅
          </motion.div>
          <h2 className="text-xl font-bold text-green-700">
            ยืนยันตัวตนเรียบร้อยแล้ว!
          </h2>
          <p className="text-green-600 mt-2">
            บัญชีของคุณพร้อมใช้งานได้เต็มรูปแบบ 🚀
          </p>
        </motion.div>
      ) : (
        <>
          <div className="mb-4">
            <p className="font-semibold text-yellow-600">
              📌 สถานะปัจจุบัน: รอการตรวจสอบ ⏳
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 📄 อัปโหลดบัตรนิสิต */}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setIdCard(e.target.files?.[0] || null)}
              />
              <p className="text-sm text-gray-600 mt-1">
                📄 อัปโหลด <strong>รูปบัตรนิสิต (หรือจากแอป NisitKU)</strong>
              </p>
              {idCard && (
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(idCard)}
                    alt="ID Card Preview"
                    className="w-40 h-28 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => setIdCard(null)}
                    className="mt-2 text-xs text-red-600 hover:underline"
                  >
                    ❌ ลบไฟล์นี้
                  </button>
                </div>
              )}
            </div>

            {/* 🤳 อัปโหลดรูปถ่ายคู่กับบัตร */}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelfie(e.target.files?.[0] || null)}
              />
              <p className="text-sm text-gray-600 mt-1">
                🤳 อัปโหลด <strong>รูปถ่ายคู่กับบัตร/แอป NisitKU</strong>
              </p>
              {selfie && (
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(selfie)}
                    alt="Selfie Preview"
                    className="w-40 h-28 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => setSelfie(null)}
                    className="mt-2 text-xs text-red-600 hover:underline"
                  >
                    ❌ ลบไฟล์นี้
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-all"
            >
              ส่งยืนยัน KYC
            </button>
          </form>

          {error && <p className="text-red-600 mt-4">❌ {error}</p>}
        </>
      )}
    </div>
  )
}
