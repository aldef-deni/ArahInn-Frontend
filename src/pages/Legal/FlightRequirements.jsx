import { useState, useEffect } from 'react'
import {
  Info, Plane, Landmark, Globe, PlaneLanding, MapPin, Stamp,
  Phone, Mail, MessageCircle, ArrowUp, List, X, AlertCircle,
} from 'lucide-react'
import SEO from '@/components/SEO'

const SECTIONS = [
  { id: 'update',        label: 'Update Terkini',          Icon: Info },
  { id: 'domestik',      label: 'Perjalanan Domestik',     Icon: Plane },
  { id: 'bali',          label: 'Retribusi Wisata Bali',   Icon: Landmark },
  { id: 'internasional', label: 'Perjalanan Internasional', Icon: Globe },
  { id: 'ke-indonesia',  label: 'Penerbangan ke Indonesia', Icon: PlaneLanding },
]

const OPEN_COUNTRIES = [
  'Singapura', 'Turki', 'Jepang', 'Malaysia', 'Filipina', 'Indonesia',
  'Australia', 'Korea Selatan', 'Belanda', 'Amerika Serikat', 'Thailand',
  'Prancis', 'Inggris', 'India', 'Jerman', 'Uni Emirat Arab',
  'Arab Saudi', 'Spanyol', 'Brunei Darussalam', 'Mesir',
]
const PARTIAL_COUNTRIES = ['Makau', 'Ukraina', 'Yordania']

const ENTRY_AIRPORTS = [
  'Bandara Soekarno-Hatta, Tangerang, Banten',
  'Bandara Juanda, Surabaya, Jawa Timur',
  'Bandara I Gusti Ngurah Rai, Denpasar, Bali',
  'Bandara Hang Nadim, Batam, Kepulauan Riau',
  'Bandara Sam Ratulangi, Manado, Sulawesi Utara',
  'Bandara Zainuddin Abdul Madjid, Lombok, Nusa Tenggara Barat',
  'Bandara Kualanamu, Medan, Sumatera Utara',
  'Bandara Sultan Hasanuddin, Makassar, Sulawesi Selatan',
  'Bandara Yogyakarta, Kulon Progo, D.I. Yogyakarta',
  'Bandara Sultan Syarif Kasim II, Riau',
  'Bandara Sultan Iskandar Muda, Aceh',
  'Bandara Minangkabau, Sumatera Barat',
  'Bandara Sultan Aji Muhammad Sulaiman Sepinggan, Kalimantan Timur',
  'Bandara Kertajati, Majalengka, Jawa Barat',
  'Bandara Sentani, Jayapura, Papua',
]

