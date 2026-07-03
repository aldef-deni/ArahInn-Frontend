import { useState, useEffect } from 'react'
import {
  XCircle, UserCog, CalendarClock, Phone, Mail, MapPin, ArrowUp, TrainFront, ShieldCheck,
} from 'lucide-react'
import SEO from '@/components/SEO'

const SECTIONS = [
  { id: 'pembatalan', label: 'Pembatalan & Refund', Icon: XCircle },
  { id: 'koreksi',    label: 'Koreksi Data Penumpang', Icon: UserCog },
  { id: 'jadwal',     label: 'Ubah Jadwal', Icon: CalendarClock },
]

// Stasiun yang melayani pembatalan/refund tiket kereta (per Daop/Divre).
const STATIONS = [
  ['Daop 1 Jakarta', 'Serang, Rangkasbitung, Gambir, Pasar Senen, Bogor, Bekasi, dan Cikampek'],
  ['Daop 2 Bandung', 'Purwakarta, Bandung, Kiaracondong, Tasikmalaya, dan Banjar'],
  ['Daop 3 Cirebon', 'Cirebon, Cirebon Prujakan, Jatibarang dan Brebes'],
  ['Daop 4 Semarang', 'Tegal, Pekalongan, Semarang Poncol, Semarang Tawang dan Cepu'],
  ['Daop 5 Purwokerto', 'Purwokerto, Kroya, Cilacap dan Kutoarjo'],
  ['Daop 6 Yogyakarta', 'Yogyakarta, Lempuyangan dan Solobalapan'],
  ['Daop 7 Madiun', 'Madiun, Kertosono, Kediri, Jombang dan Blitar'],
  ['Daop 8 Surabaya', 'Surabaya Gubeng, Surabaya Pasarturi, Sidoarjo, Malang, Mojokerto, dan Bojonegoro'],
  ['Daop 9 Jember', 'Banyuwangi Baru, Kalibaru, Jember, Probolinggo dan Pasuruan'],
  ['Divre I Sumatera Utara', 'Medan, Tebingtinggi, Siantar, Tanjungbalai, Kisaran dan Rantauprapat'],
  ['Divre II Sumatera Barat', 'Padang'],
  ['Divre III Palembang', 'Kertapati, Prambulih dan Lubuklinggau'],
  ['Divre IV Tanjungkarang', 'Baturaja, Kotabumi, Tanjungkarang'],
]

