import { useEffect, useState } from "react"
import axios from "axios"
import Button from "@/components/ui/button"
import { useAuth } from "@/store/auth"
import { KycDocument } from "@/types"

export default function Kyc() {
    const [docs, setDocs] = useState<KycDocument[]>([])
    const { user, token } = useAuth()

    // โหลดเอกสารที่ pending
    useEffect(() => {
        if (!token) return
        axios
            .get<KycDocument[]>("/api/admin/kyc/pending", {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then(res => setDocs(res.data))
            .catch(err => {
                console.error("Error fetching KYC:", err)
            })
    }, [token])

    // handle approve / reject
    const handleAction = async (id: number, action: "approve" | "reject") => {
        if (!user || !token) return
        if (user.role !== "admin") {
            alert("คุณไม่มีสิทธิ์ทำรายการนี้")
            return
        }

        try {
            let payload: any = {}

            if (action === "reject") {
                const reason = prompt("กรุณากรอกเหตุผลในการ Reject:")
                if (!reason) return
                payload = { reason }   // ✅ เปลี่ยนจาก note → reason
            }


            const res = await axios.patch<{ message: string }>(
                `/api/admin/kyc/${id}/${action}`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            )

            alert(res.data.message)
            // อัปเดต state → ลบ doc ที่จัดการแล้ว
            setDocs(prev => prev.filter(d => d.id !== id))
        } catch (err: any) {
            console.error(err)
            alert(err.response?.data?.message || "ทำรายการไม่สำเร็จ")
        }
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">KYC Verification</h2>

            {docs.length === 0 ? (
                <p className="text-gray-500">ไม่มีรายการรอตรวจสอบ</p>
            ) : (
                <table className="w-full border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <thead>
                        <tr className="bg-gray-100 text-left">
                            <th className="px-4 py-2">ID</th>
                            <th className="px-4 py-2">User</th>
                            <th className="px-4 py-2">File</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {docs.map(d => (
                            <tr key={d.id} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-2">{d.id}</td>
                                <td className="px-4 py-2">{d.user?.email}</td>
                                <td className="px-4 py-2">
                                    <a
                                        href={d.fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-500 underline"
                                    >
                                        ดูไฟล์
                                    </a>
                                </td>
                                <td className="px-4 py-2 capitalize">{d.status}</td>
                                <td className="px-4 py-2">
                                    <Button
                                        onClick={() => handleAction(d.id, "approve")}
                                        className="mr-2 bg-green-500 hover:bg-green-600"
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        onClick={() => handleAction(d.id, "reject")}
                                        className="bg-red-500 hover:bg-red-600"
                                    >
                                        Reject
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}
