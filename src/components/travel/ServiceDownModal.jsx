import { AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/**
 * Overlay "layanan sedang gangguan" untuk halaman cari travel (pesawat/kereta/pelni)
 * saat moda dinonaktifkan superadmin. Backdrop menutupi form → tak bisa diinteraksi.
 *
 * Props:
 *   open    - tampilkan overlay
 *   accent  - warna tombol: 'sky' (pesawat) | 'amber' (kereta) | 'cyan' (pelni)
 *   title   - judul (default: "Layanan Sedang Gangguan")
 *   message - isi pesan
 *   backTo  - path tombol kembali (default: '/topup-tagihan')
 */
const ACCENTS = {
  sky  : 'bg-sky-500 hover:bg-sky-600',
  amber: 'bg-amber-500 hover:bg-amber-600',
  cyan : 'bg-cyan-500 hover:bg-cyan-600',
}

export default function ServiceDownModal({
  open,
  accent = 'sky',
  title = 'Layanan Sedang Gangguan',
  message = 'Layanan sedang dalam gangguan, mohon kembali lagi nanti.',
  backTo = '/',
  backLabel = 'Kembali ke Beranda',
}) {
  const navigate = useNavigate()
  if (!open) return null
  const btn = ACCENTS[accent] || ACCENTS.sky

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />
        <div className="p-6 sm:p-7 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4 ring-8 ring-amber-50/60">
            <AlertTriangle className="w-8 h-8 text-amber-500" strokeWidth={2.25} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1.5">{title}</h2>
          <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
          <button
            onClick={() => navigate(backTo)}
            className={`mt-6 w-full py-3 rounded-xl text-white font-semibold text-sm active:scale-[0.98] transition-all ${btn}`}
          >
            {backLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
