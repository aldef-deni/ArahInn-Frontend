import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { TravelFooterContext } from '@/contexts/TravelFooterContext'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { authApi, campaignApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import {
  Hotel, Search, List, User, LogOut, Menu, X,
  ChevronDown, Globe, Settings, LayoutDashboard,
  Phone, Mail, Smartphone, Building2, Sofa, Tag, Receipt, Star,
  Megaphone, CalendarDays, Plane, Ship, TrainFront, Sparkles,
} from 'lucide-react'
import CampaignDetailModal from '@/components/CampaignDetailModal'
import { cn, getImageUrl } from '@/utils'
import {
  getManagementPortalUrl,
  getOwnerPortalUrl,
  isManagementRole,
  isOwnerRole,
} from '@/utils/isExtranet'
import SupportChatWidget from '@/components/chat/SupportChatWidget'
import NotificationBell from '@/components/ui/NotificationBell'
import queryClient from '@/lib/queryClient'

const PENGELOLA_ROLES = ['superadmin', 'admin', 'owner', 'finance']

export default function UserLayout() {
  const { t, i18n } = useTranslation()
  const { user, token, logout, isAdmin } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { toast } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const [akomodasiOpen, setAkomodasiOpen] = useState(false) // accordion "Akomodasi" di drawer mobile
  // Moda transaksi travel aktif (di-set halaman pembayaran) → footer khusus pesawat
  const [travelModa, setTravelModa] = useState(null)
  // Footer khusus penerbangan: halaman pesawat (search/pesan), pembayaran tiket pesawat,
  // serta halaman info penerbangan (persyaratan/kebijakan/refund)
  const flightFooter = location.pathname.startsWith('/tiket/pesawat')
    || location.pathname.startsWith('/penerbangan')
    || (location.pathname.startsWith('/tiket/bayar') && travelModa === 'pesawat')
  // Footer khusus kapal laut (PELNI): halaman pelni, pembayaran tiket pelni, & FAQ kapal laut
  const pelniFooter = location.pathname.startsWith('/tiket/pelni')
    || location.pathname.startsWith('/kapal-laut')
    || (location.pathname.startsWith('/tiket/bayar') && travelModa === 'pelni')
  // Footer khusus kereta api (KAI): halaman kereta & pembayaran tiket kereta → mitra = KAI
  const keretaFooter = location.pathname.startsWith('/tiket/kereta')
    || (location.pathname.startsWith('/tiket/bayar') && travelModa === 'kereta')
  // Footer khusus Design Interior (deskripsi berbeda — sinergi dengan Dekorasi.Me)
  const interiorFooter = location.pathname.startsWith('/interior')

  // Campaign modal (dipicu dari footer "Campaign")
  const [campaignListOpen, setCampaignListOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const { data: campaigns = [] } = useQuery({
    queryKey: ['active-campaigns-footer'],
    queryFn: () => campaignApi.active().then(r => r.data?.data || []),
    staleTime: 5 * 60_000,
  })
  const openCampaign = () => {
    if (campaigns.length === 1) setSelectedCampaign(campaigns[0])
    else setCampaignListOpen(true)
  }

  const isPengelola = user && PENGELOLA_ROLES.includes(user.role)
  const managementHref = isOwnerRole(user?.role)
    ? getOwnerPortalUrl('/owner')
    : isManagementRole(user?.role)
      ? getManagementPortalUrl('/admin')
      : getManagementPortalUrl('/login')

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    queryClient.clear()
    navigate('/login')
    toast({ title: t('nav.logoutSuccess'), description: t('nav.logoutBye') })
  }

  const toggleLang = () => {
    const next = i18n.language === 'id' ? 'en' : 'id'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  // Struktur main menu. "Akomodasi" = dropdown 3 sub-menu. Profil TIDAK di main menu
  // (sudah ada di dropdown nama user). Promo diberi efek shimmer "kelap-kelip" elegan.
  const akomodasiChildren = [
    { to: '/search',   label: t('nav.cariPenginapan'),   icon: Search },
    { to: '/properti', label: t('nav.propertiJualBeli'), icon: Building2 },
    { to: '/interior', label: t('nav.jasaDesign'),       icon: Sofa },
  ]
  const navLinks = [
    { to: '/', label: t('nav.home'), icon: Hotel },
    { label: t('nav.akomodasi'), icon: Building2, children: akomodasiChildren },
    { to: '/tiket/pesawat', label: t('nav.tiketPesawat'), icon: Plane },
    { to: '/tiket/kereta',  label: t('nav.tiketKAI'),     icon: TrainFront },
    { to: '/tiket/pelni',   label: t('nav.tiketPelni'),   icon: Ship },
    { to: '/topup-tagihan', label: t('nav.topUpTagihan'), icon: Receipt },
    { to: '/promo',         label: t('nav.promo'),        icon: Tag, sparkle: true },
  ]
  const akomodasiActive = akomodasiChildren.some(c => location.pathname === c.to)

  return (
    <TravelFooterContext.Provider value={setTravelModa}>
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── Navbar ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container relative flex h-14 md:h-16 items-center justify-between">

          {/* Mobile hamburger — kiri (anchor sisi kiri di mobile) */}
          <button
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo — centered on mobile, left on desktop */}
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 flex items-center gap-2 shrink-0">
            <img src="/logo-arahin.png" alt="Arahinn" className="h-8 md:h-12 w-auto" />
          </Link>

          {/* Desktop nav */}
          {!isPengelola && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon
                // Dropdown "Akomodasi" (hover)
                if (item.children) {
                  return (
                    <div key={item.label} className="relative group">
                      <button className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1',
                        akomodasiActive
                          ? 'bg-brand/10 text-brand-700'
                          : 'text-muted-foreground group-hover:text-foreground group-hover:bg-muted'
                      )}>
                        {item.label}
                        <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
                      </button>
                      {/* pt-2 menjembatani jarak agar hover tidak putus */}
                      <div className="absolute left-0 top-full pt-2 hidden group-hover:block z-50">
                        <div className="w-60 bg-white border rounded-xl shadow-card-hover overflow-hidden animate-fade-in">
                          {item.children.map(({ to, label, icon: CIcon }) => (
                            <Link key={to} to={to}
                              className={cn(
                                'flex items-center gap-2.5 px-4 py-3 text-sm transition-colors',
                                location.pathname === to
                                  ? 'bg-brand/10 text-brand-700 font-medium'
                                  : 'text-foreground hover:bg-muted'
                              )}>
                              <CIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
                              {label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                }
                // Promo — efek shimmer "kelap-kelip" elegan
                if (item.sparkle) {
                  return (
                    <Link key={item.to} to={item.to}
                      className="relative ml-1 px-4 py-2 rounded-lg text-sm font-semibold text-amber-950 overflow-hidden shadow-sm ring-1 ring-amber-300/60 bg-[linear-gradient(110deg,#fbbf24,35%,#fff7cd,50%,#fbbf24,65%,#f59e0b)] bg-[length:200%_100%] animate-shimmer">
                      <span className="relative z-10 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        {item.label}
                      </span>
                    </Link>
                  )
                }
                // Link biasa
                return (
                  <Link key={item.to} to={item.to}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      location.pathname === item.to
                        ? 'bg-brand/10 text-brand-700'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}>
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-1 md:gap-2">

            {/* Notification bell — only for logged-in users */}
            {token && <NotificationBell />}

            {/* Language toggle — icon only on mobile */}
            <button onClick={toggleLang}
              className="flex items-center gap-1 px-2 md:px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
              <Globe className="w-4 h-4" />
              <span className="hidden md:inline uppercase font-medium">{i18n.language}</span>
            </button>

            {/* Desktop: user dropdown or auth links */}
            {token ? (
              <div className="relative hidden md:block">
                <button onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">{user?.name}</span>
                  <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', dropOpen && 'rotate-180')} />
                </button>

                {dropOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border rounded-xl shadow-card-hover z-50 overflow-hidden animate-fade-in">
                    <div className="px-4 py-3 border-b bg-muted/30">
                      <p className="text-sm font-semibold truncate">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    {user?.role === 'owner' ? (
                      <a href={managementHref} onClick={() => setDropOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-brand-700 font-medium">
                        <LayoutDashboard className="w-4 h-4" /> Extranet
                      </a>
                    ) : isAdmin() && (
                      <a href={managementHref} onClick={() => setDropOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-brand-700 font-medium">
                        <LayoutDashboard className="w-4 h-4" /> {t('nav.admin')}
                      </a>
                    )}
                    <Link to="/orders" onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                      <List className="w-4 h-4" /> {t('nav.orders')}
                    </Link>
                    <Link to="/poin" onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                      <Star className="w-4 h-4" /> {t('loyalty.title')}
                    </Link>
                    <Link to="/profile" onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                      <Settings className="w-4 h-4" /> {t('nav.profile')}
                    </Link>
                    <button onClick={() => { setDropOpen(false); handleLogout() }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 transition-colors border-t">
                      <LogOut className="w-4 h-4" /> {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login"
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {t('nav.login')}
                </Link>
                <Link to="/register"
                  className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm">
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile drawer ───────────────────────────────── */}
        {menuOpen && (
          <div className="md:hidden border-t bg-white animate-fade-in">

            {/* User info strip */}
            {token && (
              <div className="px-5 py-4 flex items-center gap-3 bg-muted/40 border-b">
                <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold shrink-0">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            )}

            {/* Nav links */}
            <div className="px-3 py-3 space-y-0.5">
              {!isPengelola && navLinks.map((item) => {
                const Icon = item.icon
                // Accordion "Akomodasi"
                if (item.children) {
                  return (
                    <div key={item.label}>
                      <button onClick={() => setAkomodasiOpen(o => !o)}
                        className={cn(
                          'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                          akomodasiActive ? 'bg-brand/10 text-brand-700' : 'text-foreground hover:bg-muted'
                        )}>
                        <span className="flex items-center gap-3"><Icon className="w-4 h-4 shrink-0" />{item.label}</span>
                        <ChevronDown className={cn('w-4 h-4 transition-transform', akomodasiOpen && 'rotate-180')} />
                      </button>
                      {akomodasiOpen && (
                        <div className="ml-5 pl-3 border-l border-muted space-y-0.5 mt-0.5">
                          {item.children.map(({ to, label, icon: CIcon }) => (
                            <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                              className={cn(
                                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                                location.pathname === to ? 'bg-brand/10 text-brand-700' : 'text-foreground hover:bg-muted'
                              )}>
                              <CIcon className="w-4 h-4 shrink-0" />{label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }
                // Link biasa (Promo diberi gradien + sparkle)
                return (
                  <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                      item.sparkle
                        ? 'bg-gradient-to-r from-amber-300 to-amber-500 text-amber-950 font-semibold shadow-sm'
                        : location.pathname === item.to
                        ? 'bg-brand/10 text-brand-700'
                        : 'text-foreground hover:bg-muted'
                    )}>
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                    {item.sparkle && <Sparkles className="w-4 h-4 ml-auto animate-pulse" />}
                  </Link>
                )
              })}

              {token && user?.role === 'owner' && (
                <a href={managementHref} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-brand-700 hover:bg-brand/10 transition-colors">
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  Extranet
                </a>
              )}
              {token && isAdmin() && user?.role !== 'owner' && (
                <a href={managementHref} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-brand-700 hover:bg-brand/10 transition-colors">
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  {t('nav.admin')}
                </a>
              )}
            </div>

            {/* Bottom actions */}
            <div className="px-3 pt-2 pb-4 border-t space-y-0.5">
              <button
                onClick={() => { toggleLang(); setMenuOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors">
                <Globe className="w-4 h-4 shrink-0" />
                {i18n.language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa'}
              </button>

              {token ? (
                <button onClick={() => { setMenuOpen(false); handleLogout() }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4 shrink-0" />
                  {t('nav.logout')}
                </button>
              ) : (
                <div className="flex gap-2 pt-2 px-1">
                  <Link to="/login" onClick={() => setMenuOpen(false)}
                    className="flex-1 py-3 text-center rounded-xl border border-input text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                    {t('nav.login')}
                  </Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)}
                    className="flex-1 py-3 text-center rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-700 transition-colors">
                    {t('nav.register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="flex-1 page-enter">
        <Outlet />
      </main>

      {/* ── App & Newsletter Banner ──────────────────────── */}
      {false && !isPengelola && (
        <section className="relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/hotel02.jpg')" }} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d2137]/95 via-[#0f2744]/90 to-[#0d2137]/80" />

          <div className="relative container py-12 lg:py-16">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

              {/* Phone mockup */}
              <div className="hidden lg:flex shrink-0 items-end justify-center w-44 h-72">
                <div className="w-full h-full bg-white/10 border-2 border-white/20 rounded-[2rem] flex flex-col items-center justify-center gap-3 shadow-2xl backdrop-blur-sm">
                  <Smartphone className="w-12 h-12 text-white/50" />
                  <span className="text-white/40 text-xs font-medium">ArahInn App</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col md:flex-row gap-10 md:gap-14">

                {/* Newsletter */}
                <div className="flex-1">
                  <h3 className="text-white font-bold text-xl lg:text-2xl leading-snug mb-5">
                    Dapatkan info terbaru seputar tips perjalanan, rekomendasi, serta promo.
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="email" placeholder="Alamat emailmu"
                        className="w-full pl-9 pr-4 py-3 rounded-xl text-sm bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
                    </div>
                    <button className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shadow-sm">
                      Berlangganan Newsletter
                    </button>
                  </div>
                </div>

                {/* App download */}
                <div className="flex-1">
                  <p className="text-white font-bold text-xl lg:text-2xl leading-snug mb-5">
                    Semua pesanan dalam genggaman, selalu siap jalan-jalan.{' '}
                    <span className="text-orange-400">Pakai ArahInn App.</span>
                  </p>
                  <div className="flex items-center gap-4">
                    {/* QR placeholder */}
                    <div className="w-16 h-16 bg-white rounded-xl p-1.5 shrink-0">
                      <div className="w-full h-full bg-slate-100 rounded-lg grid grid-cols-5 gap-px p-1">
                        {Array(25).fill(0).map((_, i) => (
                          <div key={i} className={`rounded-[1px] ${[0,1,2,5,7,10,12,14,17,19,22,23,24].includes(i) ? 'bg-slate-800' : 'bg-white'}`} />
                        ))}
                      </div>
                    </div>
                    {/* Store badges */}
                    <div className="flex flex-col gap-2">
                      <a href="https://play.google.com/store/apps/details?id=com.arahinn.mobile&hl=id" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-4 py-2 bg-black/80 hover:bg-black text-white rounded-xl transition-colors shadow-sm border border-white/10">
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.76c.3.17.64.24.99.2l11.94-11.95L12.38 9.3 3.18 23.76zm16.49-10.69L16.8 11.4l-3.28 3.28 3.28 3.28 2.89-1.69c.82-.48.82-1.72-.02-2.2zM3.03.25C2.7.62 2.5 1.16 2.5 1.85v20.29c0 .69.2 1.23.53 1.6l.07.07L14.05 12.8v-.27L3.1.18l-.07.07zm9.35 9.05l2.72 2.71-2.72 2.72L9.66 12.3l2.72-2.99z"/></svg>
                        <div className="leading-tight text-left">
                          <p className="text-[9px] text-slate-300">GET IT ON</p>
                          <p className="text-xs font-semibold">Google Play</p>
                        </div>
                      </a>
                      <a href="https://apps.apple.com/us/app/arahinn/id6773062198" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-4 py-2 bg-black/80 hover:bg-black text-white rounded-xl transition-colors shadow-sm border border-white/10">
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.42.07 2.41.74 3.24.8 1.23-.24 2.41-.94 3.72-.84 1.58.13 2.77.71 3.56 1.86-3.25 1.94-2.49 5.89.48 7.03-.57 1.44-1.31 2.88-3 3.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                        <div className="leading-tight text-left">
                          <p className="text-[9px] text-slate-300">Download on the</p>
                          <p className="text-xs font-semibold">App Store</p>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ───────────────────────────────────────── */}
      {!isPengelola && <footer className="bg-white border-t border-slate-200">
        {/* Main grid */}
        <div className="container py-12 flex flex-col md:flex-row gap-10">
          <div className="md:w-[520px] shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo-arahin.png" alt="Arahinn" className="h-10 w-auto" />
            </div>
            <p className="text-slate-500 text-sm leading-relaxed text-justify whitespace-pre-line">
              {t(interiorFooter ? 'footer.interiorDescription' : pelniFooter ? 'footer.pelniDescription' : flightFooter ? 'footer.flightDescription' : keretaFooter ? 'footer.keretaDescription' : 'footer.description')}
            </p>
          </div>
          <div className="md:ml-auto flex flex-col sm:flex-row gap-12 lg:gap-16">
          <div>
            <h4 className="font-display font-bold text-xl text-brand-800 mb-4">{t('footer.services')}</h4>
            {interiorFooter ? (
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li><Link to="/interior/layanan-kemitraan" className="hover:text-brand transition-colors">{t('footer.interiorPartnership')}</Link></li>
              <li><Link to="/interior/keunggulan-biaya" className="hover:text-brand transition-colors">{t('footer.interiorAdvantage')}</Link></li>
              <li><Link to="/interior/pemesanan-teknis" className="hover:text-brand transition-colors">{t('footer.interiorProcess')}</Link></li>
            </ul>
            ) : pelniFooter ? (
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li><Link to="/kapal-laut/faq" className="hover:text-brand transition-colors">{t('footer.pelniFaq')}</Link></li>
              <li><Link to="/kapal-laut/seawifi" className="hover:text-brand transition-colors">{t('footer.seawifiFaq')}</Link></li>
              <li><Link to="/kapal-laut/faq#pembatalan" className="hover:text-brand transition-colors">{t('footer.pelniCancel')}</Link></li>
              <li><Link to="/kapal-laut/faq#bagasi" className="hover:text-brand transition-colors">{t('footer.pelniBaggage')}</Link></li>
            </ul>
            ) : flightFooter ? (
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li><Link to="/penerbangan/persyaratan" className="hover:text-brand transition-colors">{t('footer.flightRequirements')}</Link></li>
              <li><Link to="/penerbangan/kebijakan" className="hover:text-brand transition-colors">{t('footer.flightPolicy')}</Link></li>
              <li><Link to="/penerbangan/refund" className="hover:text-brand transition-colors">{t('footer.refundPolicy')}</Link></li>
            </ul>
            ) : keretaFooter ? (
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li><Link to="/tiket/kereta/syarat-ketentuan" className="hover:text-brand transition-colors">{t('footer.terms')}</Link></li>
            </ul>
            ) : (
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li><Link to="/search" className="hover:text-brand transition-colors">{t('footer.searchHotel')}</Link></li>
              <li>
                <button type="button" onClick={openCampaign} className="hover:text-brand transition-colors text-left">
                  {t('footer.campaign')}
                </button>
              </li>
              <li><Link to="/promo" className="hover:text-brand transition-colors">{t('footer.specialPromo')}</Link></li>
              <li><Link to="/poin" className="hover:text-brand transition-colors">{t('footer.loyaltyProgram')}</Link></li>
            </ul>
            )}
          </div>
          <div>
            <h4 className="font-display font-bold text-xl text-brand-800 mb-4">{t('footer.help')}</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li><Link to="/pusat-bantuan" className="hover:text-brand transition-colors">{t('footer.helpCenter')}</Link></li>
              {!keretaFooter && <li><Link to="/syarat-ketentuan" className="hover:text-brand transition-colors">{t('footer.terms')}</Link></li>}
              <li><Link to="/privacy-policy" className="hover:text-brand transition-colors">{t('footer.privacy')}</Link></li>
              <li><Link to="/hubungi-kami" className="hover:text-brand transition-colors">{t('footer.contactLink')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-xl text-brand-800 mb-4">{t('footer.followUs')}</h4>
            <ul className="space-y-3">
              <li>
                <a href="https://www.facebook.com/profile.php?id=61566216437107&mibextid=ZbWKwL"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-slate-500 hover:text-brand transition-colors group">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-brand/10 flex items-center justify-center shrink-0 transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </span>
                  Facebook
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/arah_inn?igsh=MXJ1OGRnMzJuNDJibg=="
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-slate-500 hover:text-brand transition-colors group">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-brand/10 flex items-center justify-center shrink-0 transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </span>
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://www.tiktok.com/@arahinn.com?_r=1&_t=ZS-95yFxJBKchW"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-slate-500 hover:text-brand transition-colors group">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-brand/10 flex items-center justify-center shrink-0 transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
                    </svg>
                  </span>
                  TikTok
                </a>
              </li>
            </ul>
          </div>
          </div>
        </div>

        {/* Partners & Payment Methods */}
        <div className="border-t border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
          <div className="container py-10 grid md:grid-cols-2 gap-10">
            {/* Our Partners */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="h-px flex-1 bg-gradient-to-r from-brand/30 to-transparent" />
                <h4 className="text-xs font-bold text-brand-800 uppercase tracking-[0.18em]">{t('footer.ourPartners')}</h4>
                <span className="h-px flex-1 bg-gradient-to-l from-brand/30 to-transparent" />
              </div>
              <div className={flightFooter ? 'grid grid-cols-4 gap-2 sm:gap-3 max-w-lg mx-auto' : 'flex flex-wrap items-center justify-center gap-5 sm:gap-6'}>
                {/* Footer pesawat: 8 maskapai → 4 per baris. Kapal laut: PELNI. Kereta: KAI. Lainnya: mitra default. */}
                {(flightFooter
                  ? ['garuda.png','lion.png','batik.png','wings.png','nam.png','citilink.png','sriwijaya.png','airasia.png']
                  : pelniFooter
                  ? ['pelni.png']
                  : keretaFooter
                  ? ['kai.png']
                  : ['akr.png','bawono.png','scp.png','dekorasi.png','ruangsinggah.png']).map(f => (
                  <div
                    key={f}
                    className={`relative flex items-center justify-center rounded-xl bg-white border border-slate-200/70 ${flightFooter ? 'w-full h-14 sm:h-20 px-1.5 sm:px-2.5 py-1.5 sm:py-2' : (pelniFooter || keretaFooter) ? 'h-20 px-8 py-2 max-w-[240px]' : 'h-16 w-16 p-1'}`}
                  >
                    <img
                      src={`/our-partners/${f}`}
                      alt={f.replace(/\.[^.]+$/, '')}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Transaksi Pembayaran */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="h-px flex-1 bg-gradient-to-r from-amber-400/40 to-transparent" />
                <h4 className="text-xs font-bold text-brand-800 uppercase tracking-[0.18em]">{t('footer.paymentTransaction')}</h4>
                <span className="h-px flex-1 bg-gradient-to-l from-amber-400/40 to-transparent" />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {[
                  { src: '/banks/bca.png',     alt: 'BCA' },
                  { src: '/banks/mandiri.png', alt: 'Mandiri' },
                  { src: '/banks/bri.svg',     alt: 'BRI' },
                  { src: '/banks/bank_bsi.png',alt: 'BSI' },
                ].map(b => (
                  <div
                    key={b.alt}
                    className="group relative h-16 w-24 flex items-center justify-center rounded-xl bg-white border border-slate-200/70 px-3 transition-all duration-300 ease-out hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-400/10 hover:-translate-y-0.5"
                  >
                    <img
                      src={b.src}
                      alt={b.alt}
                      loading="lazy"
                      className="max-h-9 max-w-full object-contain transition-transform duration-300 ease-out group-hover:scale-110"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 text-center mt-4">
                {t('footer.paymentSecure')} <span className="font-semibold text-slate-500">DOKU Payment Gateway</span>
              </p>
            </div>
          </div>
        </div>

        {/* Contact & App Store bar */}
        <div className="border-t border-slate-100">
          <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-5">

            {/* Kontak CS */}
            <div className="flex flex-wrap items-center gap-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('footer.contactUs')}</p>
              <a href="tel:+6285188136009"
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand transition-colors">
                <span className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5 text-brand" />
                </span>
                +62851-8813-6009
              </a>
              <a href="mailto:help@arahinn.com"
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand transition-colors">
                <span className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-brand" />
                </span>
                help@arahinn.com
              </a>
            </div>

            {/* App Store Badges */}
            <div className="flex items-center gap-3">
              <a href="https://apps.apple.com/us/app/arahinn/id6773062198" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-sm">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.42.07 2.41.74 3.24.8 1.23-.24 2.41-.94 3.72-.84 1.58.13 2.77.71 3.56 1.86-3.25 1.94-2.49 5.89.48 7.03-.57 1.44-1.31 2.88-3 3.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <div className="text-left leading-tight">
                  <p className="text-[9px] text-slate-300">Download on the</p>
                  <p className="text-xs font-semibold">App Store</p>
                </div>
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.arahinn.mobile&hl=id" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-sm">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.18 23.76c.3.17.64.24.99.2l11.94-11.95L12.38 9.3 3.18 23.76zm16.49-10.69L16.8 11.4l-3.28 3.28 3.28 3.28 2.89-1.69c.82-.48.82-1.72-.02-2.2zM3.03.25C2.7.62 2.5 1.16 2.5 1.85v20.29c0 .69.2 1.23.53 1.6l.07.07L14.05 12.8v-.27L3.1.18l-.07.07zm9.35 9.05l2.72 2.71-2.72 2.72L9.66 12.3l2.72-2.99z"/>
                </svg>
                <div className="text-left leading-tight">
                  <p className="text-[9px] text-slate-300">Get it on</p>
                  <p className="text-xs font-semibold">Google Play</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-200">
          <div className="container py-4 flex justify-center items-center text-xs text-slate-400">
            <p>© 2026 PT. Redy Hospitality Management. {t('footer.copyright')}</p>
          </div>
        </div>
      </footer>}

      {/* Live Chat Widget — customer ke CS Arahinn */}
      <SupportChatWidget />

      {/* Dropdown backdrop */}
      {dropOpen && <div className="fixed inset-0 z-40" onClick={() => setDropOpen(false)} />}

      {/* Modal daftar Campaign aktif (dipicu footer "Campaign") */}
      {campaignListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setCampaignListOpen(false)}>
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto scrollbar-hide"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 border-b border-slate-100">
              <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-orange-500" /> {t('footer.campaignTitle')}
              </h3>
              <button onClick={() => setCampaignListOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            {campaigns.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-slate-500">{t('footer.campaignNone')}</p>
            ) : (
              <div className="p-4 space-y-3">
                {campaigns.map(c => (
                  <button key={c.id} onClick={() => { setSelectedCampaign(c); setCampaignListOpen(false) }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:border-orange-300 hover:bg-orange-50/40 text-left transition-colors">
                    <div className="w-20 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                      {getImageUrl(c.image || c.banner)
                        ? <img src={getImageUrl(c.image || c.banner)} alt={c.title} className="w-full h-full object-cover" />
                        : <Megaphone className="w-6 h-6 text-slate-300" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-slate-900 line-clamp-1">{c.title}</p>
                      {Number(c.discountPercent) > 0 && (
                        <span className="inline-block mt-1 text-[11px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                          {Number(c.discountPercent)}% OFF
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedCampaign && <CampaignDetailModal campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} />}
    </div>
    </TravelFooterContext.Provider>
  )
}
