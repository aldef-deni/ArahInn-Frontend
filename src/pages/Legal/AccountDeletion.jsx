import {
  UserX, Mail, MessageCircle, Phone, AlertTriangle, CheckCircle2,
  Database, Clock, ShieldCheck, ArrowRight, FileText,
} from 'lucide-react'
import SEO from '@/components/SEO'

const STEPS = [
  {
    num: 1,
    title: 'Kirim Permintaan',
    desc: 'Kirim email permintaan penghapusan akun ke alamat di bawah, dengan subject: "Permintaan Hapus Akun ArahInn".',
  },
  {
    num: 2,
    title: 'Sertakan Informasi',
    desc: 'Cantumkan email akun ArahInn yang ingin dihapus + alasan (opsional). Kami mungkin meminta verifikasi tambahan untuk keamanan.',
  },
  {
    num: 3,
    title: 'Verifikasi & Proses',
    desc: 'Tim kami akan memverifikasi kepemilikan akun dan memproses permintaan dalam 7 hari kerja. Konfirmasi dikirim ke email Anda.',
  },
  {
    num: 4,
    title: 'Akun Terhapus',
    desc: 'Setelah verifikasi selesai, akun Anda dan data pribadi akan dihapus sesuai ketentuan retensi di bawah.',
  },
]

const DATA_DELETED = [
  'Nama, alamat email, nomor telepon',
  'Foto profil dan avatar',
  'Riwayat pencarian dan preferensi pribadi',
  'Daftar wishlist dan riwayat lihat hotel/properti',
  'Pesan chat dengan hotel (private messages)',
  'Token notifikasi push dan device ID',
  'Setting privasi & preferensi notifikasi',
  'Saldo Poin Loyalty (tidak dapat dikembalikan setelah dihapus)',
]

const DATA_RETAINED = [
  {
    label: 'Riwayat Transaksi & Booking',
    period: '10 tahun',
    reason: 'Kewajiban audit pajak & perlindungan konsumen sesuai UU No. 8 Tahun 1999 (UU Perlindungan Konsumen) dan UU No. 28 Tahun 2007 (Ketentuan Umum dan Tata Cara Perpajakan).',
  },
  {
    label: 'Bukti Pembayaran & Invoice',
    period: '10 tahun',
    reason: 'Kewajiban penyimpanan dokumen keuangan sesuai UU Perpajakan.',
  },
  {
    label: 'Ulasan Hotel (anonim)',
    period: 'Selamanya',
    reason: 'Ulasan akan diubah jadi anonim (nama diganti "Pengguna ArahInn") tapi konten ulasan tetap ditampilkan untuk membantu user lain.',
  },
  {
    label: 'Log Aktivitas Keamanan',
    period: '1 tahun',
    reason: 'Untuk deteksi fraud, investigasi insiden keamanan, dan audit log.',
  },
]

