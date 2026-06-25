import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Handshake, BadgeDollarSign, ClipboardList,
  ChevronDown, ChevronLeft, MessageCircle, ArrowRight,
} from 'lucide-react'
import SEO from '@/components/SEO'

const WA_NUMBER  = '6285167038129'
const WA_DISPLAY = '+62 851 6703 8129'

// 3 topik FAQ Design Interior — dikunci ke prop `topic` dari route.
const PAGES = {
  'layanan-kemitraan': {
    title: 'Layanan & Kemitraan',
    subtitle: 'Mengenal fitur Desain Interior & Furnish ArahInn beserta mitra resminya.',
    Icon: Handshake,
    items: [
      { q: 'Apa itu fitur Desain Interior & Furnish di ArahInn?', a: 'Fitur ini membantu Anda merancang dan mengisi furnitur properti langsung lewat aplikasi.' },
      { q: 'Siapa mitra resmi ArahInn untuk layanan ini?', a: 'ArahInn bekerja sama dengan Sinergi Corporation melalui PT. Wiraky Graha Indonesia.' },
      { q: 'Apa peran Brand Dekorasi.Me dalam kerja sama ini?', a: 'Dekorasi.Me adalah bagian dari grup mitra yang mengeksekusi proyek interior Anda.' },
    ],
  },
  'keunggulan-biaya': {
    title: 'Keunggulan & Biaya',
    subtitle: 'Alasan layanan interior ArahInn lebih kompetitif, terpantau, dan transparan.',
    Icon: BadgeDollarSign,
    items: [
      { q: 'Mengapa harga layanan ini diklaim lebih kompetitif?', a: 'Sinergi satu grup memotong jalur distribusi sehingga biaya produksi jauh lebih murah.' },
      { q: 'Bagaimana sistem pengawasan proyek interior di ArahInn?', a: 'Pengawasan berjalan satu pintu terintegrasi untuk memastikan hasil sesuai lini masa.' },
      { q: 'Apakah konsumen mendapatkan jaminan transparansi harga?', a: 'Ya, Rincian Anggaran Biaya (RAB) diberikan secara detail sebelum proyek dimulai.' },
    ],
  },
  'pemesanan-teknis': {
    title: 'Pemesanan & Teknis',
    subtitle: 'Cara memesan, pengajuan desain kustom, dan estimasi waktu pengerjaan.',
    Icon: ClipboardList,
    items: [
      {
        q: 'Bagaimana cara memesan layanan interior lewat aplikasi?',
        a: (<>Buka menu <strong>Interior</strong> di ArahInn, pilih paket, dan jadwalkan konsultasi. Atau hubungi <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer" className="text-orange-600 font-semibold hover:underline">{WA_DISPLAY}</a>.</>),
      },
      { q: 'Apakah konsumen bisa mengajukan desain kustom sendiri?', a: 'Bisa, tim desainer Dekorasi.Me akan menyesuaikan ide dengan ukuran ruangan Anda.' },
      { q: 'Berapa lama estimasi pengerjaan interior hingga selesai?', a: 'Waktu pengerjaan bervariasi antara 2 hingga 8 minggu tergantung skala proyek.' },
    ],
  },
}

export default function InteriorFaq({ topic }) {
  const page = PAGES[topic] ?? PAGES['layanan-kemitraan']
  const { Icon } = page
  const [open, setOpen] = useState(0)   // pertanyaan pertama terbuka default

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title={`${page.title} — Desain Interior ArahInn`} description={page.subtitle} url={`/interior/${topic}`} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 text-white">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />
        <div className="container relative py-9 sm:py-14">
          <Link to="/interior" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 sm:mb-5 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Kembali ke Design Interior
          </Link>
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-orange-200" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">{page.title}</h1>
              <p className="text-sm sm:text-base text-white/80 mt-1.5 max-w-xl leading-relaxed">{page.subtitle}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tab antar 3 halaman */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="container flex gap-1 overflow-x-auto py-2">
          {Object.entries(PAGES).map(([key, p]) => (
            <Link key={key} to={`/interior/${key}`}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${key === topic ? 'bg-orange-50 text-orange-700' : 'text-slate-500 hover:bg-slate-100'}`}>
              {p.title}
            </Link>
          ))}
        </div>
      </div>

      {/* Accordion FAQ */}
      <div className="container py-8 sm:py-12 max-w-3xl">
        <div className="space-y-3">
          {page.items.map((it, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <button onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
                <span className="font-bold text-slate-900 text-sm sm:text-base">{it.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <div className="px-5 pb-4 -mt-1 text-sm sm:text-[15px] text-slate-600 leading-relaxed">{it.a}</div>
              )}
            </div>
          ))}
        </div>

        {/* CTA kontak */}
        <div className="mt-8 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900">Siap wujudkan ruang impian Anda?</h3>
            <p className="text-sm text-slate-600 mt-1">Konsultasi gratis dengan tim desainer Dekorasi.Me.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <Link to="/interior"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors">
              Lihat Layanan <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
