import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Info, Plane, Globe, PlaneLanding, ShieldCheck, Stamp, Luggage,
  Phone, Mail, MessageCircle, ArrowUp, AlertCircle,
} from 'lucide-react'
import SEO from '@/components/SEO'

const ABROAD_COUNTRIES = [
  'Singapura', 'Turki', 'Jepang', 'Malaysia', 'Filipina', 'Indonesia', 'Australia', 'Korea Selatan',
  'Belanda', 'Amerika Serikat', 'Thailand', 'Prancis', 'Inggris', 'India', 'Jerman', 'Uni Emirat Arab',
  'Arab Saudi', 'Spanyol', 'Brunei Darussalam', 'Mesir', 'Afrika Selatan', 'Albania', 'Argentina', 'Austria',
  'Bahama', 'Bahrain', 'Bangladesh', 'Barbados', 'Belgia', 'Brasil', 'Bulgaria', 'Chili', 'Cina Daratan',
  'Denmark', 'Fiji', 'Finlandia', 'Ghana', 'Haiti', 'Hong Kong', 'Hungaria', 'Iran', 'Irak', 'Irlandia',
  'Islandia', 'Israel', 'Italia', 'Kanada', 'Kamboja', 'Kazakhstan', 'Kenya', 'Kolombia', 'Kosta Rika',
  'Kuwait', 'Laos', 'Makedonia Utara', 'Makau', 'Maladewa', 'Maroko', 'Mauritius', 'Meksiko', 'Mongolia',
  'Myanmar', 'Nepal', 'Nigeria', 'Norwegia', 'Oman', 'Panama', 'Pakistan', 'Peru', 'Polandia', 'Portugal',
  'Qatar', 'Republik Ceko', 'Republik Dominika', 'Rusia', 'Selandia Baru', 'Serbia', 'Seychelles', 'Slovakia',
  'Sri Lanka', 'Swedia', 'Swiss', 'Taiwan', 'Timor-Leste', 'Ukraina', 'Vietnam', 'Yordania', 'Yunani',
]

const TABS = [
  { key: 'domestik', label: 'Penerbangan Domestik', Icon: Plane },
  { key: 'internasional', label: 'Penerbangan Internasional', Icon: Globe },
]

