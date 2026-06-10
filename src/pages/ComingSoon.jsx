import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  Sparkles, ArrowRight, ArrowLeft, Bell, CheckCircle2,
  Plane, Bus, TrainFront, Smartphone, Lightbulb, Receipt, Wallet,
  Calendar, MessageCircle, Mail, Mountain, Dumbbell,
} from 'lucide-react'
import SEO from '@/components/SEO'

const FEATURE_MAP = {
  'tiket-pesawat': {
    label: 'Tiket Pesawat',
    Icon: Plane,
    color: 'from-sky-500 to-blue-600',
    accent: 'sky',
    description: 'Pesan tiket pesawat domestik dan internasional dengan harga terbaik. Bandingkan maskapai, jadwal, dan dapatkan promo eksklusif.',
    target: 'Q3 2026',
  },
  'tiket-bus': {
    label: 'Tiket Bus',
    Icon: Bus,
    color: 'from-emerald-500 to-teal-600',
    accent: 'emerald',
    description: 'Pesan tiket bus AKAP dan AKDP ke seluruh kota di Indonesia. Pilih jadwal, kursi, dan rute favorit Anda.',
    target: 'Q3 2026',
  },
  'tiket-kereta': {
    label: 'Tiket Kereta',
    Icon: TrainFront,
    color: 'from-orange-500 to-red-600',
    accent: 'orange',
    description: 'Pesan tiket kereta api KAI dengan mudah. Eksekutif, bisnis, ekonomi — semua tersedia dalam satu aplikasi.',
    target: 'Q3 2026',
  },
  'pulsa-data': {
    label: 'Pulsa & Data',
    Icon: Smartphone,
    color: 'from-blue-500 to-indigo-600',
    accent: 'blue',
    description: 'Top up pulsa & paket data semua operator (Telkomsel, Indosat, XL, Smartfren, dll) dengan harga kompetitif.',
    target: 'Segera hadir',
  },
  'pln': {
    label: 'Listrik PLN',
    Icon: Lightbulb,
    color: 'from-yellow-500 to-amber-600',
    accent: 'yellow',
    description: 'Beli token listrik PLN prabayar dan bayar tagihan listrik pascabayar. Proses instan, voucher langsung diterima.',
    target: 'Segera hadir',
  },
  'tagihan': {
    label: 'Bayar Tagihan',
    Icon: Receipt,
    color: 'from-emerald-500 to-green-600',
    accent: 'emerald',
    description: 'Bayar tagihan PDAM, BPJS, internet, TV kabel, asuransi, dan tagihan lainnya. Praktis tanpa harus antri.',
    target: 'Segera hadir',
  },
  'ewallet': {
    label: 'Top Up E-Wallet',
    Icon: Wallet,
    color: 'from-violet-500 to-purple-600',
    accent: 'violet',
    description: 'Top up saldo GoPay, OVO, DANA, ShopeePay, LinkAja, dan e-wallet lainnya. Saldo masuk dalam hitungan detik.',
    target: 'Segera hadir',
  },
  'wisata': {
    label: 'Wisata',
    Icon: Mountain,
    color: 'from-green-500 to-emerald-600',
    accent: 'emerald',
    description: 'Jelajahi paket wisata, tiket atraksi, tour, dan aktivitas seru di destinasi favorit seluruh Indonesia — semua dalam satu tempat.',
    target: 'Segera hadir',
  },
  'sports': {
    label: 'Sports',
    Icon: Dumbbell,
    color: 'from-rose-500 to-red-600',
    accent: 'rose',
    description: 'Pesan tiket event olahraga, sewa lapangan, dan booking aktivitas olahraga favoritmu dengan mudah dan praktis.',
    target: 'Segera hadir',
  },
  'default': {
    label: 'Fitur Baru',
    Icon: Sparkles,
    color: 'from-brand to-orange-600',
    accent: 'orange',
    description: 'Fitur ini sedang dalam pengembangan. Kami sedang menyiapkan pengalaman terbaik untuk Anda.',
    target: 'Segera hadir',
  },
}

