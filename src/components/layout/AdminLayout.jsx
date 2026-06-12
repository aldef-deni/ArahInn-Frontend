import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { authApi, chatApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import {
  LayoutDashboard, Hotel, ShoppingBag, BarChart2, BarChart3,
  Users, UserCog, Tag, LogOut, Menu, X, User,
  FileText, CreditCard, Building2, Megaphone, ChevronDown, MessageSquare,
  CalendarDays, Sofa, Headphones, Shield, Receipt, Settings, Ticket, TrendingUp,
} from 'lucide-react'
import { cn, roleLabel, getImageUrl } from '@/utils'
import NotificationBell from '@/components/ui/NotificationBell'
import queryClient from '@/lib/queryClient'

/* ────────────────────────────────────────────────────────────────────── */
/* NAV SCHEMA — section-based                                            */
/*                                                                        */
/* Item bisa berupa:                                                      */
/*   - { type: 'section', label }            → header label section       */
/*   - { to, label, icon, exact }            → link biasa                 */
/*   - { type: 'group', label, icon, key,    → nested collapsible group   */
/*       children: [...] }                                                */
/* ────────────────────────────────────────────────────────────────────── */
const NAV_ADMIN = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },

  { type: 'section', label: 'Properti' },
  { to: '/admin/hotels',            label: 'Akomodasi',             icon: Hotel },
  { to: '/admin/orders',            label: 'Pesanan',               icon: ShoppingBag },
  { to: '/admin/property-approval', label: 'Jual - Beli Properti',  icon: Building2 },
  { to: '/admin/interior',          label: 'Design Interior',       icon: Sofa },
  { to: '/admin/harga',             label: 'Harga & Ketersediaan',  icon: CalendarDays },
  { to: '/admin/ppob',              label: 'PPOB Monitoring',       icon: Receipt },
  { to: '/admin/travel',            label: 'Tiket Travel',          icon: Ticket },
  {
    type: 'group',
    key: 'promo',
    label: 'Promo & Campaign',
    icon: Tag,
    children: [
      { to: '/admin/promos',    label: 'Promo',    icon: Tag },
      { to: '/admin/campaigns', label: 'Campaign', icon: Megaphone },
    ],
  },
  { type: 'section', label: 'User Management' },
  { to: '/admin/users',                  label: 'Pengelola',       icon: UserCog },
  { to: '/admin/owners',                 label: 'Owner Akomodasi', icon: Building2 },
  { to: '/admin/users?section=pengguna', label: 'Customer',        icon: Users },
  { to: '/admin/mm-handler',             label: 'MM Handler',      icon: UserCog },
  { to: '/admin/reviews',                label: 'Review Tamu',     icon: MessageSquare },

  { type: 'section', label: 'System' },
  { to: '/admin/reports',                label: 'Laporan',         icon: BarChart2 },
  { to: '/admin/finance/profit',         label: 'Laba Platform',   icon: TrendingUp },
  { to: '/admin/analytics',              label: 'Analytics',       icon: BarChart3 },
  { to: '/admin/settings',               label: 'Pengaturan',      icon: Settings },
]

const NAV_MARKET_MANAGER = [
  { to: '/admin',               label: 'Dashboard',           icon: LayoutDashboard, exact: true },
  { to: '/admin/owners',        label: 'Owner Akomodasi',     icon: Building2 },
  { to: '/admin/hotels',        label: 'Akomodasi',           icon: Hotel },
  { to: '/admin/orders',        label: 'Pesanan',             icon: ShoppingBag },
  { to: '/admin/reports',       label: 'Laporan',             icon: BarChart2 },
  {
    type: 'group',
    key: 'promo',
    label: 'Promo & Campaign',
    icon: Tag,
    children: [
      { to: '/admin/promos',    label: 'Promo',    icon: Tag },
      { to: '/admin/campaigns', label: 'Campaign', icon: Megaphone },
    ],
  },
  { to: '/admin/property-approval', label: 'Jual - Beli Properti', icon: Building2 },
]