export default function FlightPolicy() {
  const [params, setParams] = useSearchParams()
  const initial = params.get('tab') === 'internasional' ? 'internasional' : 'domestik'
  const [tab, setTab] = useState(initial)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const switchTab = (k) => {
    setTab(k)
    setParams(k === 'internasional' ? { tab: 'internasional' } : {}, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen">
      <SEO
        title="Kebijakan Penerbangan"
        description="Kebijakan dan aturan perjalanan udara domestik maupun internasional bersama ArahInn — persyaratan masuk, info bandara, pembatasan barang bawaan, dan visa kunjungan."
        url="/penerbangan/kebijakan"
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
            <ShieldCheck className="w-3.5 h-3.5" /> Aturan & Kebijakan
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mb-2 sm:mb-3 leading-tight">
            Kebijakan Penerbangan
          </h1>
          <p className="text-white/80 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed px-2">
            Aturan perjalanan udara <span className="font-semibold">domestik</span> &amp; <span className="font-semibold">internasional</span> — pilih kategori sesuai tujuan penerbangan Anda.
          </p>
        </div>
      </section>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="sticky top-14 md:top-16 z-30 bg-slate-50/90 backdrop-blur border-b border-slate-200">
        <div className="container py-3">
          <div className="mx-auto max-w-md grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => switchTab(key)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  tab === key ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200/60' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <section className="container py-6 sm:py-10">
        <article className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-5 sm:p-7 md:p-10 shadow-sm prose-content">
          {tab === 'domestik' ? <DomesticContent /> : <InternationalContent />}

          {/* ── Contact Card ────────────────────────────────────── */}
          <div className="mt-10 sm:mt-12 bg-gradient-to-br from-sky-500/5 via-blue-50 to-sky-50 border border-sky-500/20 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8">
            <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 mb-1.5 sm:mb-2 !mt-0">Butuh Bantuan?</h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-5 sm:mb-6">Punya pertanyaan terkait kebijakan penerbangan? Tim kami siap membantu.</p>
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
            © 2026 ArahInn.com — PT. Redy Hospitality Management.<br className="sm:hidden" />
            <span className="hidden sm:inline"> </span>Semua hak dilindungi.
          </p>
        </article>
      </section>

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
        .prose-content section { scroll-margin-top: 120px; }
        .prose-content p, .prose-content li {
          font-size: 0.9rem; line-height: 1.7; color: #475569;
          text-align: left; word-break: break-word; overflow-wrap: anywhere;
        }
        @media (min-width: 640px) {
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
      `}</style>
    </div>
  )
}

/* ── Tab: Domestik ─────────────────────────────────────────────────── */
function DomesticContent() {
  return (
    <>
      <Section title="Aturan Baru" Icon={Info}>
        <p>Kini aturan terbaru vaksin COVID-19 sebagai syarat wajib perjalanan dalam dan luar negeri telah <strong>dihapuskan</strong>. Aturan ini tertuang dalam Surat Edaran (SE) Nomor 1 Tahun 2023 tentang Protokol Kesehatan Pada Masa Transisi Endemi <em>Corona Virus Disease</em> 2019 (COVID-19).</p>
      </Section>

      <Section title="Persyaratan Masuk Umum" Icon={ShieldCheck}>
        <ul>
          <li>Penumpang <strong>tidak lagi diwajibkan</strong> untuk menunjukkan hasil negatif dari tes RT-PCR, maupun bukti kepemilikan asuransi kesehatan.</li>
          <li>Disarankan untuk <strong>mengunduh aplikasi SATUSEHAT</strong> (tersedia di Google Play, App Store, App Gallery) dan mendaftarkan sertifikat vaksinnya pada aplikasi ini.</li>
          <li>Seluruh penumpang disarankan untuk mengambil <strong>tindakan pencegahan</strong> untuk melindungi diri dari infeksi COVID-19.</li>
        </ul>
        <p className="text-xs text-slate-400 italic">Sumber: Surat Edaran Kemenhub No. 16 Tahun 2023 tentang Protokol Kesehatan Pelaku Perjalanan Orang dengan Transportasi Udara Pada Masa Transisi Endemi COVID-19.</p>
      </Section>

      <Section title="Info Penerbangan Domestik" Icon={Plane}>
        <ul>
          <li>Pada tanggal <strong>25 Mei 2023</strong>, Kementerian Perhubungan mengumumkan bahwa penerbangan utama di Jawa Barat secara bertahap akan dipindahkan dari Bandara Husein Sastranegara di Bandung ke Bandara Kertajati di Majalengka.</li>
          <li>Mulai tanggal <strong>29 Oktober 2023</strong>, maskapai seperti AirAsia, Citilink, dan SuperAir Jet akan mengalihkan rute penerbangan dari Bandara Internasional Husein Sastranegara (BDO) ke Bandara Internasional Kertajati (KJT).</li>
          <li>Mulai tanggal <strong>6 Desember 2023</strong>, seluruh penerbangan domestik AirAsia akan dipindahkan dari Terminal 1A ke Terminal 2D.</li>
        </ul>
        <div className="not-prose flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mt-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Catatan:</strong> Persyaratan perjalanan tiap kota atau daerah di pulau yang sama bisa berbeda. Pastikan Anda membaca detail ketentuan di bandara tujuan. Persyaratan perjalanan dapat berubah sewaktu-waktu sesuai ketentuan pemerintah pusat atau daerah setempat.
          </p>
        </div>
      </Section>
    </>
  )
}

/* ── Tab: Internasional ────────────────────────────────────────────── */
function InternationalContent() {
  return (
    <>
      <Section title="Aturan Baru — Penerbangan ke Indonesia" Icon={PlaneLanding}>
        <ul>
          <li>Mulai <strong>18 Agustus 2025</strong>, pelaku perjalanan internasional yang masuk ke Indonesia (termasuk wisatawan mancanegara) dapat mengisi <strong>Kartu Kedatangan</strong> — deklarasi keimigrasian, kesehatan, karantina, dan bea cukai — secara online sejak <strong>H-3</strong> keberangkatan melalui aplikasi <strong>All Indonesia</strong> (tersedia di iOS dan Android). Formulir ini akan secara resmi menggantikan metode lain (QR Immigration, Custom/Quarantine E-CD, dan Satu Sehat) pada <strong>1 Oktober 2025</strong>.</li>
          <li>Per <strong>27 Agustus 2024</strong>, setiap pelaku perjalanan internasional yang masuk ke Indonesia (WNI maupun WNA) wajib mengisi <strong>SATUSEHAT Health Pass</strong> melalui <a href="https://sshp.kemkes.go.id/" target="_blank" rel="noopener noreferrer">sshp.kemkes.go.id</a>. Aturan ini dibuat berdasarkan SE 5 DJPU Tahun 2024 untuk mencegah penyebaran <em>monkeypox</em> (mpox).</li>
          <li>Mulai <strong>10 Maret 2024</strong>, aturan impor barang bagi warga maupun pelancong yang masuk ke Indonesia diperbarui melalui Peraturan Menteri Perdagangan Nomor 3 Tahun 2024 (menggantikan Nomor 36 Tahun 2023).</li>
        </ul>

        <div className="not-prose mt-2 rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
            <Luggage className="w-4 h-4 text-sky-600" />
            <p className="text-sm font-bold text-slate-900">Pembatasan Barang Bawaan Penumpang</p>
          </div>
          <ul className="divide-y divide-slate-100">
            {[
              ['Alas Kaki', 'Maksimal 2 pasang untuk setiap penumpang.'],
              ['Tas', 'Maksimal 2 tas per penumpang.'],
              ['Alat Elektronik', 'Maksimal 5 unit dengan nilai total tidak melebihi US$ 1.500 per orang.'],
              ['Gadget', 'Telepon seluler, komputer, tablet, dan headset — maksimal 2 unit per penumpang.'],
              ['Barang Tekstil', 'Maksimal 5 buah barang tekstil per penumpang.'],
            ].map(([k, v]) => (
              <li key={k} className="flex items-start gap-3 px-4 py-3">
                <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[11px] font-bold">{k}</span>
                <span className="text-sm text-slate-600 leading-snug">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section title="Penerbangan Keluar Negeri" Icon={Globe}>
        <p>Cek status pembatasan dan aturan perjalanan ke negara tujuan Anda. Berikut negara-negara dengan informasi perjalanan yang tersedia:</p>
        <div className="not-prose flex flex-wrap gap-2 mt-1">
          {ABROAD_COUNTRIES.map(c => (
            <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-100 text-sky-700 text-xs font-semibold">
              <Globe className="w-3 h-3" /> {c}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Visa Kunjungan" Icon={Stamp}>
        <p>Visa Kunjungan Saat Kedatangan Elektronik (<strong>e-VOA</strong>) dapat digunakan orang asing untuk melakukan kegiatan sebagai berikut:</p>
        <ol>
          <li>Kunjungan wisata.</li>
          <li>Kunjungan tugas pemerintahan.</li>
          <li>Kunjungan pembicaraan bisnis.</li>
          <li>Kunjungan pembelian barang.</li>
          <li>Kunjungan rapat.</li>
          <li>Transit.</li>
        </ol>
        <p>Silakan kunjungi <a href="https://www.imigrasi.go.id" target="_blank" rel="noopener noreferrer">imigrasi.go.id</a> untuk menemukan informasi lebih lanjut mengenai proses aplikasi Visa Kunjungan.</p>
      </Section>

      {/* Disclaimer */}
      <div className="not-prose flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-slate-700 mb-1">Disclaimer</p>
          <p className="text-sm text-slate-500 leading-relaxed">
            Halaman ini dibuat untuk memberikan informasi dan tidak dapat digunakan sebagai referensi utama dalam merencanakan perjalanan dan membeli produk. Kami mengimbau Anda untuk membaca informasi resmi yang dibuat oleh otoritas negara tujuan.
          </p>
        </div>
      </div>
    </>
  )
}

function Section({ title, Icon, children }) {
  return (
    <section className="mb-8 sm:mb-10 last:mb-0">
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
