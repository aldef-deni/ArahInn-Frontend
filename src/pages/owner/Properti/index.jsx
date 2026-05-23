import { useOutletContext } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import DaftarHotel from './DaftarHotel'

/**
 * Halaman "Detail Properti" untuk role owner.
 * Me-render form multi-step DaftarHotel dalam mode edit
 * memakai ID hotel aktif yang dipilih dari sidebar.
 */
export default function PropertiDetail() {
  const { hotel } = useOutletContext()

  if (!hotel?.id) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-7 h-7 text-slate-400" />
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-1">Belum ada properti</h2>
        <p className="text-sm text-slate-500">
          Silakan daftarkan properti baru terlebih dahulu untuk dapat mengedit detail di sini.
        </p>
      </div>
    )
  }

  return <DaftarHotel editId={hotel.id} />
}
