import { useState, useEffect } from 'react'
import {
  ShieldCheck, Database, Share2, Lock, Archive, UserCheck,
  Cookie, Baby, Globe, RefreshCw, MessageCircle, Mail, Phone,
  ArrowUp, List, X,
} from 'lucide-react'
import SEO from '@/components/SEO'

const SECTIONS = [
  { id: 'informasi',   label: 'Informasi yang Dikumpulkan', Icon: Database },
  { id: 'penggunaan',  label: 'Cara Kami Menggunakan',      Icon: ShieldCheck },
  { id: 'berbagi',     label: 'Berbagi dengan Pihak Ketiga', Icon: Share2 },
  { id: 'keamanan',    label: 'Keamanan Data',              Icon: Lock },
  { id: 'penyimpanan', label: 'Penyimpanan Data',           Icon: Archive },
  { id: 'hak',         label: 'Hak-Hak Anda',               Icon: UserCheck },
  { id: 'cookies',     label: 'Cookies & Pelacakan',        Icon: Cookie },
  { id: 'anak',        label: 'Anak di Bawah Umur',         Icon: Baby },
  { id: 'transfer',    label: 'Transfer Data Internasional', Icon: Globe },
  { id: 'perubahan',   label: 'Perubahan Kebijakan',        Icon: RefreshCw },
]

