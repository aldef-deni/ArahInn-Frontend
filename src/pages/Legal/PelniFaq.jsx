import { useState, useEffect } from 'react'
import {
  Ship, Ticket, Users, Utensils, RefreshCw, Package, ShieldCheck,
  Phone, Mail, MessageCircle, ArrowUp, List, X, HelpCircle, Anchor,
} from 'lucide-react'
import SEO from '@/components/SEO'

const PELNI_PHONE = '021-162'
const PELNI_WA = '0811-162-1-162'

// ── Daftar isi (TOC) ──────────────────────────────────────────────
const SECTIONS = [
  { id: 'tarif',      label: 'Tarif & Penumpang',     Icon: Users },
  { id: 'fasilitas',  label: 'Fasilitas',             Icon: Utensils },
  { id: 'pemesanan',  label: 'Pemesanan & E-Tiket',   Icon: Ticket },
  { id: 'pembatalan', label: 'Pembatalan & Perubahan',Icon: RefreshCw },
  { id: 'bagasi',     label: 'Bagasi & Barang',       Icon: Package },
  { id: 'bantuan',    label: 'Bantuan & Data Pribadi',Icon: ShieldCheck },
]

// ── Isi FAQ (dari dokumen resmi PELNI) ────────────────────────────
const FAQS = {
  tarif: [
    {
      q: 'Ada berapa kategori tarif penumpang Kapal PELNI?',
      a: (
        <>
          <p>Kategori tarif penumpang Kapal PELNI ada <strong>2</strong>:</p>
          <ul>
            <li><strong>Bayi</strong> — usia 0 s.d 23 bulan (di bawah 2 tahun) dikenakan <strong>10%</strong> dari tarif dewasa.</li>
            <li><strong>Dewasa</strong> — usia 24 bulan (2 tahun) ke atas dikenakan tarif <strong>100%</strong>.</li>
          </ul>
        </>
      ),
    },
    {
      q: 'Ada berapa tipe kamar kelas dan maksimal jumlah penumpang?',
      a: (
        <>
          <p>Tipe kamar kelas dan kapasitas penumpangnya:</p>
          <div className="not-prose grid grid-cols-2 gap-2 my-2">
            {[['Kelas 1A', '2 dewasa'], ['Kelas 1B', '4 dewasa'], ['Kelas 2A', '6 dewasa'], ['Kelas 2B', '8 dewasa']].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-xl bg-cyan-50 border border-cyan-100 px-3 py-2">
                <span className="text-sm font-bold text-cyan-800">{k}</span>
                <span className="text-xs font-semibold text-slate-600">{v}</span>
              </div>
            ))}
          </div>
          <p>1 penumpang dewasa maksimal membawa <strong>2 bayi</strong>.</p>
        </>
      ),
    },
    {
      q: 'Berapa banyak penumpang yang dapat dipesan dalam satu reservasi?',
      a: <p>Maksimal <strong>10 penumpang</strong> dapat dipesan dalam satu kali reservasi.</p>,
    },
  ],
  fasilitas: [
    {
      q: 'Apa saja fasilitas yang didapatkan penumpang selama berlayar?',
      a: <p>Penumpang mendapatkan fasilitas sesuai tiket yang dibeli (<strong>Kabin Ekonomi</strong> atau <strong>Kamar Kelas</strong>) serta <strong>makan 3× sehari</strong> selama dalam pelayaran.</p>,
    },
  ],
  pemesanan: [
    {
      q: 'Berapa lama sebelum keberangkatan tiket bisa dipesan?',
      a: <p>Tiket harus dipesan dan dibeli <strong>maksimal 1 hari</strong> sebelum jadwal keberangkatan.</p>,
    },
    {
      q: 'Apakah E-Tiket berlaku sebagai tiket?',
      a: <p><strong>Tidak.</strong> E-Tiket wajib ditukarkan menjadi <strong>Tiket asli kapal laut dan/atau Boarding Pass</strong> di cabang/pelabuhan keberangkatan, mulai <strong>24 jam</strong> sebelum keberangkatan kapal.</p>,
    },
    {
      q: 'Dokumen apa saja yang perlu dibawa saat check-in?',
      a: <p>Kartu identitas berupa <strong>KTP/Kartu Keluarga</strong> (WNI) atau <strong>Paspor</strong> (WNA), beserta <strong>e-tiket</strong> untuk ditukarkan menjadi Tiket dan/atau Boarding Pass.</p>,
    },
  ],
  pembatalan: [
    {
      q: 'Bagaimana cara pembatalan tiket dan berapa biayanya?',
      a: <p>Saat ini pembatalan tiket dilayani melalui <strong>loket PELNI Cabang</strong>, dengan biaya pembatalan sebesar <strong>50% dari Tarif Dasar</strong>.</p>,
    },
    {
      q: 'Bisakah mengubah jadwal atau rute kapal? Berapa biayanya?',
      a: (
        <>
          <p>Bisa, melalui <strong>Loket Cabang PELNI terdekat</strong> dengan membawa e-tiket dan kartu identitas asli (KTP/Paspor). Ketentuan:</p>
          <ul>
            <li>Paling lambat <strong>5 jam</strong> sebelum keberangkatan dan penumpang <strong>belum mencetak boarding pass</strong> ataupun boarding.</li>
            <li>Dikenakan biaya administrasi <strong>10%</strong> dari tarif dasar tiket sebelumnya, <strong>ditambah tarif tiket baru</strong>.</li>
            <li>Jika tarif tiket sebelumnya lebih tinggi dari tarif tiket baru, <strong>tidak ada pengembalian</strong> selisih biaya.</li>
          </ul>
        </>
      ),
    },
    {
      q: 'Bisakah pindah kelas (upgrade)? Berapa biayanya?',
      a: <p>Penumpang dapat pindah kelas dari Ekonomi ke <strong>Kelas 1 atau Kelas 2</strong> (suplisi/upgrade kelas) dengan biaya administrasi <strong>Rp10.000</strong>.</p>,
    },
  ],
  bagasi: [
    {
      q: 'Berapa besaran bagasi bebas (free baggage) yang boleh dibawa?',
      a: <p>Setiap penumpang dapat membawa bagasi bebas maksimal <strong>40 kg</strong> dengan dimensi maksimal <strong>70 × 40 × 35 cm</strong>.</p>,
    },
    {
      q: 'Jika barang melebihi kapasitas, apakah ada biaya tambahan?',
      a: <p>Ya. Barang yang melebihi kapasitas dikenakan <strong>tarif over bagasi</strong> sesuai syarat dan ketentuan yang berlaku.</p>,
    },
    {
      q: 'Barang apa saja yang tidak boleh dibawa selama berlayar?',
      a: (
        <>
          <p>Penumpang dilarang membawa:</p>
          <ul>
            <li>Binatang; tanaman yang dilarang karantina pelabuhan.</li>
            <li>Narkotika, psikotropika, dan zat adiktif lainnya.</li>
            <li>Senjata api dan senjata tajam.</li>
            <li>Barang yang mudah terbakar/meledak.</li>
            <li>Barang berbau busuk/amis atau yang dapat mengganggu kesehatan & kenyamanan penumpang lain.</li>
            <li>Barang yang melebihi batas ketentuan bagasi (berat/volume) menurut petugas boarding.</li>
            <li>Barang yang dilarang oleh peraturan perundang-undangan.</li>
          </ul>
        </>
      ),
    },
    {
      q: 'Bagaimana jika barang tertinggal di kapal?',
      a: (
        <p>
          Hubungi contact center PT PELNI (Persero): telepon <a href={`tel:${PELNI_PHONE.replace(/\D/g, '')}`}>{PELNI_PHONE}</a> / WhatsApp <a href={`https://wa.me/62${PELNI_WA.replace(/\D/g, '').replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer">{PELNI_WA}</a>. Catatan: PT PELNI tidak bertanggung jawab atas kehilangan barang.
        </p>
      ),
    },
  ],
  bantuan: [
    {
      q: 'Ada kendala/keluhan terkait data pribadi atau pemesanan tiket?',
      a: <p>Hubungi contact center PT PELNI (Persero): telepon <a href={`tel:${PELNI_PHONE.replace(/\D/g, '')}`}>{PELNI_PHONE}</a> / WhatsApp <a href={`https://wa.me/62${PELNI_WA.replace(/\D/g, '').replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer">{PELNI_WA}</a>.</p>,
    },
    {
      q: 'Apakah data pribadi penumpang tersimpan aman?',
      a: <p>Ya. Data pribadi dijamin keamanannya, dan PT PELNI (Persero) berkomitmen melaksanakan <strong>UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP)</strong>.</p>,
    },
  ],
}

