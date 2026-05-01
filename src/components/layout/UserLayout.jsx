import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import {
  Hotel, Search, List, User, LogOut, Menu, X,
  ChevronDown, Globe, Settings, LayoutDashboard,
  Phone, Mail, Smartphone,
} from 'lucide-react'
import { cn } from '@/utils'
import ChatWidget from '@/components/chat/ChatWidget'
import NotificationBell from '@/components/ui/NotificationBell'

const PENGELOLA_ROLES = ['superadmin', 'admin', 'owner', 'finance']

export default function UserLayout() {
  const { t, i18n } = useTranslation()
  const { user, token, logout, isAdmin } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { toast } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)

  const isPengelola = user && PENGELOLA_ROLES.includes(user.role)

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/login')
    toast({ title: t('nav.logoutSuccess'), description: t('nav.logoutBye') })
  }

  const toggleLang = () => {
    const next = i18n.language === 'id' ? 'en' : 'id'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  const navLinks = [
    { to: '/',       label: t('nav.home'),    icon: Hotel },
    { to: '/search', label: t('nav.search'),  icon: Search },
    ...(token ? [
      { to: '/orders',  label: t('nav.orders'),  icon: List },
      { to: '/profile', label: t('nav.profile'), icon: User },
    ] : []),
  ]

  const mobileNavLinks = navLinks.filter(l => l.to !== '/search')

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── Navbar ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container relative flex h-14 md:h-16 items-center justify-between">

          {/* Logo — centered on mobile, left on desktop */}
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="Arahinn" className="h-8 md:h-12 w-auto" />
            <span className="font-display font-bold text-brand-800">
              <span className="md:hidden text-base tracking-wide">ARAHINN</span>
              <span className="hidden md:inline text-xl">ArahInn<span className="text-brand">.com</span></span>
            </span>
          </Link>

          {/* Desktop nav */}
          {!isPengelola && (
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
                      <Link to="/owner" onClick={() => setDropOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-brand-700 font-medium">
                        <LayoutDashboard className="w-4 h-4" /> Extranet
                      </Link>
                    ) : isAdmin() && (
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
              <div className="hidden md:flex items-center gap-2">
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

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
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
              {!isPengelola && mobileNavLinks.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                    location.pathname === to
                      ? 'bg-brand/10 text-brand-700'
                      : 'text-foreground hover:bg-muted'
                  )}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              ))}

              {token && user?.role === 'owner' && (
                <Link to="/owner" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-brand-700 hover:bg-brand/10 transition-colors">
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  Extranet
                </Link>
              )}
              {token && isAdmin() && user?.role !== 'owner' && (
                <Link to="/admin" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-brand-700 hover:bg-brand/10 transition-colors">
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  {t('nav.admin')}
                </Link>
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

      {/* ── Footer ───────────────────────────────────────── */}
      {!isPengelola && <footer className="bg-white border-t border-slate-200 mt-16">
        {/* Main grid */}
        <div className="container py-12 flex flex-col md:flex-row gap-10">
          <div className="md:w-[520px] shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Arahinn" className="h-10 w-auto" />
              <span className="font-display font-bold text-xl text-brand-800">
                ArahInn<span className="text-brand">.com</span>
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed text-justify">
              {t('footer.description')}
            </p>
          </div>
          <div className="md:ml-auto flex flex-col sm:flex-row gap-12 lg:gap-16">
          <div>
            <h4 className="font-display font-bold text-xl text-brand-800 mb-4">{t('footer.services')}</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              {[t('footer.searchHotel'), t('footer.flashSale'), t('footer.specialPromo'), t('footer.loyaltyProgram')].map(l => (
                <li key={l}><a href="#" className="hover:text-brand transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-xl text-brand-800 mb-4">{t('footer.help')}</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              {[t('footer.helpCenter'), t('footer.terms'), t('footer.privacy'), t('footer.contactLink')].map(l => (
                <li key={l}><a href="#" className="hover:text-brand transition-colors">{l}</a></li>
              ))}
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
              <a href="#"
                className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-sm">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.42.07 2.41.74 3.24.8 1.23-.24 2.41-.94 3.72-.84 1.58.13 2.77.71 3.56 1.86-3.25 1.94-2.49 5.89.48 7.03-.57 1.44-1.31 2.88-3 3.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <div className="text-left leading-tight">
                  <p className="text-[9px] text-slate-300">Download on the</p>
                  <p className="text-xs font-semibold">App Store</p>
                </div>
              </a>
              <a href="#"
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
          <div className="container py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-400">
            <p>© 2026 ArahInn.com. {t('footer.copyright')}</p>
            <p>Made with ❤️ in Indonesia</p>
          </div>
        </div>
      </footer>}

      {/* LiveChat Widget */}
      {token && <ChatWidget />}

      {/* Dropdown backdrop */}
      {dropOpen && <div className="fixed inset-0 z-40" onClick={() => setDropOpen(false)} />}
    </div>
  )
}
