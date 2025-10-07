import { useParams } from "react-router-dom"

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">รายละเอียดการแลกเปลี่ยน #{id}</h1>
      <p className="text-gray-600 mt-2">TODO: โหลดข้อมูล trade {id} จาก backend</p>
    </div>
  )
}