export default function PelniFaq() {
  const [activeId, setActiveId] = useState('tarif')
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
        title="FAQ Tiket Kapal Laut (PELNI)"
        description="Pertanyaan umum seputar tiket kapal laut PELNI di ArahInn — tarif penumpang, kelas kamar, e-tiket, pembatalan, perubahan jadwal, bagasi, dan ketentuan perjalanan laut."
        url="/kapal-laut/faq"
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
            <Ship className="w-3.5 h-3.5" /> Tiket Kapal Laut · PELNI
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mb-2 sm:mb-3 leading-tight">
            FAQ Tiket Kapal Laut
          </h1>
          <p className="text-white/80 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed px-2">
            Pertanyaan umum seputar pemesanan tiket <span className="font-semibold">Kapal PELNI</span> — tarif, kelas kamar, e-tiket, pembatalan, perubahan jadwal, hingga bagasi.
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
                <Anchor className="w-3.5 h-3.5 text-cyan-600 shrink-0" /> Contact center PT PELNI (Persero): {PELNI_PHONE} · WA {PELNI_WA}
              </p>
            </div>

            <p className="mt-6 sm:mt-8 text-center text-[11px] sm:text-xs text-slate-400 leading-relaxed px-2">
              Sumber: dokumen resmi FAQ Ticketing PT PELNI (Persero). Ketentuan dapat berubah sewaktu-waktu.
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
        .faq-content ul { padding-left: 1.15rem; margin: 0.4rem 0 0.6rem; list-style-type: disc; }
        .faq-content ul li { margin-bottom: 0.4rem; }
        .faq-content strong { color: #0f172a; font-weight: 700; }
        .faq-content a { color: #0891b2; font-weight: 600; }
        .faq-content a:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}
