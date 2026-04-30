import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import {
  LayoutDashboard, Hotel, ShoppingBag, BarChart2,
  Users, UserCog, Tag, LogOut, Menu, X, Bell, User
} from 'lucide-react'
import { cn, roleLabel } from '@/utils'

const navItems = [
  { to: '/admin',                      label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/hotels',               label: 'Hotel',     icon: Hotel },
  { to: '/admin/orders',               label: 'Pesanan',   icon: ShoppingBag },
  { to: '/admin/reports',              label: 'Laporan',   icon: BarChart2 },
  { to: '/admin/users',                label: 'Pengelola', icon: UserCog },
  { to: '/admin/users?section=pengguna', label: 'Pengguna',  icon: Users },
  { to: '/admin/promos',               label: 'Promo',     icon: Tag },
]

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate         = useNavigate()
  const location         = useLocation()
  const { toast }        = useToast()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/login')
    toast({ title: 'Berhasil keluar.' })
  }

  const isActive = (to, exact) => {
    const [path, qs] = to.split('?')
    if (exact) return location.pathname === path && !location.search
    if (qs) {
      const param = new URLSearchParams(qs)
      const cur   = new URLSearchParams(location.search)
      return location.pathname.startsWith(path) &&
        [...param.entries()].every(([k,v]) => cur.get(k) === v)
    }
    if (location.pathname.startsWith(path)) {
      // Jika ada nav lain yang lebih spesifik (dengan search param) dan aktif, ini tidak aktif
      if (path === '/admin/users' && location.search.includes('section=')) return false
      return true
    }
    return false
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-brand-900 text-white transition-all duration-300 shadow-2xl',
        collapsed ? 'w-16' : 'w-60'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
          <img src="/logo.png" alt="Arahinn" className={cn('w-auto shrink-0', collapsed ? 'h-7' : 'h-8')} />
          {!collapsed && (
            <span className="font-display font-bold text-lg tracking-wide">ARAHINN</span>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0">
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto custom-scroll">
          {navItems.map(({ to, label, icon: Icon, exact }, idx) => (
            <Link key={idx} to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive(to, exact)
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              )}
              title={collapsed ? label : undefined}>
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && label}
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-white/10">
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-blue-300 truncate">{roleLabel(user?.role)}</p>
              </div>
            )}
          </div>
          <Link to="/profile"
            className={cn(
              'mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-colors',
              collapsed && 'justify-center'
            )}
            title={collapsed ? 'Profil' : undefined}>
            <User className="w-4 h-4 shrink-0" />
            {!collapsed && 'Profil'}
          </Link>
          <button onClick={handleLogout}
            className={cn(
              'mt-1 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors',
              collapsed && 'justify-center'
            )}
            title={collapsed ? 'Keluar' : undefined}>
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && 'Keluar'}
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────── */}
      <div className={cn('flex-1 flex flex-col transition-all duration-300', collapsed ? 'ml-16' : 'ml-60')}>
        {/* Top bar */}
        <header className="sticky top-0 z-40 h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {navItems.find(n => isActive(n.to, n.exact))?.label || 'Admin'}
            </h1>
            <p className="text-xs text-muted-foreground">Panel Manajemen OTA System</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
