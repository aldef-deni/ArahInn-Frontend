import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import {
  Hotel, Search, List, User, LogOut, LogIn, Menu, X,
  ChevronDown, Globe, Bell, Settings, LayoutDashboard
} from 'lucide-react'
import { cn } from '@/utils'
import ChatWidget from '@/components/chat/ChatWidget'

export default function UserLayout() {
  const { t, i18n } = useTranslation()
  const { user, token, logout, isAdmin } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { toast } = useToast()
  const [menuOpen, setMenuOpen]     = useState(false)
  const [dropOpen, setDropOpen]     = useState(false)

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/login')
    toast({ title: 'Berhasil keluar.', description: 'Sampai jumpa!' })
  }

  const toggleLang = () => {
    const next = i18n.language === 'id' ? 'en' : 'id'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  const navLinks = [
    { to: '/',       label: t('nav.home'),   icon: Hotel },
    { to: '/search', label: t('nav.search'), icon: Search },
    ...(token ? [
      { to: '/orders',  label: t('nav.orders'),  icon: List },
      { to: '/profile', label: t('nav.profile'), icon: User },
    ] : []),
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Navbar ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Arahinn" className="h-12 w-auto" />
            <span className="font-display font-bold text-xl text-brand-800">
              Arahinn<span className="text-brand">.com</span>
            </span>
          </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === to
                    ? 'bg-brand/10 text-brand-700'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button onClick={toggleLang}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
              <Globe className="w-4 h-4" />
              <span className="uppercase font-medium">{i18n.language}</span>
            </button>

            {token ? (
              <div className="relative">
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
                    {isAdmin() && (
                      <Link to="/admin" onClick={() => setDropOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-brand-700 font-medium">
                        <LayoutDashboard className="w-4 h-4" /> {t('nav.admin')}
                      </Link>
                    )}
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
              <div className="flex items-center gap-2">
                <Link to="/login"
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {t('nav.login')}
                </Link>
                <Link to="/register"
                  className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-brand/30 shadow-sm">
                  {t('nav.register')}
                </Link>
              </div>
            )}

            {/* Mobile menu */}
            <button className="md:hidden p-2 rounded-lg hover:bg-muted" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-3 space-y-1 animate-fade-in">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === to ? 'bg-brand/10 text-brand-700' : 'text-muted-foreground hover:bg-muted'
                )}>
                <Icon className="w-4 h-4" />{label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="flex-1 page-enter">
        <Outlet />
      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="bg-brand-900 text-white mt-16">
        <div className="container py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Hotel className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl">ARAHINN</span>
            </div>
            <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
              Platform pemesanan hotel terpercaya di Indonesia. Temukan akomodasi terbaik dengan harga yang tidak perlu diragukan lagi.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-blue-300">Layanan</h4>
            <ul className="space-y-2 text-sm text-blue-200">
              {['Cari Hotel','Flash Sale','Promo Spesial','Loyalty Program'].map(l => (
                <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-blue-300">Bantuan</h4>
            <ul className="space-y-2 text-sm text-blue-200">
              {['Pusat Bantuan','Syarat & Ketentuan','Kebijakan Privasi','Hubungi Kami'].map(l => (
                <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="container py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-blue-300">
            <p>© 2025 Arahinn.com. Semua hak dilindungi.</p>
            <p>Made with ❤️ in Indonesia</p>
          </div>
        </div>
      </footer>

      {/* LiveChat Widget */}
      {token && <ChatWidget />}

      {/* Dropdown backdrop */}
      {dropOpen && <div className="fixed inset-0 z-40" onClick={() => setDropOpen(false)} />}
    </div>
  )
}
