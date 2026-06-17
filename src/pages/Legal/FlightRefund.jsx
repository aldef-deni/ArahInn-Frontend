import { useState, useEffect } from 'react'
import {
  RotateCcw, CalendarClock, XCircle, ChevronDown, Check, X as XIcon,
  Phone, Mail, MessageCircle, ArrowUp, List, CheckCircle2,
} from 'lucide-react'
import SEO from '@/components/SEO'

const CATEGORIES = [
  { id: 'refund',     label: 'Refund',     Icon: RotateCcw },
  { id: 'reschedule', label: 'Reschedule', Icon: CalendarClock },
  { id: 'pembatalan', label: 'Pembatalan', Icon: XCircle },
]

export default function FlightRefund() {
  const [activeId, setActiveId] = useState('refund')
  const [open, setOpen] = useState({})
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [mobileTocOpen, setMobileTocOpen] = useState(false)

  const toggle = (id) => setOpen(o => ({ ...o, [id]: !o[id] }))

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 600)
      const offsets = CATEGORIES.map(s => {
        const el = document.getElementById(s.id)
        return { id: s.id, top: el ? el.getBoundingClientRect().top : Infinity }
      })
      const active = offsets.filter(o => o.top <= 160).pop()
      if (active) setActiveId(active.id)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileTocOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileTocOpen])

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (!el) return
    const offset = window.innerWidth < 1024 ? 80 : 100
    window.scrollTo({ top: el.offsetTop - offset, behavior: 'smooth' })
    setMobileTocOpen(false)
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen">
      <SEO
        title="Kebijakan Refund Penerbangan"
        description="Kebijakan refund, reschedule, dan pembatalan tiket pesawat di ArahInn — cara mengajukan, durasi proses, metode pengembalian dana, serta ketentuan maskapai."
        url="/penerbangan/refund"
        type="article"
      />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-500 via-sky-600 to-blue-800 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        <div className="container relative py-8 sm:py-12 lg:py-16 flex flex-col items-center text-center">
          <div className="bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 shadow-xl mb-4 sm:mb-6">
            <img src="/logo-arahin.png" alt="ArahInn" className="h-8 sm:h-10 md:h-12 w-auto" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold mb-3">
            <RotateCcw className="w-3.5 h-3.5" /> Refund · Reschedule · Pembatalan
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mb-2 sm:mb-3 leading-tight">
            Kebijakan Refund
          </h1>
          <p className="text-white/80 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed px-2">
            Ketentuan refund, reschedule, dan pembatalan tiket pesawat — beserta cara pengajuan dan estimasi prosesnya.
          </p>
        </div>
      </section>

      {/* ── Main ─────────────────────────────────────────────── */}
      <section className="container py-6 sm:py-10 lg:py-16">
        <div className="grid lg:grid-cols-[240px_1fr] gap-6 lg:gap-10">

          {/* TOC */}
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Kategori</p>
              <nav className="space-y-1">
                {CATEGORIES.map(({ id, label, Icon }) => (
                  <button key={id} onClick={() => scrollTo(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                      activeId === id ? 'bg-sky-50 text-sky-600 font-bold border-l-2 border-sky-500' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="min-w-0">
            {CATEGORIES.map(({ id, label, Icon }) => (
              <section key={id} id={id} className="mb-8 sm:mb-10 last:mb-0 scroll-mt-24">
                <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" />
                  </div>
                  <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-tight">{label}</h2>
                </div>
                <div className="space-y-2.5">
                  {DATA[id].map((item, i) => {
                    const key = `${id}-${i}`
                    return (
                      <FaqItem key={key} q={item.q} open={!!open[key]} onToggle={() => toggle(key)}>
                        {item.a}
                      </FaqItem>
                    )
                  })}
                </div>
              </section>
            ))}

            {/* Contact card */}
            <div className="mt-10 sm:mt-12 bg-gradient-to-br from-sky-500/5 via-blue-50 to-sky-50 border border-sky-500/20 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8">
              <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 mb-1.5 sm:mb-2">Butuh Bantuan?</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-5 sm:mb-6">Kesulitan mengajukan refund atau reschedule? Tim kami siap membantu.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <a href="https://wa.me/6285188136009" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md active:scale-[0.98] transition-all group">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 shrink-0 transition-colors">
                    <MessageCircle className="w-5 h-5 text-emerald-600 group-hover:text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">+62 851-8813-6009</p>
                  </div>
                </a>
                <a href="mailto:cs@arahinn.com"
                  className="flex items-center gap-3 p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md active:scale-[0.98] transition-all group">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 shrink-0 transition-colors">
                    <Mail className="w-5 h-5 text-blue-600 group-hover:text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Email</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">cs@arahinn.com</p>
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

            <p className="mt-6 sm:mt-8 text-center text-[11px] sm:text-xs text-slate-400 leading-relaxed px-2">
              © 2026 ArahInn.com — PT. Redy Hospitality Management. Semua hak dilindungi.
            </p>
          </div>
        </div>
      </section>

      {/* Mobile TOC button */}
      <button onClick={() => setMobileTocOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-40 h-12 px-4 rounded-full bg-white text-sky-600 border border-slate-200 shadow-lg active:scale-95 transition-all flex items-center gap-2"
        aria-label="Buka kategori">
        <List className="w-4 h-4" />
        <span className="text-xs font-bold">Kategori</span>
      </button>

      {mobileTocOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end" onClick={() => setMobileTocOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" />
          <div onClick={(e) => e.stopPropagation()} className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col animate-slide-up">
            <div className="shrink-0 px-5 pt-3 pb-2">
              <div className="mx-auto w-10 h-1 rounded-full bg-slate-300 mb-3" />
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-slate-900">Kategori</h3>
                <button onClick={() => setMobileTocOpen(false)} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center"><XIcon className="w-4 h-4 text-slate-600" /></button>
              </div>
            </div>
            <nav className="overflow-y-auto px-3 pb-6 space-y-1">
              {CATEGORIES.map(({ id, label, Icon }) => (
                <button key={id} onClick={() => scrollTo(id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${activeId === id ? 'bg-sky-50 text-sky-600 font-bold' : 'text-slate-700 active:bg-slate-50'}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${activeId === id ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'}`}><Icon className="w-4 h-4" /></div>
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-sky-500 text-white shadow-lg hover:bg-sky-600 active:scale-95 transition-all flex items-center justify-center"
          aria-label="Scroll to top">
          <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}

      <style>{`
        .faq-body p, .faq-body li { font-size: 0.875rem; line-height: 1.7; color: #475569; }
        .faq-body p { margin-bottom: 0.6rem; }
        .faq-body p:last-child { margin-bottom: 0; }
        .faq-body ol, .faq-body ul { padding-left: 1.25rem; margin: 0.4rem 0 0.6rem; }
        .faq-body ol { list-style: decimal; }
        .faq-body ul { list-style: disc; }
        .faq-body li { margin-bottom: 0.3rem; }
        .faq-body strong { color: #0f172a; font-weight: 700; }
        .faq-body a { color: #0284c7; font-weight: 600; }
        .faq-body a:hover { text-decoration: underline; }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
        .animate-fade-in  { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  )
}

function FaqItem({ q, open, onToggle, children }) {
  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${open ? 'border-sky-200 bg-sky-50/30' : 'border-slate-200 bg-white'}`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50/60 transition-colors">
        <span className="font-semibold text-sm text-slate-900 leading-snug">{q}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-sky-600' : ''}`} />
      </button>
      {open && <div className="faq-body px-4 pb-4 pt-1 border-t border-slate-100">{children}</div>}
    </div>
  )
}

const Deduct = () => (
  <ul>
    <li>Biaya layanan</li>
    <li>Kupon diskon</li>
    <li>ArahInn.com Points</li>
    <li>Biaya transfer bank</li>
    <li>Biaya pembatalan maskapai dan biaya refund ArahInn.com (dapat Anda periksa selama proses pengajuan)</li>
  </ul>
)

const DATA = {
  refund: [
    {
      q: 'Berapa jumlah refund tiket pesawat yang akan saya terima?',
      a: (<>
        <p>Jumlah refund yang Anda terima bergantung pada <strong>kebijakan maskapai</strong>. Beberapa tiket bersifat <em>full refundable</em>, ada yang hanya refund sebagian, dan ada pula yang tidak bisa di-refund sama sekali. Kebijakan ini juga berbeda tergantung alasan pengajuan (pribadi, sakit, pembatalan dari maskapai, dan lainnya).</p>
        <p>Waktu pengajuan juga berpengaruh — semakin dekat dengan keberangkatan, semakin kecil dana yang mungkin diterima. Beberapa komponen tidak bisa di-refund atau akan dipotong dari jumlah refund, seperti:</p>
        <Deduct />
        <p>Kami menyediakan estimasi jumlah dana refund dan durasi prosesnya untuk setiap tiket, sehingga Anda bisa mengecek perkiraan dana sebelum mengajukan.</p>
      </>),
    },
    {
      q: 'Bisakah refund hanya untuk satu penumpang dalam satu pesanan?',
      a: (<>
        <p>Ya, Anda bisa mengajukan refund untuk penumpang tertentu di dalam pesanan yang memuat lebih dari satu penumpang — tergantung kebijakan maskapai pada pesanan Anda.</p>
        <p><strong>Cara mengeceknya:</strong> buka e-tiket melalui menu <strong>Pesanan</strong>, ketuk bagian <strong>Refund</strong>, lalu scroll ke bawah untuk melihat apakah <em>partial refund</em> (penumpang tertentu) diperbolehkan. Jika tidak diizinkan, refund hanya bisa diajukan untuk seluruh penumpang dalam satu pesanan.</p>
      </>),
    },
    {
      q: 'Apakah makanan dan bagasi tambahan bisa di-refund?',
      a: (<>
        <p><strong>Makanan:</strong> refund tidak tersedia untuk makanan. Jika Anda membatalkan atau mengubah jadwal, makanan yang telah dipesan tidak dapat dipindahkan ke penerbangan baru dan tidak akan di-refund.</p>
        <p><strong>Bagasi tambahan:</strong> refund tidak tersedia, <em>kecuali</em> penerbangan dibatalkan oleh maskapai. Jika maskapai memberi refund dalam bentuk travel voucher dan Anda memakainya untuk membeli tiket baru, pesanan baru otomatis mendapatkan jatah bagasi yang sebelumnya Anda beli.</p>
      </>),
    },
    {
      q: 'Kenapa refund tiket pesawat saya tidak bisa diproses?',
      a: (<>
        <p>Beberapa alasan refund tidak bisa diproses oleh maskapai:</p>
        <ul>
          <li>Tiket Anda sudah digunakan.</li>
          <li>Anda sudah menggunakan salah satu tiket dari keseluruhan pesanan, sementara maskapai tidak mengizinkan refund sebagian.</li>
          <li>Anda sudah check-in ke penerbangan.</li>
          <li>Masa berlaku tiket sudah lewat.</li>
        </ul>
        <p>Jika salah satu kondisi di atas berlaku, tiket beserta fasilitas berbayar yang Anda beli sudah tidak bisa di-refund.</p>
      </>),
    },
    {
      q: 'Kenapa refund gagal ditransfer?',
      a: (<>
        <p>Kegagalan transfer dana refund bisa terjadi meski pengajuan telah disetujui. Hal ini disebabkan jumlah dana refund <strong>tidak mencapai minimum transfer</strong> (Rp10.000 / PHP 250 / VND 30.000 / SGD 10 / MYR 3 / THB 10 / USD 35) setelah dipotong Biaya Refund ArahInn.com, biaya layanan, kupon diskon, dan ArahInn.com Points yang digunakan saat pemesanan.</p>
      </>),
    },
    {
      q: 'Bagaimana cara mengajukan refund tiket pesawat?',
      a: (<>
        <p>Pastikan Anda sudah login dengan akun ArahInn.com, lalu:</p>
        <ol>
          <li><strong>Buka e-tiket</strong> — menu Pesanan, pilih e-tiket, scroll ke bawah dan ketuk <strong>Refund</strong>.</li>
          <li><strong>Cek ketersediaan refund</strong> — pilih alasan refund yang sesuai, lalu ketuk "Lihat jumlah refund".</li>
          <li><strong>Lihat estimasi & mulai pengajuan</strong> — periksa estimasi dana dan waktu, lalu ketuk "Mulai refund".</li>
          <li><strong>Isi data pengajuan</strong> — penerbangan, penumpang, alasan, metode pembayaran refund (mungkin perlu unggah dokumen sesuai alasan).</li>
          <li><strong>Ajukan refund</strong> — periksa kembali lalu ketuk "Ajukan Refund". Kami akan mengabari via email.</li>
        </ol>
      </>),
    },
    {
      q: 'Bagaimana cara submit refund karena pembatalan oleh maskapai?',
      a: (<>
        <ol>
          <li>Masuk/daftar ke ArahInn.com dengan email yang digunakan saat pemesanan.</li>
          <li>Buka <strong>Pesanan Saya</strong>, pilih pemesanan, lalu klik <strong>Pengembalian Dana</strong>.</li>
          <li>Baca kebijakan & estimasi, lalu klik <strong>Mulai Pengembalian Dana Saya</strong>.</li>
          <li>Lengkapi detail dan dokumen, pilih alasan <strong>Pembatalan oleh Maskapai</strong>.</li>
          <li>Tinjau detail dan klik <strong>Pengajuan Pengembalian Dana</strong>. Permintaan ditinjau ArahInn.com lalu diteruskan ke maskapai.</li>
        </ol>
        <p>Jumlah refund yang ditampilkan hanya perkiraan dan bergantung pada kebijakan maskapai.</p>
      </>),
    },
    {
      q: 'Berapa lama durasi proses refund?',
      a: (<>
        <p>Proses refund dimulai setelah pengajuan dibuat, atau setelah tanggal keberangkatan — tergantung tiket dan kebijakan masing-masing maskapai. Tahapannya:</p>
        <ol>
          <li><strong>Pengajuan diteruskan ke maskapai</strong> untuk ditinjau.</li>
          <li><strong>Maskapai meninjau</strong> pengajuan (durasi beragam).</li>
          <li><strong>Dana diproses</strong> — setelah disetujui, dana dikirim ke kami, kami verifikasi lalu teruskan ke Anda.</li>
          <li><strong>Refund dikirimkan</strong> — biasanya muncul di metode pembayaran Anda dalam <strong>14 hari kerja</strong>.</li>
        </ol>
      </>),
    },
    {
      q: 'Apa saja metode refund yang tersedia?',
      a: (<>
        <p>Pengiriman dana refund bergantung pada metode pembayaran saat pemesanan dan kebijakan maskapai:</p>
        <ul>
          <li><strong>Metode pembayaran awal</strong> (transfer bank, kartu kredit, PayLater) — dana dikembalikan ke rekening/kartu yang sama. Untuk PayLater, saldo muncul setelah proses selesai atau setelah pembayaran cicilan.</li>
          <li><strong>ArahInn.com Points</strong> — jika membayar dengan Points, refund dikembalikan dalam bentuk Points ke akun Anda.</li>
        </ul>
        <p>Jika ragu, ArahInn.com otomatis menentukan metode refund sesuai pembayaran awal dan kebijakan maskapai.</p>
      </>),
    },
    {
      q: 'Apa keuntungan refund dalam bentuk ArahInn.com Points?',
      a: (<>
        <ul>
          <li><strong>Lebih cepat</strong> dibandingkan metode lain.</li>
          <li><strong>Langsung aktif</strong> dan dapat segera ditukarkan untuk pembelian berikutnya.</li>
          <li><strong>Fleksibel</strong> — gunakan semua atau sebagian untuk membeli produk ArahInn.com dan kupon reward partner. Points berlaku <strong>satu tahun</strong> sejak diterima.</li>
        </ul>
      </>),
    },
    {
      q: 'Bagaimana cara mengecek status refund?',
      a: (<>
        <p><strong>Melalui aplikasi:</strong> buka menu <strong>Pesanan</strong> → scroll ke bawah dan ketuk <strong>"Refund Anda"</strong> → pilih pesanan untuk melihat status (masih diproses atau selesai).</p>
        <p><strong>Melalui website (voucher perjalanan):</strong> login → klik akun di kanan atas → <strong>Pesanan Saya</strong> → pilih pesanan → <strong>Details</strong> → <strong>Pengajuan Pengembalian Dana</strong> → pada Riwayat Pengembalian Dana klik <strong>Lihat Detil</strong>. Jika status <strong>Terkirim</strong>, kode voucher & syarat ketentuan telah dikirim ke email Anda.</p>
      </>),
    },
    {
      q: 'Bagaimana cek apakah refund sudah disetujui maskapai?',
      a: (<>
        <p>Lihat status melalui menu <strong>My Booking</strong> dan periksa detail riwayat refund penerbangan Anda. Apabila status belum disetujui namun Anda menerima informasi persetujuan dari maskapai, lampirkan buktinya melalui <strong>Hubungi Kami</strong> agar kami dapat memproses ke maskapai dan memperbarui statusnya.</p>
      </>),
    },
    {
      q: 'Kenapa refund saya memakan waktu lama / berbeda dari estimasi?',
      a: (<>
        <p><strong>Penyebab proses lama:</strong> kebijakan & waktu proses tiap maskapai berbeda, volume pengajuan tinggi (musim liburan/gangguan operasional), serta waktu proses bank/penyedia pembayaran.</p>
        <p><strong>Penyebab dana berbeda dari estimasi:</strong> perubahan kebijakan refund maskapai saat proses berlangsung, perubahan nilai tukar mata uang, dan biaya transfer yang dikenakan bank.</p>
      </>),
    },
    {
      q: 'Apa itu Surat Keterangan Keterlambatan Penerbangan?',
      a: (<>
        <p>Jika penerbangan mengalami perubahan saat Anda sudah tiba di bandara, Anda mungkin berhak mendapat refund — namun memerlukan <strong>Surat Keterangan Keterlambatan Penerbangan</strong>, yaitu dokumen resmi dari maskapai yang mengonfirmasi perubahan (memuat durasi & alasan keterlambatan). Tanpa surat ini pengajuan bisa ditolak atau lebih lama.</p>
        <p><strong>Cara mendapatkannya:</strong> kunjungi counter/petugas maskapai di bandara, sertakan detail penerbangan (nomor penerbangan, tanggal, atau tunjukkan e-tiket). Setelah mendapat surat, unggah sebagai bukti saat mengajukan refund.</p>
      </>),
    },
    {
      q: 'Saya error / tidak menerima kode verifikasi saat mengajukan refund',
      a: (<>
        <p>Pastikan Anda login dengan alamat email yang digunakan saat pemesanan, dan email tersebut dimasukkan untuk verifikasi refund. Jika masih bermasalah atau muncul pesan error, silakan hubungi kami melalui <strong>Hubungi Kami</strong> untuk bantuan lebih lanjut.</p>
      </>),
    },
  ],

  reschedule: [
    {
      q: 'Apa perbedaan Regular Reschedule dan Reschedule+?',
      a: (<>
        <p>Terdapat dua jenis reschedule: <strong>Regular Reschedule</strong> dan <strong>Reschedule+</strong>.</p>
        <div className="not-prose mt-2 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left font-bold px-3 py-2">Fitur</th>
                <th className="font-bold px-3 py-2">Regular</th>
                <th className="font-bold px-3 py-2 text-sky-600">Reschedule+</th>
              </tr>
            </thead>
            <tbody>
              {[['Ganti waktu penerbangan', true, true], ['Ganti maskapai', false, true], ['Ganti destinasi', false, true]].map(([f, a, b]) => (
                <tr key={f} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-700">{f}</td>
                  <td className="px-3 py-2 text-center">{a ? <Check className="w-4 h-4 text-emerald-500 inline" /> : <XIcon className="w-4 h-4 text-red-400 inline" />}</td>
                  <td className="px-3 py-2 text-center">{b ? <Check className="w-4 h-4 text-emerald-500 inline" /> : <XIcon className="w-4 h-4 text-red-400 inline" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2">Jika penerbangan memenuhi syarat Reschedule+, Anda tidak perlu lagi memilih tipe reschedule saat pengajuan. Cek kelayakan di bagian <strong>Kebijakan Reschedule</strong> saat pemesanan.</p>
      </>),
    },
    {
      q: 'Apa saja keunggulan Reschedule+?',
      a: (<>
        <p>Jika penerbangan memenuhi syarat Reschedule+, Anda bisa mengubah <strong>jadwal, rute, dan maskapai</strong>. ArahInn.com juga membantu menemukan penerbangan yang lebih murah. Saat membandingkan harga, Anda bisa melihat:</p>
        <ul>
          <li>Penerbangan tanpa biaya tambahan.</li>
          <li>Penerbangan yang mengharuskan membayar selisih harga (jika lebih mahal).</li>
          <li>Penerbangan yang lebih murah dari tiket awal dan mungkin disertai cashback.</li>
        </ul>
      </>),
    },
    {
      q: 'Bagaimana cara mengganti rute / jadwal penerbangan?',
      a: (<>
        <ol>
          <li>Buka <strong>Pesanan</strong> → e-tiket yang ingin diubah → ketuk <strong>Reschedule</strong> (cek ketersediaan).</li>
          <li>Ketuk <strong>Ketentuan</strong>, baca, lalu <strong>Ajukan Reschedule</strong>. Pilih penerbangan & penumpang, setujui kebijakan, ketuk Lanjutkan.</li>
          <li>Isi detail penerbangan baru & pilih penerbangan. Cek tarif baru: jika lebih tinggi Anda bayar selisih; jika lebih rendah, surplus dikembalikan ke metode pembayaran awal. Ketuk Lanjut ke Pembayaran.</li>
          <li>Pilih metode pembayaran dan lakukan pembayaran. E-tiket baru muncul di menu Pesanan & email dalam <strong>60 menit</strong> setelah pembayaran diterima.</li>
        </ol>
        <p>Saat ini pengubahan rute via <em>Easy Reschedule</em> hanya tersedia untuk penerbangan domestik tertentu di Indonesia.</p>
      </>),
    },
    {
      q: 'Bisakah reschedule setelah tanggal penerbangan lewat?',
      a: (<>
        <p>Ya, selama belum melewati <strong>masa berlaku tiket</strong> (berbeda tiap maskapai). Mungkin dikenakan biaya, namun untuk tiket fleksibel biaya ini umumnya lebih murah dari biaya reschedule reguler maskapai yang sama. Detail dapat dilihat di e-tiket melalui Reschedule → Baca Ketentuan.</p>
      </>),
    },
    {
      q: 'Apakah bisa reschedule setelah check-in online?',
      a: (<>
        <p>Tidak. Anda tidak dapat mengubah atau membatalkan pesanan setelah check-in online selesai. Silakan baca kebijakan Check-in Online untuk informasi lengkap.</p>
      </>),
    },
    {
      q: 'Bagaimana mendapatkan e-tiket baru & cek status reschedule?',
      a: (<>
        <p>Jika diajukan via Easy Reschedule, e-tiket baru langsung dikirim ke email Anda (periksa inbox & junk/spam) dan dapat diakses melalui <strong>Pesanan Saya</strong>.</p>
        <p><strong>Cek status:</strong> login → akun di kanan atas → <strong>Pesanan Saya</strong> → pilih pesanan → <strong>Details</strong>. Jika berhasil, status berubah menjadi <strong>Reschedule Completed</strong> dan e-tiket terbaru dikirim ke email Anda.</p>
      </>),
    },
    {
      q: 'Penerbangan saya diubah oleh maskapai, apa yang harus dilakukan?',
      a: (<>
        <p>Jika Anda menerima pengumuman perubahan jadwal dari maskapai yang belum diinformasikan ArahInn.com, Anda dapat menerimanya sebagai pengumuman resmi. Periksa/refresh email Anda; mohon tunggu <strong>3 jam</strong> untuk informasi terbaru sebelum menghubungi kami.</p>
        <p>Jika berencana refund, pilih alasan <strong>Rescheduled by Airline</strong>. Jenis pengembalian dana dan nominal refund tergantung kebijakan maskapai. Perubahan jadwal & pesawat merupakan kebijakan penuh maskapai.</p>
      </>),
    },
    {
      q: 'Tidak dapat mengajukan reschedule karena fitur bermasalah',
      a: (<>
        <p>Jika mengalami kendala saat mengajukan penjadwalan ulang di aplikasi, Anda dapat mengajukan permintaan melalui <strong>Hubungi Kami</strong> dan tim kami akan membantu memprosesnya.</p>
      </>),
    },
  ],

  pembatalan: [
    {
      q: 'Penerbangan dibatalkan setelah check-in online',
      a: (<>
        <p>Jika Anda berada dalam situasi ini, silakan hubungi maskapai terkait. Untuk kasus seperti ini, umumnya Anda berhak mendapatkan refund.</p>
      </>),
    },
    {
      q: 'Saya ingin konfirmasi pembatalan dari maskapai',
      a: (<>
        <p>Jika Anda menerima pengumuman pembatalan dari maskapai yang belum diinformasikan ArahInn.com, Anda boleh menerimanya sebagai pengumuman resmi. Periksa/refresh email untuk detail terbaru; mohon tunggu <strong>3 jam</strong> sebelum menghubungi kami.</p>
        <p>Untuk refund, pilih alasan <strong>Canceled by Airline</strong> agar kami dapat mengajukan permohonan refund ke maskapai sesuai alasan tersebut. Jenis pengembalian dana dan nominal refund tergantung kebijakan maskapai.</p>
      </>),
    },
    {
      q: 'Saya sudah mengajukan permohonan refund ke maskapai',
      a: (<>
        <p>Jika Anda sudah mengajukan refund atau memperoleh persetujuan dari maskapai, mohon hubungi kami dengan mengajukan refund melalui <strong>Pesanan Saya</strong> di aplikasi ArahInn.com atau melalui email. Pilih menu Refund dan pilih alasan refund yang sesuai.</p>
      </>),
    },
    {
      q: 'Penerbangan saya dibatalkan maskapai',
      a: (<>
        <p>Karena kendala operasional atau cuaca buruk, maskapai dapat mengubah jadwal (reschedule) maupun membatalkan penerbangan demi keamanan perjalanan. Jika ini terjadi, ArahInn.com biasanya mengirim notifikasi melalui e-tiket, Email, WhatsApp, dan kanal lain yang tersedia.</p>
        <div className="not-prose flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 mt-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-800 leading-relaxed">Dalam notifikasi tersebut tersedia solusi alternatif untuk reschedule atau refund (jika tersedia). Untuk perubahan yang termasuk kategori <strong>signifikan</strong>, Anda bisa mendapat kebijakan khusus seperti <strong>refund penuh</strong> dan <strong>pengajuan reschedule gratis</strong>.</p>
        </div>
      </>),
    },
  ],
}