export default function PrivacyPolicy() {
  const [activeId, setActiveId]   = useState('informasi')
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
        title="Kebijakan Privasi"
        description="Kebijakan Privasi ArahInn: bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda di aplikasi mobile dan website."
        url="/privacy-policy"
        type="article"
      />

      {/* ── Hero header ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        <div className="container relative py-8 sm:py-12 lg:py-16 flex flex-col items-center text-center">
          <div className="bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 shadow-xl mb-4 sm:mb-6">
            <img src="/logo-arahin.png" alt="ArahInn" className="h-8 sm:h-10 md:h-12 w-auto" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur border border-white/25 rounded-full text-[11px] sm:text-xs font-bold mb-3 sm:mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            PRIVASI ANDA AMAN
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mb-2 sm:mb-3 leading-tight">
            Kebijakan Privasi
          </h1>
          <p className="text-white/80 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed px-2">
            Kami menghargai privasi Anda. Halaman ini menjelaskan bagaimana <span className="font-semibold">ArahInn.com</span> mengumpulkan,
            menggunakan, dan melindungi informasi Anda.
          </p>
          <p className="mt-3 sm:mt-4 text-[11px] sm:text-xs text-white/60">Berlaku efektif: 22 Mei 2026</p>
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
                        ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
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

            <div className="mb-6 sm:mb-8 p-4 sm:p-5 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-xs sm:text-sm text-blue-900 leading-relaxed">
                Selamat datang di ArahInn. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan,
                mengungkapkan, dan melindungi informasi Anda saat Anda menggunakan aplikasi mobile ArahInn dan situs web kami
                <em> (selanjutnya disebut "Platform")</em>. Dengan menggunakan ArahInn, Anda menyetujui pengumpulan dan
                penggunaan informasi sesuai dengan kebijakan ini.
              </p>
            </div>

            <Section id="informasi" title="Informasi yang Kami Kumpulkan" Icon={Database}>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-2 mb-2">1.1 Informasi yang Anda Berikan</h3>
              <ul>
                <li><strong>Data Akun:</strong> nama lengkap, alamat email, nomor telepon, kata sandi (terenkripsi), foto profil.</li>
                <li><strong>Data Pemesanan:</strong> nama tamu, email, nomor telepon, alamat, catatan khusus, jumlah tamu, tanggal check-in/check-out.</li>
                <li><strong>Data Pembayaran:</strong> kami <strong>tidak menyimpan</strong> detail kartu kredit atau rekening Anda. Pembayaran diproses oleh penyedia pihak ketiga (DOKU) yang memiliki sertifikasi keamanan PCI-DSS.</li>
                <li><strong>Konten Komunikasi:</strong> pesan yang Anda kirim melalui fitur live chat, customer support, dan ulasan/rating.</li>
              </ul>

              <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-4 mb-2">1.2 Informasi yang Dikumpulkan Otomatis</h3>
              <ul>
                <li><strong>Data Perangkat:</strong> jenis perangkat, sistem operasi, identifikasi unik perangkat, alamat IP.</li>
                <li><strong>Data Penggunaan:</strong> halaman yang dikunjungi, fitur yang digunakan, waktu akses, riwayat pencarian, riwayat pemesanan.</li>
                <li><strong>Data Lokasi:</strong> jika Anda memberikan izin, kami menggunakan lokasi GPS untuk menampilkan penginapan terdekat.</li>
                <li><strong>Token Notifikasi Push:</strong> token unik dari Firebase/Apple untuk mengirim notifikasi.</li>
              </ul>

              <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-4 mb-2">1.3 Informasi dari Pihak Ketiga</h3>
              <ul>
                <li><strong>Login Sosial:</strong> jika Anda login menggunakan Google, kami menerima email, nama, dan foto profil dari Google.</li>
              </ul>
            </Section>

            <Section id="penggunaan" title="Cara Kami Menggunakan Informasi Anda" Icon={ShieldCheck}>
              <p>Kami menggunakan informasi yang dikumpulkan untuk:</p>
              <ol>
                <li><strong>Penyediaan Layanan:</strong> memproses pemesanan, pembayaran, mengirim voucher elektronik, dan komunikasi dengan tim penginapan.</li>
                <li><strong>Personalisasi:</strong> menampilkan rekomendasi penginapan, promo, dan konten yang relevan.</li>
                <li><strong>Komunikasi:</strong> mengirim notifikasi terkait pemesanan, pesan chat, promo, dan pembaruan layanan.</li>
                <li><strong>Keamanan &amp; Pencegahan Penipuan:</strong> memverifikasi identitas, mendeteksi aktivitas mencurigakan.</li>
                <li><strong>Peningkatan Layanan:</strong> menganalisis penggunaan untuk meningkatkan fitur dan pengalaman pengguna.</li>
                <li><strong>Kepatuhan Hukum:</strong> memenuhi kewajiban hukum dan peraturan yang berlaku di Indonesia.</li>
              </ol>
            </Section>

            <Section id="berbagi" title="Berbagi Informasi dengan Pihak Ketiga" Icon={Share2}>
              <p>Kami <strong>tidak menjual</strong> data pribadi Anda. Kami hanya membagikan data dengan:</p>
              <ul>
                <li><strong>Mitra Penginapan:</strong> nama tamu, email, nomor telepon, dan detail pemesanan dibagikan ke hotel/villa yang Anda pesan.</li>
                <li><strong>Penyedia Pembayaran:</strong> DOKU sebagai payment gateway untuk memproses transaksi.</li>
                <li><strong>Penyedia Notifikasi:</strong> Firebase (Google) dan Apple Push Notification service untuk mengirim notifikasi push.</li>
                <li><strong>Penyedia Email:</strong> untuk mengirim email konfirmasi booking, voucher, dan pemberitahuan lainnya.</li>
                <li><strong>Otoritas Hukum:</strong> jika diwajibkan oleh hukum atau perintah pengadilan yang sah.</li>
              </ul>
            </Section>

            <Section id="keamanan" title="Keamanan Data" Icon={Lock}>
              <p>Kami menerapkan langkah-langkah keamanan teknis dan organisasional yang wajar untuk melindungi data Anda:</p>
              <ul>
                <li>Enkripsi data saat transmisi (HTTPS/TLS)</li>
                <li>Penyimpanan kata sandi dalam bentuk terenkripsi (bcrypt)</li>
                <li>Akses terbatas ke data pribadi hanya untuk personel yang berwenang</li>
                <li>Penggunaan token akses dengan masa berlaku terbatas</li>
                <li>Audit keamanan berkala</li>
              </ul>
              <p>Meski demikian, tidak ada metode transmisi atau penyimpanan elektronik yang 100% aman. Kami tidak dapat menjamin keamanan absolut.</p>
            </Section>

            <Section id="penyimpanan" title="Penyimpanan Data" Icon={Archive}>
              <p>Kami menyimpan data Anda selama:</p>
              <ul>
                <li><strong>Akun aktif:</strong> data dipertahankan selama akun Anda aktif.</li>
                <li><strong>Riwayat transaksi:</strong> disimpan minimal 5 tahun untuk kepatuhan pajak &amp; hukum.</li>
                <li><strong>Komunikasi chat:</strong> disimpan selama akun aktif, dapat dihapus atas permintaan.</li>
                <li><strong>Setelah penghapusan akun:</strong> data anonim dapat tetap disimpan untuk keperluan statistik.</li>
              </ul>
            </Section>

            <Section id="hak" title="Hak-Hak Anda" Icon={UserCheck}>
              <p>Anda memiliki hak untuk:</p>
              <ol>
                <li><strong>Akses:</strong> meminta salinan data pribadi yang kami simpan tentang Anda.</li>
                <li><strong>Koreksi:</strong> memperbarui atau memperbaiki data yang tidak akurat.</li>
                <li><strong>Penghapusan:</strong> meminta penghapusan akun dan data terkait (kecuali yang wajib disimpan oleh hukum).</li>
                <li><strong>Pembatasan:</strong> membatasi pemrosesan data Anda dalam kasus tertentu.</li>
                <li><strong>Portabilitas:</strong> menerima salinan data Anda dalam format yang dapat dibaca mesin.</li>
                <li><strong>Penarikan Persetujuan:</strong> menarik persetujuan untuk pemrosesan data kapan saja.</li>
                <li><strong>Mengelola Notifikasi:</strong> nonaktifkan notifikasi push melalui pengaturan perangkat atau aplikasi.</li>
              </ol>
              <p>Untuk menggunakan hak-hak ini, hubungi kami di <a href="mailto:privacy@arahinn.com" className="text-brand font-semibold break-all">privacy@arahinn.com</a>.</p>
            </Section>

            <Section id="cookies" title="Cookies & Teknologi Pelacakan" Icon={Cookie}>
              <p>Aplikasi mobile ArahInn menggunakan penyimpanan lokal (AsyncStorage) untuk menyimpan preferensi pengguna seperti bahasa, mata uang, dan token sesi. Website ArahInn menggunakan cookie untuk fungsi serupa.</p>
              <p>Anda dapat menghapus penyimpanan lokal kapan saja melalui pengaturan aplikasi/browser, namun ini akan mengakibatkan Anda harus login ulang.</p>
            </Section>

            <Section id="anak" title="Anak di Bawah Umur" Icon={Baby}>
              <p>ArahInn tidak ditujukan untuk anak di bawah <strong>18 tahun</strong>. Kami tidak secara sadar mengumpulkan data pribadi dari anak di bawah umur. Jika Anda mengetahui anak di bawah umur memberikan data kepada kami, mohon hubungi kami untuk penghapusan.</p>
            </Section>

            <Section id="transfer" title="Transfer Data Internasional" Icon={Globe}>
              <p>Data Anda mungkin diproses dan disimpan di server yang berlokasi di luar Indonesia (misal: Google Cloud, AWS). Kami memastikan transfer dilakukan dengan perlindungan yang memadai sesuai standar internasional.</p>
            </Section>

            <Section id="perubahan" title="Perubahan Kebijakan Privasi" Icon={RefreshCw}>
              <p>Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan signifikan akan diberitahukan melalui email atau notifikasi dalam aplikasi. Tanggal "Berlaku efektif" di atas akan diperbarui.</p>
              <p>Penggunaan berkelanjutan atas Platform setelah perubahan menandakan persetujuan Anda terhadap kebijakan yang diperbarui.</p>
            </Section>

            {/* ── Contact Card ────────────────────────────────────── */}
            <div className="mt-10 sm:mt-12 bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 border border-blue-200 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8">
              <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 mb-1.5 sm:mb-2">Hubungi Kami</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-5 sm:mb-6">Untuk pertanyaan terkait Kebijakan Privasi atau permintaan terkait data pribadi Anda.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <a href="mailto:privacy@arahinn.com"
                  className="flex items-center gap-3 p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md active:scale-[0.98] transition-all group">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 shrink-0 transition-colors">
                    <Mail className="w-5 h-5 text-blue-600 group-hover:text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Privasi</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">privacy@arahinn.com</p>
                  </div>
                </a>
                <a href="mailto:cs@arahinn.com"
                  className="flex items-center gap-3 p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md active:scale-[0.98] transition-all group">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 shrink-0 transition-colors">
                    <MessageCircle className="w-5 h-5 text-emerald-600 group-hover:text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Support</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">cs@arahinn.com</p>
                  </div>
                </a>
                <a href="tel:+6285188136009"
                  className="flex items-center gap-3 p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-orange-400 hover:shadow-md active:scale-[0.98] transition-all group">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-500 shrink-0 transition-colors">
                    <Phone className="w-5 h-5 text-orange-600 group-hover:text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">+62 851-8813-6009</p>
                  </div>
                </a>
              </div>
            </div>

            <p className="mt-6 sm:mt-8 text-center text-[11px] sm:text-xs text-slate-400 leading-relaxed px-2">
              © 2026 ArahInn.com — PT ArahInn Superapps.<br className="sm:hidden" />
              <span className="hidden sm:inline"> </span>Terakhir diperbarui: 22 Mei 2026
            </p>
          </article>
        </div>
      </section>

      {/* Mobile floating TOC button */}
      <button
        onClick={() => setMobileTocOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-40 h-12 px-4 rounded-full bg-white text-blue-700 border border-slate-200 shadow-lg active:scale-95 transition-all flex items-center gap-2"
        aria-label="Buka daftar isi"
      >
        <List className="w-4 h-4" />
        <span className="text-xs font-bold">Daftar Isi</span>
      </button>

      {/* Mobile TOC bottom sheet */}
      {mobileTocOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end" onClick={() => setMobileTocOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in-pp" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col animate-slide-up-pp"
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
                    activeId === id
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-700 active:bg-slate-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    activeId === id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
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
          className="fixed bottom-6 right-6 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl active:scale-95 transition-all flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}

      <style>{`
        .prose-content section { scroll-margin-top: 80px; }
        .prose-content p, .prose-content li {
          font-size: 0.9rem;
          line-height: 1.7;
          color: #475569;
          text-align: left;
          word-break: break-word;
          overflow-wrap: anywhere;
        }
        @media (min-width: 640px) {
          .prose-content section { scroll-margin-top: 100px; }
          .prose-content p, .prose-content li {
            font-size: 0.93rem;
            line-height: 1.75;
            text-align: justify;
            text-justify: inter-word;
            hyphens: auto;
            word-break: normal;
            overflow-wrap: break-word;
          }
        }
        .prose-content p { margin-bottom: 0.875rem; }
        @media (min-width: 640px) { .prose-content p { margin-bottom: 1rem; } }
        .prose-content ol, .prose-content ul { padding-left: 1.25rem; margin-bottom: 1rem; }
        @media (min-width: 640px) { .prose-content ol, .prose-content ul { padding-left: 1.5rem; } }
        .prose-content ol li, .prose-content ul li { margin-bottom: 0.5rem; }
        .prose-content ol { list-style-type: decimal; }
        .prose-content ul { list-style-type: disc; }
        .prose-content strong { color: #0f172a; font-weight: 700; }
        .prose-content a { color: #2563eb; }
        .prose-content a:hover { text-decoration: underline; }
        @keyframes slide-up-pp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes fade-in-pp {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-slide-up-pp { animation: slide-up-pp 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
        .animate-fade-in-pp  { animation: fade-in-pp 0.2s ease-out; }
      `}</style>
    </div>
  )
}

function Section({ id, title, Icon, children }) {
  return (
    <section id={id} className="mb-8 sm:mb-10 last:mb-0">
      <div className="flex items-center gap-2.5 sm:gap-3 pb-2.5 sm:pb-3 mb-4 sm:mb-5 border-b border-slate-200">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
        </div>
        <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-tight">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
