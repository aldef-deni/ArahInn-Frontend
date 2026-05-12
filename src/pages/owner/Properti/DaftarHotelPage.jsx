import DaftarHotel from './DaftarHotel'

export default function DaftarHotelPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Minimal top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
          <img src="/logo-arahin.png" alt="ArahInn" className="h-7 object-contain" />
          <span className="text-slate-200 select-none">|</span>
          <span className="text-sm font-semibold text-slate-700">Pendaftaran Properti Baru</span>
        </div>
      </header>

      {/* Form content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        <DaftarHotel />
      </main>
    </div>
  )
}