export default function TrainTerms() {
  const [activeId, setActiveId] = useState('pembatalan')
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 600)
      const offs = SECTIONS.map(s => { const el = document.getElementById(s.id); return { id: s.id, top: el ? el.getBoundingClientRect().top : Infinity } })
      const active = offs.filter(o => o.top <= 160).pop()
      if (active) setActiveId(active.id)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (!el) return
    window.scrollTo({ top: el.offsetTop - (window.innerWidth < 1024 ? 80 : 100), behavior: 'smooth' })
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen">
      <SEO
        title="Syarat & Ketentuan Tiket Kereta Api (KAI)"
        description="Ketentuan pembatalan, refund, koreksi data penumpang, dan perubahan jadwal tiket kereta api (KAI) di ArahInn — syarat, biaya, prosedur di stasiun, dan kontak resmi PT KAI."
        url="/tiket/kereta/syarat-ketentuan"
        type="article"
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-amber-700 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="container relative py-8 sm:py-12 lg:py-14 flex flex-col items-center text-center">
          <div className="bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 shadow-xl mb-4 sm:mb-6">
            <img src="/logo-arahin.png" alt="ArahInn" className="h-8 sm:h-10 w-auto" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold mb-3">
            <TrainFront className="w-3.5 h-3.5" /> Tiket Kereta Api · KAI
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2 leading-tight">Syarat &amp; Ketentuan</h1>
          <p className="text-white/85 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed px-2">
            Ketentuan pembatalan, refund, koreksi data penumpang, dan perubahan jadwal tiket kereta api sesuai kebijakan PT KAI.
          </p>
        </div>
      </section>

      {/* Main */}
      <section className="container py-6 sm:py-10 lg:py-14">
        <div className="grid lg:grid-cols-[240px_1fr] gap-6 lg:gap-10">
          {/* TOC */}
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Daftar Isi</p>
              <nav className="space-y-1">
                {SECTIONS.map(({ id, label, Icon }) => (
                  <button key={id} onClick={() => scrollTo(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${activeId === id ? 'bg-orange-50 text-orange-600 font-bold border-l-2 border-orange-500' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                    <Icon className="w-4 h-4 shrink-0" /><span className="truncate">{label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="min-w-0 tt-body space-y-8 sm:space-y-10">

            {/* 1. Pembatalan & Refund */}
            <section id="pembatalan" className="scroll-mt-24">
              <Head Icon={XCircle} title="Pembatalan & Refund Tiket" />
              <p>Jika Anda tidak dapat melakukan perjalanan, tiket kereta api dapat dibatalkan dan dananya dikembalikan (refund) melalui proses yang dilakukan langsung di stasiun. Tidak perlu datang ke stasiun keberangkatan — cukup kunjungi stasiun yang menyediakan layanan pembatalan tiket.</p>

              <Card title="Syarat Pembatalan Tiket">
                <ul>
                  <li>Pembatalan hanya dapat diajukan paling lambat <strong>60 menit sebelum</strong> waktu keberangkatan sebagaimana tercantum pada tiket.</li>
                  <li>Penumpang wajib menunjukkan <strong>e-tiket</strong> atau bukti pemesanan tiket.</li>
                  <li>Wajib membawa <strong>identitas asli</strong> yang sah (KTP, SIM, paspor, atau kartu pelajar/mahasiswa bagi penumpang di bawah 17 tahun).</li>
                  <li>Jika pembatalan diwakilkan, pihak yang mewakili wajib membawa <strong>surat kuasa bermaterai Rp10.000</strong> yang ditandatangani penumpang, serta identitas asli dan fotokopi dari penumpang dan pihak yang mewakili.</li>
                  <li>Untuk satu kode booking dengan beberapa penumpang, apabila seluruh tiket akan dibatalkan, cukup melampirkan fotokopi identitas atau surat kuasa dari salah satu penumpang.</li>
                </ul>
              </Card>

              <Card title="Ketentuan Refund & Pengembalian Dana">
                <ul>
                  <li>Dikenakan biaya pembatalan sebesar <strong>25% dari harga tiket</strong> dan tidak termasuk biaya layanan atau potongan lainnya.</li>
                  <li>Dana refund dapat diterima melalui <strong>transfer bank</strong> (diinformasikan melalui SMS) atau <strong>tunai</strong> yang dapat diambil di stasiun saat mengajukan.</li>
                  <li>Proses pengembalian dana dapat memakan waktu sekitar <strong>30 (tiga puluh) hari kerja</strong> sejak tanggal pengajuan.</li>
                </ul>
              </Card>

              <Card title="Prosedur Pengajuan di Stasiun">
                <p>Berdasarkan kebijakan PT KAI, refund hanya dapat dilakukan di stasiun. Tidak perlu ke stasiun keberangkatan, melainkan ke salah satu stasiun yang melayani refund:</p>
                <ol>
                  <li>Datangi stasiun yang memiliki konter pembatalan tiket.</li>
                  <li>Isi formulir pembatalan yang tersedia.</li>
                  <li>Lengkapi semua persyaratan yang diperlukan kepada petugas.</li>
                  <li>Petugas akan memproses pembatalan tiket dan refund bersamaan.</li>
                  <li>Simpan bukti pengajuan sebagai arsip pribadi.</li>
                </ol>

                <div className="not-prose mt-4 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm min-w-[520px]">
                    <thead>
                      <tr className="bg-orange-50 text-orange-800">
                        <th className="text-left font-bold px-3 py-2 w-10">No</th>
                        <th className="text-left font-bold px-3 py-2 w-44">Daerah</th>
                        <th className="text-left font-bold px-3 py-2">Stasiun Pembatalan Tiket Kereta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {STATIONS.map(([daop, st], i) => (
                        <tr key={daop} className="border-t border-slate-100 align-top">
                          <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                          <td className="px-3 py-2 font-semibold text-slate-800">{daop}</td>
                          <td className="px-3 py-2 text-slate-600">{st}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="not-prose flex flex-wrap items-center gap-3 mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0" />
                <span className="text-slate-600"><strong className="text-slate-800">Kontak Layanan PT KAI:</strong> Contact Center <strong>121</strong> atau <strong>(+6221) 121</strong> (24 jam) · Email <a href="mailto:cs@kai.id">cs@kai.id</a></span>
              </div>
            </section>

            {/* 2. Koreksi Data Penumpang */}
            <section id="koreksi" className="scroll-mt-24">
              <Head Icon={UserCog} title="Koreksi Data Penumpang" />
              <p>Jika terjadi kesalahan saat memasukkan data penumpang, Anda dapat mengajukan perubahan melalui:</p>
              <ul>
                <li>Telepon ke <strong>021-121</strong>,</li>
                <li>Email ke <a href="mailto:cs@kai.id">cs@kai.id</a>, atau</li>
                <li>Datang langsung ke <strong>Customer Service stasiun keberangkatan</strong>.</li>
              </ul>
              <ul>
                <li>Perubahan harus diajukan <strong>minimal 2 jam sebelum keberangkatan</strong>.</li>
                <li>Persetujuan sepenuhnya merupakan kebijakan PT KAI.</li>
                <li>Siapkan <strong>e-tiket</strong> dan <strong>identitas asli</strong> (KTP/SIM/paspor).</li>
              </ul>
            </section>

            {/* 3. Ubah Jadwal */}
            <section id="jadwal" className="scroll-mt-24">
              <Head Icon={CalendarClock} title="Ubah Jadwal Kereta Api" />
              <p>Perubahan dapat dilakukan untuk jadwal dan kereta berbeda, selama masih tersedia.</p>
              <ul>
                <li>Hanya bisa dilakukan di <strong>loket stasiun</strong>, maksimal <strong>60 menit sebelum keberangkatan</strong>.</li>
                <li>Dikenakan biaya <strong>25% dari tarif</strong> (tidak termasuk biaya pemesanan).</li>
                <li>Jika tarif baru lebih mahal, penumpang membayar selisihnya.</li>
                <li>Jika tarif baru lebih murah, tidak ada pengembalian selisih.</li>
              </ul>
            </section>

            {/* Kontak */}
            <div className="mt-2 bg-gradient-to-br from-orange-500/5 via-amber-50 to-orange-50 border border-orange-500/20 rounded-2xl p-5 sm:p-6 md:p-8">
              <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 mb-1.5">Butuh Bantuan?</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-5">Untuk pertanyaan seputar pemesanan tiket kereta di ArahInn, tim kami siap membantu.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <a href="https://wa.me/6285188136009" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0"><Phone className="w-5 h-5 text-emerald-600" /></div>
                  <div className="min-w-0"><p className="text-[10px] font-bold text-slate-500 uppercase">WhatsApp</p><p className="text-xs sm:text-sm font-bold text-slate-800 truncate">+62 851-8813-6009</p></div>
                </a>
                <a href="mailto:cs@arahinn.com" className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0"><Mail className="w-5 h-5 text-blue-600" /></div>
                  <div className="min-w-0"><p className="text-[10px] font-bold text-slate-500 uppercase">Email</p><p className="text-xs sm:text-sm font-bold text-slate-800 truncate">cs@arahinn.com</p></div>
                </a>
                <a href="mailto:cs@kai.id" className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-slate-200 hover:border-orange-400 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0"><MapPin className="w-5 h-5 text-orange-600" /></div>
                  <div className="min-w-0"><p className="text-[10px] font-bold text-slate-500 uppercase">PT KAI</p><p className="text-xs sm:text-sm font-bold text-slate-800 truncate">121 · cs@kai.id</p></div>
                </a>
              </div>
            </div>

            <p className="mt-6 text-center text-[11px] sm:text-xs text-slate-400 leading-relaxed px-2">
              Ketentuan di atas mengikuti kebijakan resmi PT KAI dan dapat berubah sewaktu-waktu. © {new Date().getFullYear()} ArahInn.com
            </p>
          </div>
        </div>
      </section>

      {showTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center" aria-label="Ke atas">
          <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}

      <style>{`
        .tt-body p { font-size: 0.9rem; line-height: 1.75; color: #475569; margin-bottom: 0.6rem; }
        .tt-body ul, .tt-body ol { padding-left: 1.25rem; margin: 0.3rem 0 0.7rem; }
        .tt-body ul { list-style: disc; } .tt-body ol { list-style: decimal; }
        .tt-body li { font-size: 0.9rem; line-height: 1.7; color: #475569; margin-bottom: 0.35rem; }
        .tt-body strong { color: #0f172a; font-weight: 700; }
        .tt-body a { color: #ea580c; font-weight: 600; } .tt-body a:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}

function Head({ Icon, title }) {
  return (
    <div className="flex items-center gap-2.5 sm:gap-3 mb-4">
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
      </div>
      <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-tight">{title}</h2>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="mt-4 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
      <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-2">{title}</h3>
      {children}
    </div>
  )
}
