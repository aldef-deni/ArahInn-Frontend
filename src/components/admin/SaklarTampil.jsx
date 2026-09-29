import { Eye, EyeOff } from 'lucide-react'

/**
 * Saklar tampil/sembunyi satu produk PPOB.
 *
 * Dipisahkan dari status vendor karena keduanya menjawab pertanyaan berbeda:
 * status vendor menentukan produknya BISA dijual, saklar ini menentukan kita
 * MAU menjualnya. Sinkronisasi katalog menimpa status vendor setiap kali,
 * sedangkan keputusan di saklar ini tidak boleh ikut tersapu.
 *
 * Dipakai halaman RajaBiller/Digiflazz gabungan maupun halaman Digiflazz
 * tersendiri — satu definisi supaya keduanya tidak menyimpang.
 */
export default function SaklarTampil({ aktif, sibuk, onUbah }) {
  return (
    <button
      type="button"
      disabled={sibuk}
      onClick={() => onUbah(!aktif)}
      title={aktif ? 'Sembunyikan dari pelanggan' : 'Tampilkan ke pelanggan'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50 ${
        aktif
          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
      }`}
    >
      {aktif ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
      {aktif ? 'Tampil' : 'Sembunyi'}
    </button>
  )
}
