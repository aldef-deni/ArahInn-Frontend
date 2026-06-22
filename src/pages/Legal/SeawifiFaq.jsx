import { useState, useEffect } from 'react'
import {
  Wifi, Info, CreditCard, Smartphone, RefreshCw, Wallet, MapPin,
  Phone, Mail, MessageCircle, ArrowUp, List, X, HelpCircle,
} from 'lucide-react'
import SEO from '@/components/SEO'

const SEAWIFI_AREAS = ['Cafetaria', 'Area Outdoor', 'Salon Makan', 'Area Hall Informasi', 'Area Seat Ekonomi']

// ── Daftar isi (TOC) ──────────────────────────────────────────────
const SECTIONS = [
  { id: 'tentang',  label: 'Tentang & Cara Akses', Icon: Info },
  { id: 'paket',    label: 'Paket & Durasi',       Icon: CreditCard },
  { id: 'perangkat',label: 'Perangkat & Lokasi',   Icon: Smartphone },
  { id: 'koneksi',  label: 'Koneksi & Refund',     Icon: RefreshCw },
]

// ── Isi FAQ (dari dokumen resmi SEAWIFI – Kapal PELNI) ─────────────
const FAQS = {
  tentang: [
    {
      q: 'Apa itu SEAWIFI?',
      a: <p><strong>SEAWIFI</strong> adalah layanan akses internet <strong>berbayar</strong> di Kapal PELNI untuk penumpang, dengan berbagai pilihan paket internet.</p>,
    },
    {
      q: 'Bagaimana cara mengakses SEAWIFI?',
      a: (
        <>
          <p>Langkahnya:</p>
          <ol>
            <li>Aktifkan wifi di gadget dan pilih jaringan <strong>‘SEAWIFI’</strong>.</li>
            <li>Masukkan <strong>nomor WhatsApp</strong> yang terdaftar pada gadget.</li>
            <li>Bayar paket internet pilihanmu melalui <strong>online payment</strong> atau <strong>Toko Kapal</strong> terdekat.</li>
          </ol>
        </>
      ),
    },
  ],
  paket: [
    {
      q: 'Berapa harga paket internet SEAWIFI?',
      a: (
        <>
          <div className="not-prose space-y-2 my-2">
            {[
              ['Paket 4 jam', '8 Mbps', 'Rp 30.000'],
              ['Paket 6 jam', '10 Mbps', 'Rp 40.000'],
              ['Paket 12 jam', '6 Mbps', 'Rp 50.000'],
            ].map(([dur, spd, price]) => (
              <div key={dur} className="flex items-center justify-between rounded-xl bg-cyan-50 border border-cyan-100 px-3.5 py-2.5">
                <div>
                  <p className="text-sm font-bold text-cyan-800">{dur}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1"><Wifi className="w-3 h-3" /> {spd}</p>
                </div>
                <span className="text-sm font-extrabold text-cyan-700">{price}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Pembelian di <strong>Toko Kapal</strong> dikenakan tambahan <strong>biaya admin Rp 5.000</strong>.</p>
        </>
      ),
    },
    {
      q: 'Berapa lama masa berlaku paket internet SEAWIFI?',
      a: <p>Bergantung pada paket yang dipilih. Setelah diaktifkan, paket <strong>terus berjalan sesuai durasi</strong> yang tertera — kamu <strong>tidak dapat menonaktifkan sementara</strong> paket yang sedang aktif.</p>,
    },
  ],
  perangkat: [
    {
      q: 'Apakah paket SEAWIFI bisa digunakan di perangkat lain?',
      a: <p><strong>Tidak.</strong> Akses internet SEAWIFI hanya bisa digunakan pada perangkat dengan <strong>nomor yang kamu daftarkan</strong> sebelumnya.</p>,
    },
    {
      q: 'Apakah SEAWIFI bisa digunakan di seluruh lokasi Kapal PELNI?',
      a: (
        <>
          <p>Akses internet SEAWIFI optimal pada area-area strategis berikut:</p>
          <div className="not-prose flex flex-wrap gap-2 mt-2">
            {SEAWIFI_AREAS.map(area => (
              <span key={area} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-700 text-xs font-semibold">
                <MapPin className="w-3 h-3" /> {area}
              </span>
            ))}
          </div>
        </>
      ),
    },
  ],
  koneksi: [
    {
      q: 'Bagaimana jika koneksi internet SEAWIFI terputus?',
      a: (
        <>
          <p>Beberapa tips agar koneksi tidak terputus:</p>
          <ul>
            <li>Pastikan <strong>durasi paket masih tersedia</strong> — cek berkala lewat landing page SEAWIFI atau customer care SEAWIFI di WhatsApp.</li>
            <li><strong>Restart</strong> jaringan wifi di gadget, pilih kembali jaringan ‘SEAWIFI’, lalu <strong>login ulang</strong> dengan nomor WhatsApp yang terdaftar.</li>
            <li>Atau berkonsultasi dengan <strong>customer care SEAWIFI</strong>, atau datangi <strong>Toko Kapal</strong> terdekat.</li>
          </ul>
        </>
      ),
    },
    {
      q: 'Apakah paket SEAWIFI bisa di-refund setelah dibeli?',
      a: <p>Paket yang sudah dibeli <strong>tidak dapat di-refund</strong>. Namun jika paket tidak terkoneksi, durasi penggunaan akan <strong>berhenti otomatis oleh sistem</strong>, sehingga paket masih bisa digunakan sampai durasi aktif penggunaan internet habis.</p>,
    },
  ],
}

export default function SeawifiFaq() {
  const [activeId, setActiveId] = useState('tentang')
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [mobileTocOpen, setMobileTocOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 600)
      const offsets = SECTIONS.map(s => {
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
        title="FAQ SEAWIFI — Internet di Kapal PELNI"
        description="Pertanyaan umum seputar SEAWIFI — layanan internet berbayar selama perjalanan di Kapal PELNI: cara akses, paket & harga, durasi, lokasi, koneksi, dan refund."
        url="/kapal-laut/seawifi"
        type="article"
      />

      {/* ── Hero header (tema laut) ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-800 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
        <div className="container relative py-8 sm:py-12 lg:py-16 flex flex-col items-center text-center">
          <div className="bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 shadow-xl mb-4 sm:mb-6">
            <img src="/logo-arahin.png" alt="ArahInn" className="h-8 sm:h-10 md:h-12 w-auto" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold mb-3">
            <Wifi className="w-3.5 h-3.5" /> Wifi Kapal · SEAWIFI
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mb-2 sm:mb-3 leading-tight">
            FAQ SEAWIFI
          </h1>
          <p className="text-white/80 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed px-2">
            Informasi layanan internet berbayar <span className="font-semibold">SEAWIFI</span> selama perjalanan di Kapal PELNI — cara akses, paket & harga, hingga koneksi.
          </p>
        </div>
      </section>

      {/* ── Konten + TOC ─────────────────────────────────────────────── */}
      <section className="container py-6 sm:py-10 lg:py-16">
        <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-10">

          {/* TOC sidebar (desktop) */}
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Daftar Isi</p>
              <nav className="space-y-1">
                {SECTIONS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                      activeId === id
                        ? 'bg-cyan-50 text-cyan-600 font-bold border-l-2 border-cyan-500'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Konten */}
          <article className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-5 sm:p-7 md:p-10 shadow-sm faq-content">
            {SECTIONS.map(({ id, label, Icon }) => (
              <section key={id} id={id} className="mb-8 sm:mb-10 last:mb-0">
                <div className="flex items-center gap-2.5 sm:gap-3 pb-2.5 sm:pb-3 mb-4 sm:mb-5 border-b border-slate-200">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600" />
                  </div>
                  <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-tight">{label}</h2>
                </div>
                <div className="space-y-3">
                  {FAQS[id].map((item, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 bg-white hover:border-cyan-200 transition-colors p-4 sm:p-5">
                      <p className="font-bold text-slate-900 text-sm sm:text-[15px] flex items-start gap-2 mb-2 !text-left">
                        <span className="w-6 h-6 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5"><HelpCircle className="w-3.5 h-3.5" /></span>
                        <span>{item.q}</span>
                      </p>
                      <div className="text-sm text-slate-600 leading-relaxed pl-8">{item.a}</div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* ── Kontak ──────────────────────────────────────────── */}
            <div className="mt-10 sm:mt-12 bg-gradient-to-br from-cyan-500/5 via-blue-50 to-cyan-50 border border-cyan-500/20 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8">
              <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 mb-1.5 sm:mb-2 !mt-0">Butuh Bantuan?</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-5 sm:mb-6">Pertanyaan seputar pemesanan tiket kapal laut di ArahInn? Tim kami siap membantu.</p>
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
                  className="flex items-center gap-3 p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-cyan-400 hover:shadow-md active:scale-[0.98] transition-all group">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-cyan-100 flex items-center justify-center group-hover:bg-cyan-500 shrink-0 transition-colors">
                    <Phone className="w-5 h-5 text-cyan-600 group-hover:text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Telepon</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">+62 851-8813-6009</p>
                  </div>
                </a>
              </div>
              <p className="mt-4 text-[11px] sm:text-xs text-slate-500 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-cyan-600 shrink-0" /> SEAWIFI adalah layanan pihak ketiga di Kapal PELNI — pembayaran & dukungan teknis melalui customer care SEAWIFI di kapal.
              </p>
            </div>

            <p className="mt-6 sm:mt-8 text-center text-[11px] sm:text-xs text-slate-400 leading-relaxed px-2">
              Sumber: dokumen resmi FAQ SEAWIFI (Kapal PELNI). Ketentuan & tarif dapat berubah sewaktu-waktu.
            </p>
          </article>
        </div>
      </section>

      {/* ── Tombol TOC mengambang (mobile) ───────────────── */}
      <button
        onClick={() => setMobileTocOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-40 h-12 px-4 rounded-full bg-white text-cyan-600 border border-slate-200 shadow-lg active:scale-95 transition-all flex items-center gap-2"
        aria-label="Buka daftar isi"
      >
        <List className="w-4 h-4" />
        <span className="text-xs font-bold">Daftar Isi</span>
      </button>

      {/* ── TOC bottom sheet (mobile) ─────────────────────────────────── */}
      {mobileTocOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end" onClick={() => setMobileTocOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()} className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col">
            <div className="shrink-0 px-5 pt-3 pb-2">
              <div className="mx-auto w-10 h-1 rounded-full bg-slate-300 mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Navigasi</p>
                  <h3 className="font-display text-lg font-bold text-slate-900">Daftar Isi</h3>
                </div>
                <button onClick={() => setMobileTocOpen(false)} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center" aria-label="Tutup">
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
            <nav className="overflow-y-auto px-3 pb-6 space-y-1">
              {SECTIONS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                    activeId === id ? 'bg-cyan-50 text-cyan-600 font-bold' : 'text-slate-700 active:bg-slate-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    activeId === id ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Scroll-to-top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-cyan-500 text-white shadow-lg hover:bg-cyan-600 hover:shadow-xl active:scale-95 transition-all flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}

      <style>{`
        .faq-content section { scroll-margin-top: 80px; }
        @media (min-width: 640px) { .faq-content section { scroll-margin-top: 100px; } }
        .faq-content p { margin-bottom: 0.6rem; }
        .faq-content p:last-child { margin-bottom: 0; }
        .faq-content ul, .faq-content ol { padding-left: 1.15rem; margin: 0.4rem 0 0.6rem; }
        .faq-content ul { list-style-type: disc; }
        .faq-content ol { list-style-type: decimal; }
        .faq-content li { margin-bottom: 0.4rem; }
        .faq-content strong { color: #0f172a; font-weight: 700; }
        .faq-content a { color: #0891b2; font-weight: 600; }
        .faq-content a:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}
