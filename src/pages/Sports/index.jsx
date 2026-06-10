import { Link } from 'react-router-dom'
import {
  ArrowLeft, Sparkles, Clock, MapPin, CalendarCheck, MessageCircle, ChevronRight, Zap,
} from 'lucide-react'
import SEO from '@/components/SEO'

const CATEGORIES = [
  {
    name: 'Padel',
    logo: '🎾',
    desc: 'Booking lapangan padel indoor & outdoor, cari partner main, dan ikut turnamen seru.',
    grad: 'from-lime-500 to-green-600',
    soft: 'from-lime-50 to-green-50',
    ring: 'ring-green-100',
    badge: 'Populer',
  },
  {
    name: 'Gym / Fitness',
    logo: '🏋️',
    desc: 'Day-pass & membership gym terdekat, kelas fitness, dan sesi personal trainer.',
    grad: 'from-rose-500 to-red-600',
    soft: 'from-rose-50 to-red-50',
    ring: 'ring-rose-100',
  },
  {
    name: 'Futsal',
    logo: '⚽',
    desc: 'Sewa lapangan futsal per jam, atur jadwal tim, dan booking instan tanpa ribet.',
    grad: 'from-blue-500 to-indigo-600',
    soft: 'from-blue-50 to-indigo-50',
    ring: 'ring-blue-100',
  },
  {
    name: 'Badminton',
    logo: '🏸',
    desc: 'Booking lapangan bulu tangkis, sewa per sesi, dan komunitas main bareng.',
    grad: 'from-amber-500 to-orange-600',
    soft: 'from-amber-50 to-orange-50',
    ring: 'ring-amber-100',
  },
  {
    name: 'Basket',
    logo: '🏀',
    desc: 'Sewa lapangan basket indoor/outdoor untuk latihan, pertandingan, atau event.',
    grad: 'from-orange-500 to-red-500',
    soft: 'from-orange-50 to-red-50',
    ring: 'ring-orange-100',
  },
  {
    name: 'Renang',
    logo: '🏊',
    desc: 'Tiket kolam renang, sewa lane, dan kelas berenang untuk semua usia.',
    grad: 'from-cyan-500 to-blue-600',
    soft: 'from-cyan-50 to-blue-50',
    ring: 'ring-cyan-100',
  },
]

const STEPS = [
  { icon: MapPin,        title: 'Pilih Olahraga & Lokasi', desc: 'Tentukan jenis olahraga dan venue terdekat dari kamu.' },
  { icon: CalendarCheck, title: 'Pilih Jadwal',            desc: 'Cek slot kosong dan pilih waktu yang pas.' },
  { icon: Zap,           title: 'Booking Instan',          desc: 'Bayar dan langsung dapat konfirmasi — tinggal main.' },
]

export default function Sports() {
  return (
    <div className="bg-white min-h-screen">
      <SEO
        title="Sports — Booking Lapangan & Aktivitas Olahraga"
        description="Booking lapangan Padel, Futsal, Badminton, Basket, gym/fitness, dan kolam renang di ArahInn. Cari venue, pilih jadwal, dan booking instan."
        url="/sports"
      />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b1f17] via-[#065f46] to-[#f97316]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.22)_0%,transparent_55%)]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-lime-300/20 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl" />

        <div className="container relative py-10 sm:py-14 lg:py-20">
          <Link to="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-xs sm:text-sm font-semibold transition-all active:scale-95 mb-6">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Home
          </Link>

          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/15 backdrop-blur-md rounded-full text-[11px] sm:text-xs font-bold mb-4 border border-white/25">
              <Sparkles className="w-3.5 h-3.5" /> ARAHINN SPORTS
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
              Gerak, Main,{' '}
              <span className="bg-gradient-to-r from-lime-200 via-yellow-100 to-orange-200 bg-clip-text text-transparent">
                Booking Mudah
              </span>
            </h1>
            <p className="mt-3 sm:mt-4 text-white/90 text-sm sm:text-base md:text-lg max-w-lg">
              Sewa lapangan, kelas, dan aktivitas olahraga favoritmu — semua dalam satu tempat.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-b from-transparent to-white pointer-events-none" />
      </section>

      {/* ── Kategori ───────────────────────────────────────── */}
      <section className="container py-10 sm:py-14">
        <div className="text-center mb-7 sm:mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">Pilih Kategori Olahraga</h2>
          <p className="text-slate-500 mt-1.5 text-sm sm:text-base">Temukan venue dan aktivitas yang kamu suka</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.name}
              to="/coming-soon?feature=sports"
              className={`group relative rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all`}
            >
              {/* Header gradient + logo */}
              <div className={`relative h-28 sm:h-32 bg-gradient-to-br ${cat.grad} flex items-center justify-center`}>
                <div className="absolute inset-0 opacity-15"
                  style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />
                <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white shadow-lg ring-4 ${cat.ring} flex items-center justify-center text-4xl sm:text-5xl group-hover:scale-110 transition-transform`}>
                  {cat.logo}
                </div>
                {cat.badge && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 text-slate-800 rounded-full text-[10px] font-black shadow">
                    🔥 {cat.badge}
                  </span>
                )}
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 bg-black/25 text-white rounded-full text-[10px] font-bold">
                  <Clock className="w-3 h-3" /> Segera Hadir
                </span>
              </div>

              {/* Body */}
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-lg text-slate-900">{cat.name}</h3>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed line-clamp-2">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Cara kerja ─────────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="container py-10 sm:py-14">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">Booking dalam 3 Langkah</h2>
            <p className="text-slate-500 mt-1.5 text-sm sm:text-base">Cepat, praktis, langsung main</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative bg-white rounded-2xl border border-slate-100 p-6 text-center shadow-sm">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-orange-500 text-white text-xs font-black flex items-center justify-center shadow">
                  {i + 1}
                </div>
                <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 flex items-center justify-center mb-3 mt-2">
                  <s.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="container py-10 sm:py-14">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-7 sm:p-10">
          <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
            <div className="max-w-lg">
              <h3 className="font-display text-xl sm:text-2xl font-bold">Fitur Sports segera hadir! 🏆</h3>
              <p className="mt-2 text-sm sm:text-base text-white/75 leading-relaxed">
                Booking lapangan & aktivitas olahraga lagi disiapkan. Mau jadi venue partner atau dapat info duluan? Hubungi kami.
              </p>
            </div>
            <a href="https://wa.me/6285188136009" target="_blank" rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shrink-0">
              <MessageCircle className="w-4 h-4" /> Chat WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
