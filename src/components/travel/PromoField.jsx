import { Tag } from 'lucide-react'

// Input kode promo untuk checkout tiket (pesawat/pelni/kereta).
// Diskon diverifikasi & diterapkan server-side saat checkout.
export default function PromoField({ value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
        <Tag className="w-3.5 h-3.5 text-orange-500" /> Kode Promo <span className="font-normal text-slate-400">(opsional)</span>
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder="Masukkan kode voucher"
        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
      />
      <p className="text-[11px] text-slate-400 mt-1">Diskon diverifikasi & diterapkan saat checkout.</p>
    </div>
  )
}