const NAV_FINANCE = [
  { to: '/admin',                     label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { to: '/admin/orders',              label: 'Transaksi',     icon: CreditCard },
  { to: '/admin/reports',             label: 'Lap. Keuangan', icon: BarChart2 },
  { to: '/admin/finance/profit',      label: 'Laba Platform', icon: TrendingUp },
  { to: '/admin/finance/invoices',    label: 'Invoice',       icon: FileText },
]

const NAV_DESIGN_INTERIOR = [
  { to: '/admin',          label: 'Dashboard',       icon: LayoutDashboard, exact: true },
  { to: '/admin/interior', label: 'Design Interior', icon: Sofa },
]

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate         = useNavigate()
  const location         = useLocation()
  const { toast }        = useToast()
  const [collapsed, setCollapsed] = useState(false)

  const isFinance         = user?.role === 'finance'
  const isMarketManager   = user?.role === 'admin'
  const isDesignInterior  = user?.role === 'design_interior'
  const isSuperadmin      = user?.role === 'superadmin'
  const navItems          = isDesignInterior ? NAV_DESIGN_INTERIOR
                          : isFinance        ? NAV_FINANCE
                          : isMarketManager  ? NAV_MARKET_MANAGER
                          : NAV_ADMIN

  // Open state untuk masing-masing group dropdown (key-based)
  const groupRoutes = {
    promo: ['/admin/promos', '/admin/campaigns'],
  }
  const [openGroups, setOpenGroups] = useState(() => {
    const init = {}
    Object.entries(groupRoutes).forEach(([key, routes]) => {
      init[key] = routes.some(p => location.pathname.startsWith(p))
    })
    return init
  })
  const toggleGroup = (key) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }))

  // Hitung unread support chat untuk badge di menu "Live Chat Customer"
  const canSeeSupportChat = !isFinance && !isDesignInterior
  const { data: supportRooms } = useQuery({
    queryKey: ['admin-support-rooms'],
    queryFn : () => chatApi.supportAdminList({ limit: 100 }).then(r => r.data?.data || []),
    enabled : canSeeSupportChat,
    refetchInterval: 15000,
  })
  const supportUnread = supportRooms?.reduce((s, r) => s + Number(r.unreadCount || 0), 0) || 0

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    queryClient.clear()
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
      if (path === '/admin/users' && location.search.includes('section=')) return false
      return true
    }
    return false
  }

  /* ─── Reusable link button styles ─── */
  const linkBase   = 'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200'
  const linkIdle   = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  const linkActive = 'bg-blue-600 text-white shadow-md shadow-blue-600/20'

  /* ─── Render one nav item ─── */
  const renderItem = (item, idx) => {
    // Section header
    if (item.type === 'section') {
      if (collapsed) {
        return <div key={`sec-${idx}`} className="my-2 mx-3 border-t border-slate-200/70" />
      }
      return (
        <p
          key={`sec-${idx}`}
          className="pt-4 pb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 select-none"
        >
          {item.label}
        </p>
      )
    }

    // Collapsible group
    if (item.type === 'group') {
      const GroupIcon   = item.icon
      const isGroupOpen = openGroups[item.key]
      const groupActive = item.children.some(c => isActive(c.to, c.exact))
      return (
        <div key={`grp-${idx}`}>
          <button
            onClick={() => toggleGroup(item.key)}
            className={cn(
              linkBase,
              'w-full',
              groupActive ? linkActive : linkIdle
            )}
            title={collapsed ? item.label : undefined}
          >
            <GroupIcon className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', isGroupOpen && 'rotate-180')} />
              </>
            )}
          </button>
          {isGroupOpen && !collapsed && (
            <div className="mt-1 ml-5 space-y-0.5 border-l-2 border-slate-200 pl-3 animate-fade-in">
              {item.children.map(({ to, label, icon: ChildIcon }, cidx) => (
                <Link
                  key={cidx}
                  to={to}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                    isActive(to)
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  )}
                >
                  <ChildIcon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>
      )
    }

    // Regular link
    const { to, label, icon: Icon, exact } = item
    const active = isActive(to, exact)
    return (
      <Link
        key={`lnk-${idx}`}
        to={to}
        className={cn(linkBase, active ? linkActive : linkIdle)}
        title={collapsed ? label : undefined}
      >
        <Icon className="w-[18px] h-[18px] shrink-0" />
        {!collapsed && <span className="flex-1">{label}</span>}
      </Link>
    )
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 shadow-sm',
        collapsed ? 'w-16' : 'w-64'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-200 shrink-0 bg-white">
          <div className={cn(
            'flex items-center justify-center rounded-xl shrink-0',
            collapsed ? 'h-8 w-8' : 'h-10 px-1'
          )}>
            <img
              src="/logo-arahin.png"
              alt="Arahinn"
              className={cn('w-auto object-contain', collapsed ? 'h-6' : 'h-8')}
            />
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav scrollable */}
        <nav className="flex-1 py-3 px-2.5 overflow-y-auto custom-scroll space-y-0.5">
          {navItems.map(renderItem)}
        </nav>

        {/* Footer (no dropdown) */}
        <div className="border-t border-slate-200 px-2.5 py-3 space-y-1 shrink-0 bg-white">
          {/* Role chip / user identity */}
          <div className={cn(
            'flex items-center gap-2.5 px-2 py-2 rounded-xl bg-slate-50 border border-slate-100',
            collapsed && 'justify-center px-0'
          )}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden shadow-sm">
              {user?.avatar
                ? <img key={user.avatar} src={getImageUrl(user.avatar)} alt={user.name} className="h-full w-full object-cover" />
                : (isSuperadmin ? <Shield className="w-4 h-4" /> : user?.name?.[0]?.toUpperCase())}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                  {user?.name || 'Pengguna'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{roleLabel(user?.role)}</p>
              </div>
            )}
          </div>

          {/* Live Chat Customer (only roles that can see it) */}
          {canSeeSupportChat && (
            <Link
              to="/admin/customer-chat"
              className={cn(
                'group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative',
                isActive('/admin/customer-chat')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
              title={collapsed ? 'Live Chat Customer' : undefined}
            >
              <span className="relative shrink-0">
                <Headphones className="w-[18px] h-[18px]" />
                {supportUnread > 0 && collapsed && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full leading-none">
                    {supportUnread > 99 ? '99+' : supportUnread}
                  </span>
                )}
              </span>
              {!collapsed && (
                <>
                  <span className="flex-1">Live Chat Customer</span>
                  {supportUnread > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                      {supportUnread > 99 ? '99+' : supportUnread}
                    </span>
                  )}
                </>
              )}
            </Link>
          )}

          {/* Profile */}
          <Link
            to="/admin/profile"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              isActive('/admin/profile')
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
            title={collapsed ? 'Profile' : undefined}
          >
            <User className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>Profile</span>}
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200',
              collapsed && 'justify-center'
            )}
            title={collapsed ? 'Keluar' : undefined}
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────── */}
      <div className={cn('flex-1 flex flex-col transition-all duration-300', collapsed ? 'ml-16' : 'ml-64')}>
        {/* Top bar */}
        <header className="sticky top-0 z-40 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {navItems.reduce((found, item) => {
                if (found) return found
                if (item.type === 'section') return null
                if (item.type === 'group') return item.children.find(c => isActive(c.to, c.exact))?.label || null
                return isActive(item.to, item.exact) ? item.label : null
              }, null) || 'Dashboard'}
            </h1>
            <p className="text-xs text-slate-500">
              {isDesignInterior ? 'Panel Design Interior' : isFinance ? 'Finance & Keuangan' : 'Panel Manajemen OTA System'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
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