export default function FlightRequirements() {
  const [activeId, setActiveId] = useState('update')
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
        title="Persyaratan Penerbangan"
        description="Informasi protokol kesehatan dan persyaratan perjalanan udara domestik maupun internasional bersama ArahInn — regulasi terkini, destinasi terbuka, dan ketentuan masuk ke Indonesia."
        url="/penerbangan/persyaratan"
        type="article"
      />

      {/* ── Hero header ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-500 via-sky-600 to-blue-800 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        <div className="container relative py-8 sm:py-12 lg:py-16 flex flex-col items-center text-center">
          <div className="bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 shadow-xl mb-4 sm:mb-6">
            <img src="/logo-arahin.png" alt="ArahInn" className="h-8 sm:h-10 md:h-12 w-auto" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold mb-3">
            <Plane className="w-3.5 h-3.5" /> Info Perjalanan Umum
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mb-2 sm:mb-3 leading-tight">
            Persyaratan Penerbangan
          </h1>
          <p className="text-white/80 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed px-2">
            Protokol kesehatan dan ketentuan perjalanan udara <span className="font-semibold">domestik</span> &amp; <span className="font-semibold">internasional</span> — mohon dibaca sebelum keberangkatan.
          </p>
          <p className="mt-3 sm:mt-4 text-[11px] sm:text-xs text-white/60">Diperbarui terakhir: 27 Agustus 2024</p>
        </div>
      </section>

      {/* ── Main content + TOC ───────────────────────────────────────── */}
      <section className="container py-6 sm:py-10 lg:py-16">
        <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-10">

          {/* Desktop TOC sidebar */}
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
                        ? 'bg-sky-50 text-sky-600 font-bold border-l-2 border-sky-500'
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

          {/* Content */}
          <article className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-5 sm:p-7 md:p-10 shadow-sm prose-content">

            {/* Update Terkini */}
            <Section id="update" title="Update Terkini" Icon={Info}>
              <div className="not-prose flex items-start gap-3 p-4 rounded-xl bg-sky-50 border border-sky-100 mb-4">
                <AlertCircle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 text-sm mb-1">Protokol Kesehatan Terbaru Perjalanan Internasional</p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Untuk mencegah penyebaran <em>monkeypox</em> (mpox), per <strong>27 Agustus 2024</strong>, setiap pelaku perjalanan internasional yang masuk ke Indonesia — baik WNI maupun WNA — wajib mengisi <strong>SATUSEHAT Health Pass (SSHP)</strong> sebelum tiba di Indonesia.
                  </p>
                </div>
              </div>
              <p>Halaman ini memuat informasi umum kebijakan perjalanan udara. Ketentuan dapat berubah sewaktu-waktu mengikuti regulasi pemerintah dan kebijakan maskapai. Pastikan Anda memeriksa persyaratan terbaru sebelum keberangkatan.</p>
            </Section>

            {/* Domestik */}
            <Section id="domestik" title="Perjalanan Domestik" Icon={Plane}>
              <h3>Regulasi Umum Berdasarkan Surat Edaran Kasatgas No. 1 Tahun 2023</h3>
              <p>Seluruh pelaku perjalanan dalam dan luar negeri, kegiatan di fasilitas publik, dan kegiatan berskala besar wajib melindungi diri dari penularan COVID-19. Setiap individu:</p>
              <ul>
                <li>dianjurkan untuk tetap melakukan <strong>vaksinasi COVID-19 sampai dengan booster ke-2 atau dosis ke-4</strong>, terutama bagi masyarakat yang memiliki risiko tinggi penularan COVID-19;</li>
                <li>diperbolehkan <strong>tidak menggunakan masker</strong> apabila dalam keadaan sehat dan tidak berisiko tertular atau menularkan COVID-19;</li>
                <li>dianjurkan <strong>tetap membawa <em>hand sanitizer</em></strong> dan/atau menggunakan sabun dan air mengalir untuk mencuci tangan secara berkala;</li>
                <li>dianjurkan <strong>menjaga jarak atau menghindari kerumunan</strong> untuk mencegah penularan COVID-19, khususnya bagi individu dalam kondisi tidak sehat dan berisiko tertular atau menularkan COVID-19; dan</li>
                <li>dianjurkan <strong>tetap menggunakan aplikasi SATUSEHAT</strong> untuk memantau kesehatan pribadi.</li>
              </ul>
              <p className="text-xs text-slate-400 italic">Sumber: Surat Edaran Kasatgas No. 1 Tahun 2023</p>
            </Section>

            {/* Bali */}
            <Section id="bali" title="Retribusi Wisatawan Asing ke Bali" Icon={Landmark}>
              <p>Efektif mulai <strong>14 Februari 2024</strong>, sesuai dengan Undang-Undang Nomor 15 Tahun 2023, semua turis asing yang mengunjungi Bali diwajibkan untuk membayar <strong>biaya retribusi sebesar $10 (setara dengan Rp150.000)</strong>. Biaya ini berkontribusi pada pelestarian warisan budaya Bali, peningkatan lingkungan alamnya, serta peningkatan kualitas pengalaman perjalanan secara keseluruhan.</p>
              <p>Beberapa kelompok wisatawan asing dapat memperoleh pengecualian dari pembayaran retribusi, dengan syarat sebagai berikut:</p>
              <ol>
                <li>Pemegang visa diplomatik dan visa resmi.</li>
                <li>Anggota kru pada kendaraan transportasi.</li>
                <li>Pemegang Kartu Izin Tinggal Sementara (KITAS) atau Kartu Izin Tinggal Tetap (KITAP).</li>
                <li>Pemegang visa penyatuan keluarga.</li>
                <li>Pemegang visa Pelajar.</li>
                <li>Pemegang visa Golden; dan</li>
                <li>Pemegang visa lain yang bukan untuk tujuan pariwisata yang dikeluarkan oleh Imigrasi.</li>
              </ol>
              <div className="not-prose flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 my-4">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 leading-relaxed">
                  <strong>Penting:</strong> Untuk mendapatkan pembebasan retribusi, wisatawan asing kategori 6 dan 7 perlu mengajukan permohonan melalui Sistem Love Bali minimal <strong>5 (lima) hari</strong> sebelum kedatangan di Bali. Jika pengajuan dilakukan kurang dari 5 hari, wisatawan asing tetap dikenakan biaya retribusi.
                </p>
              </div>
              <p>Untuk informasi lebih lanjut, silakan kunjungi <a href="https://lovebali.baliprov.go.id" target="_blank" rel="noopener noreferrer">lovebali.baliprov.go.id</a> atau unduh aplikasi Love Bali.</p>
            </Section>

            {/* Internasional */}
            <Section id="internasional" title="Perjalanan Internasional" Icon={Globe}>
              <h3>Penerbangan ke Luar Negeri — Aturan Baru</h3>
              <p>Kini aturan vaksin COVID-19 sebagai syarat wajib perjalanan dalam dan luar negeri telah <strong>dihapuskan</strong>. Aturan ini tertuang dalam Surat Edaran (SE) Nomor 1 Tahun 2023 tentang Protokol Kesehatan Pada Masa Transisi Endemi <em>Corona Virus Disease</em> 2019 (COVID-19).</p>

              <div className="not-prose mt-5">
                <p className="text-sm font-bold text-slate-900 mb-2.5">Destinasi Populer — Terbuka untuk Wisatawan Indonesia</p>
                <div className="flex flex-wrap gap-2">
                  {OPEN_COUNTRIES.map(c => (
                    <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-100 text-sky-700 text-xs font-semibold">
                      <Globe className="w-3 h-3" /> {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="not-prose mt-5">
                <p className="text-sm font-bold text-slate-900 mb-2.5">Destinasi Populer — Terbuka Sebagian</p>
                <div className="flex flex-wrap gap-2">
                  {PARTIAL_COUNTRIES.map(c => (
                    <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                      <MapPin className="w-3 h-3" /> {c}
                    </span>
                  ))}
                </div>
              </div>
            </Section>

            {/* Ke Indonesia */}
            <Section id="ke-indonesia" title="Penerbangan ke Indonesia" Icon={PlaneLanding}>
              <h3>Persyaratan Masuk</h3>
              <ul>
                <li>Mengisi <strong>E-Customs Declaration</strong>.</li>
                <li>Penumpang <strong>tidak lagi diwajibkan</strong> menunjukkan hasil negatif tes RT-PCR sebelum keberangkatan, begitu pula tidak perlu menunjukkan bukti kepemilikan asuransi kesehatan.</li>
                <li>Disarankan untuk mengunduh aplikasi <strong>SATUSEHAT</strong> (tersedia di Google Play, App Store, App Gallery).
                  <ul>
                    <li>Beberapa tempat umum di Indonesia masih mewajibkan pengunjung memiliki sertifikat vaksinasi COVID-19; penumpang disarankan mendaftarkan sertifikat vaksinnya pada aplikasi SATUSEHAT.</li>
                  </ul>
                </li>
                <li>Seluruh penumpang, baik domestik maupun internasional, disarankan mengambil tindakan pencegahan yang diperlukan untuk melindungi diri dari infeksi COVID-19.</li>
                <li>Bagi penumpang yang memiliki risiko tinggi terkena infeksi COVID-19, disarankan menerima <strong>dosis booster kedua</strong> vaksin COVID-19.</li>
                <li>Penggunaan masker bersifat <strong>opsional</strong> bagi penumpang yang dalam keadaan sehat dan tidak rentan terhadap penularan atau penyebaran COVID-19.</li>
              </ul>

              <h3>Pintu Masuk</h3>
              <div className="not-prose grid sm:grid-cols-2 gap-2 mt-2">
                {ENTRY_AIRPORTS.map(a => (
                  <div key={a} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <PlaneLanding className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700 leading-snug">{a}</span>
                  </div>
                ))}
              </div>

              <h3 className="!mt-6">Visa on Arrival</h3>
              <div className="not-prose flex items-start gap-3 p-4 rounded-xl bg-sky-50 border border-sky-100">
                <Stamp className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 leading-relaxed">
                  Visa on Arrival telah dibuka untuk wisatawan internasional yang berkunjung ke Indonesia dari sejumlah negara. Detail dapat dibaca pada halaman info kebijakan negara Indonesia.
                </p>
              </div>
              <p className="text-xs text-slate-400 italic mt-3">Sumber: Surat Edaran Kemenhub No. 16 Tahun 2023 tentang Protokol Kesehatan Pelaku Perjalanan Orang dengan Transportasi Udara Pada Masa Transisi Endemi COVID-19.</p>
            </Section>

            {/* ── Contact Card ────────────────────────────────────── */}
            <div className="mt-10 sm:mt-12 bg-gradient-to-br from-sky-500/5 via-blue-50 to-sky-50 border border-sky-500/20 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8">
              <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 mb-1.5 sm:mb-2 !mt-0">Butuh Bantuan?</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-5 sm:mb-6">Punya pertanyaan terkait persyaratan penerbangan? Tim kami siap membantu.</p>
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
              © 2026 ArahInn.com — PT. Sukses Arahinn Hospitality.<br className="sm:hidden" />
              <span className="hidden sm:inline"> </span>Semua hak dilindungi.
            </p>
          </article>
        </div>
      </section>

      {/* ── Mobile Floating TOC Button ───────────────── */}
      <button
        onClick={() => setMobileTocOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-40 h-12 px-4 rounded-full bg-white text-sky-600 border border-slate-200 shadow-lg active:scale-95 transition-all flex items-center gap-2"
        aria-label="Buka daftar isi"
      >
        <List className="w-4 h-4" />
        <span className="text-xs font-bold">Daftar Isi</span>
      </button>

      {/* ── Mobile TOC Bottom Sheet ──────────────────────────────────── */}
      {mobileTocOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end" onClick={() => setMobileTocOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col animate-slide-up"
          >
            <div className="shrink-0 px-5 pt-3 pb-2">
              <div className="mx-auto w-10 h-1 rounded-full bg-slate-300 mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Navigasi</p>
                  <h3 className="font-display text-lg font-bold text-slate-900">Daftar Isi</h3>
                </div>
                <button
                  onClick={() => setMobileTocOpen(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                  aria-label="Tutup"
                >
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
                    activeId === id ? 'bg-sky-50 text-sky-600 font-bold' : 'text-slate-700 active:bg-slate-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    activeId === id ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'
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
          className="fixed bottom-6 right-6 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-sky-500 text-white shadow-lg hover:bg-sky-600 hover:shadow-xl active:scale-95 transition-all flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}

      <style>{`
        .prose-content section { scroll-margin-top: 80px; }
        .prose-content p, .prose-content li {
          font-size: 0.9rem; line-height: 1.7; color: #475569;
          text-align: left; word-break: break-word; overflow-wrap: anywhere;
        }
        @media (min-width: 640px) {
          .prose-content section { scroll-margin-top: 100px; }
          .prose-content p, .prose-content li {
            font-size: 0.93rem; line-height: 1.75; text-align: justify;
            text-justify: inter-word; hyphens: auto; word-break: normal; overflow-wrap: break-word;
          }
        }
        .prose-content p { margin-bottom: 0.875rem; }
        @media (min-width: 640px) { .prose-content p { margin-bottom: 1rem; } }
        .prose-content h3 { font-weight: 700; color: #0f172a; font-size: 1rem; margin: 1.25rem 0 0.6rem; }
        .prose-content ol, .prose-content ul { padding-left: 1.25rem; margin-bottom: 1rem; }
        @media (min-width: 640px) { .prose-content ol, .prose-content ul { padding-left: 1.5rem; } }
        .prose-content ol li, .prose-content ul li { margin-bottom: 0.5rem; }
        .prose-content ol { list-style-type: decimal; }
        .prose-content ul { list-style-type: disc; }
        .prose-content ul ul { list-style-type: circle; margin-top: 0.5rem; }
        .prose-content strong { color: #0f172a; font-weight: 700; }
        .prose-content a { color: #0284c7; font-weight: 600; }
        .prose-content a:hover { text-decoration: underline; }
        .prose-content .not-prose, .prose-content .not-prose * { text-align: left; }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
        .animate-fade-in  { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  )
}

function Section({ id, title, Icon, children }) {
  return (
    <section id={id} className="mb-8 sm:mb-10 last:mb-0">
      <div className="flex items-center gap-2.5 sm:gap-3 pb-2.5 sm:pb-3 mb-4 sm:mb-5 border-b border-slate-200">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" />
        </div>
        <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-tight">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