export default function AccountDeletion() {
  return (
    <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen">
      <SEO
        title="Penghapusan Akun"
        description="Cara menghapus akun ArahInn dan data pribadi Anda. Panduan lengkap, jenis data yang dihapus, dan ketentuan retensi data sesuai regulasi Indonesia."
        url="/account-deletion"
        type="article"
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-600 via-rose-700 to-orange-700 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        <div className="container relative py-8 sm:py-12 lg:py-16 flex flex-col items-center text-center">
          <div className="bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 shadow-xl mb-4 sm:mb-6">
            <img src="/logo-arahin.png" alt="ArahInn" className="h-8 sm:h-10 md:h-12 w-auto" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mb-2 sm:mb-3 leading-tight">
            Hapus Akun ArahInn
          </h1>
          <p className="text-white/90 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed px-2">
            Anda berhak meminta penghapusan akun dan data pribadi Anda kapan saja. Berikut panduan lengkapnya.
          </p>
        </div>
      </section>

      <section className="container py-6 sm:py-10 lg:py-16 max-w-3xl">

        {/* Important notice */}
        <div className="mb-8 sm:mb-10 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-amber-900 mb-1.5">Perhatian Sebelum Menghapus Akun</h3>
              <ul className="text-xs sm:text-sm text-amber-800 space-y-1 leading-relaxed list-disc pl-4">
                <li>Penghapusan akun bersifat <strong>permanen</strong> dan tidak dapat dibatalkan.</li>
                <li>Saldo Poin Loyalty Anda akan <strong>hangus</strong> setelah akun dihapus.</li>
                <li>Booking yang sedang aktif (pending payment / belum check-out) <strong>tidak dapat dihapus</strong> sampai selesai atau dibatalkan.</li>
                <li>Anda harus membuat akun baru jika ingin menggunakan ArahInn lagi di masa depan.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Steps */}
        <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-5 flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
            <UserX className="w-4 h-4 sm:w-5 sm:h-5 text-brand" />
          </div>
          Cara Menghapus Akun
        </h2>

        <div className="space-y-3 sm:space-y-4 mb-10 sm:mb-12">
          {STEPS.map(step => (
            <div key={step.num} className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-sm">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-brand to-orange-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm">
                {step.num}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1">{step.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact methods */}
        <div className="mb-10 sm:mb-12 bg-gradient-to-br from-brand/5 via-blue-50 to-orange-50 border border-brand/20 rounded-2xl p-5 sm:p-6 md:p-8">
          <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 mb-1.5 sm:mb-2">Kirim Permintaan ke:</h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-5 sm:mb-6">Salah satu kontak di bawah ini. Tim kami merespons dalam 1×24 jam kerja.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <a href="mailto:privacy@arahinn.com?subject=Permintaan%20Hapus%20Akun%20ArahInn"
              className="flex items-center gap-3 p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md active:scale-[0.98] transition-all group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 shrink-0 transition-colors">
                <Mail className="w-5 h-5 text-blue-600 group-hover:text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Email Privacy</p>
                <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">privacy@arahinn.com</p>
              </div>
            </a>
            <a href="https://wa.me/6285188136009?text=Halo%20saya%20ingin%20menghapus%20akun%20ArahInn%20saya"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md active:scale-[0.98] transition-all group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 shrink-0 transition-colors">
                <MessageCircle className="w-5 h-5 text-emerald-600 group-hover:text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp</p>
                <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">+62 851-8813-6009</p>
              </div>
            </a>
            <a href="tel:+6285188136009"
              className="flex items-center gap-3 p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-orange-400 hover:shadow-md active:scale-[0.98] transition-all group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-500 shrink-0 transition-colors">
                <Phone className="w-5 h-5 text-orange-600 group-hover:text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Telepon</p>
                <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">+62 851-8813-6009</p>
              </div>
            </a>
          </div>
        </div>

        {/* Data Deleted */}
        <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-5 flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
          </div>
          Data yang Dihapus
        </h2>

        <div className="mb-10 sm:mb-12 bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
          <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4 leading-relaxed">
            Saat permintaan disetujui, data berikut akan <strong className="text-emerald-700">dihapus permanen</strong> dari sistem kami:
          </p>
          <ul className="space-y-2 sm:space-y-2.5">
            {DATA_DELETED.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Data Retained */}
        <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-5 flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
          </div>
          Data yang Tetap Disimpan (Sesuai Regulasi)
        </h2>

        <div className="mb-10 sm:mb-12 space-y-3 sm:space-y-4">
          {DATA_RETAINED.map(item => (
            <div key={item.label} className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">{item.label}</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] sm:text-xs font-bold shrink-0">
                  <Clock className="w-3 h-3" />
                  {item.period}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.reason}</p>
            </div>
          ))}
        </div>

        {/* Trust info */}
        <div className="bg-slate-900 text-white rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 mb-8">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-base sm:text-lg mb-1.5 sm:mb-2">Komitmen Kami</h3>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                ArahInn berkomitmen melindungi privasi Anda sesuai <strong>UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)</strong>. Permintaan penghapusan akun diproses gratis tanpa biaya. Jika ada pertanyaan, kami siap membantu melalui kontak di atas.
              </p>
              <a href="/kebijakan-privasi"
                className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                <FileText className="w-3.5 h-3.5" />
                Baca Kebijakan Privasi lengkap
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] sm:text-xs text-slate-400 leading-relaxed px-2">
          © 2026 ArahInn.com — PT. Redy Hospitality Management.<br className="sm:hidden" />
          <span className="hidden sm:inline"> </span>Semua hak dilindungi.
        </p>
      </section>
    </div>
  )
}