export default function ComingSoon() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const featureKey = params.get('feature') || 'default'
  const feature = FEATURE_MAP[featureKey] || FEATURE_MAP.default
  const Icon = feature.Icon

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [featureKey])

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    // For now just mark subscribed — actual backend integration optional
    setSubscribed(true)
    setEmail('')
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen">
      <SEO
        title={`${feature.label} — Segera Hadir`}
        description={`${feature.label} di ArahInn segera hadir. ${feature.description}`}
        url={`/coming-soon?feature=${featureKey}`}
      />

      {/* ── Hero ────────────────────────────────────────── */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${feature.color} text-white`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />

        {/* Decorative orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />

        <div className="container relative py-12 sm:py-16 lg:py-24 flex flex-col items-center text-center">

          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-4 sm:top-6 left-4 sm:left-6 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-xs sm:text-sm font-semibold transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Kembali ke Home</span>
            <span className="sm:hidden">Home</span>
          </button>

          {/* Icon Badge */}
          <div className="relative mb-6 sm:mb-8">
            <div className="absolute inset-0 bg-white/20 rounded-3xl blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-2xl sm:rounded-3xl bg-white text-slate-900 shadow-2xl flex items-center justify-center">
              <Icon className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14" style={{ color: 'currentColor' }} />
            </div>
            {/* Floating sparkles */}
            <Sparkles className="absolute -top-3 -right-3 w-6 h-6 text-yellow-300 animate-pulse" />
            <Sparkles className="absolute -bottom-2 -left-3 w-4 h-4 text-yellow-200 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>

          {/* Tag */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 mb-4 sm:mb-5">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-300" />
            </span>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest">Segera Hadir</span>
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 leading-tight px-2">
            {feature.label}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-white/90 max-w-2xl leading-relaxed px-3 mb-6 sm:mb-8">
            {feature.description}
          </p>

          {/* Target launch */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm border border-white/15 text-xs sm:text-sm">
            <Calendar className="w-4 h-4" />
            <span className="font-semibold">Target Peluncuran: <span className="text-yellow-200">{feature.target}</span></span>
          </div>
        </div>
      </section>

      {/* ── Notify Me Section ─────────────────────────── */}
      <section className="container py-10 sm:py-14 lg:py-16 max-w-2xl">
        {!subscribed ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-7 md:p-9 shadow-sm">
            <div className="flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.color} text-white flex items-center justify-center shrink-0`}>
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-1 sm:mb-2 leading-tight">
                  Mau jadi yang pertama tahu?
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Daftar email Anda dan kami akan kabari saat fitur <strong>{feature.label}</strong> sudah bisa dipakai.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@anda.com"
                  required
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-3 sm:py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-slate-50"
                />
              </div>
              <button
                type="submit"
                className={`px-5 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-br ${feature.color} text-white rounded-xl font-bold text-sm hover:opacity-95 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 shrink-0`}
              >
                <Bell className="w-4 h-4" />
                Beri Tahu Saya
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-9">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-emerald-900 mb-1 sm:mb-2 leading-tight">
                  Terima kasih! ✨
                </h2>
                <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                  Kami akan kabari Anda lewat email begitu fitur <strong>{feature.label}</strong> sudah tersedia. Pantau juga sosial media kami untuk update terbaru.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* What's available now */}
        <div className="mt-8 sm:mt-10">
          <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 mb-4 sm:mb-5 text-center">
            Sambil menunggu, coba fitur lainnya:
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Booking Hotel',  to: '/search',   color: 'from-blue-500 to-blue-600',     emoji: '🏨' },
              { label: 'Properti',       to: '/properti', color: 'from-emerald-500 to-teal-600',  emoji: '🏠' },
              { label: 'Interior',       to: '/interior', color: 'from-orange-500 to-amber-600',  emoji: '🎨' },
              { label: 'Promo',          to: '/promo',    color: 'from-violet-500 to-purple-600', emoji: '🎁' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="group flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md active:scale-95 transition-all"
              >
                <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">{item.emoji}</span>
                <span className="text-[11px] sm:text-xs font-bold text-slate-700 text-center leading-tight">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-8 sm:mt-10 bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-base sm:text-lg font-bold mb-1">Ada pertanyaan?</h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                Hubungi tim customer service ArahInn 24 jam — kami siap bantu.
              </p>
            </div>
            <a
              href="https://wa.me/6285188136009"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              Chat WhatsApp
            </a>
          </div>
        </div>

        {/* Back to home link */}
        <div className="mt-8 sm:mt-10 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-5 sm:px-6 py-2.5 sm:py-3 text-slate-700 hover:text-brand text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Home ArahInn
          </Link>
        </div>
      </section>
    </div>
  )
}
