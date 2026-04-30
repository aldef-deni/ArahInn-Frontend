import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { useQuery } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { chatApi } from '@/services/index'
import {
  Home, Building2, Image, CalendarDays, Tag, ShoppingBag, BarChart2,
  ChevronDown, LogOut, Bell, ExternalLink, MapPin, Languages, Sparkles,
  BedDouble, ClipboardList, ShieldCheck, MessageSquare
} from 'lucide-react'
import { cn } from '@/utils'

const PAGE_META = {
  '/owner': {
    title: 'Beranda',
    subtitle: 'Ringkasan performa properti dan aktivitas terbaru.',
  },
  '/owner/properti': {
    title: 'Detail Properti',
    subtitle: 'Lengkapi informasi dasar agar properti tampil lebih meyakinkan.',
  },
  '/owner/properti/unit': {
    title: 'Data Unit',
    subtitle: 'Kelola tipe kamar, kapasitas, dan inventaris unit.',
  },
  '/owner/properti/galeri': {
    title: 'Galeri Foto',
    subtitle: 'Tampilkan visual properti terbaik untuk meningkatkan konversi.',
  },
  '/owner/properti/fasilitas': {
    title: 'Fasilitas dan Layanan',
    subtitle: 'Pilih fasilitas yang tersedia agar tamu lebih mudah menemukan properti Anda.',
  },
  '/owner/harga': {
    title: 'Harga dan Ketersediaan',
    subtitle: 'Atur harga dasar dan optimalkan ketersediaan kamar.',
  },
  '/owner/promo': {
    title: 'Promo dan Campaign',
    subtitle: 'Buat penawaran untuk menjaga permintaan tetap aktif.',
  },
  '/owner/pesanan': {
    title: 'Pesanan',
    subtitle: 'Pantau booking yang masuk dan tindak lanjuti lebih cepat.',
  },
  '/owner/laporan': {
    title: 'Laporan',
    subtitle: 'Lihat tren pendapatan dan performa properti.',
  },
}

const MENU_SECTIONS = [
  {
    title: 'Utama',
    items: [
      { to: '/owner', label: 'Beranda', icon: Home, exact: true },
    ],
  },
  {
    title: 'Properti',
    collapsible: true,
    icon: Building2,
    base: '/owner/properti',
    items: [
      { to: '/owner/properti', label: 'Detail Properti', icon: ClipboardList },
      { to: '/owner/properti/unit', label: 'Data Unit', icon: BedDouble },
      { to: '/owner/properti/galeri', label: 'Galeri Foto', icon: Image },
      { to: '/owner/properti/fasilitas', label: 'Fasilitas & Layanan', icon: Sparkles },
    ],
  },
  {
    title: 'Komersial',
    items: [
      { to: '/owner/harga',   label: 'Harga & Ketersediaan', icon: CalendarDays },
      { to: '/owner/promo',   label: 'Promo & Campaign',     icon: Tag },
      { to: '/owner/pesanan', label: 'Pesanan',               icon: ShoppingBag },
      { to: '/owner/laporan', label: 'Laporan',               icon: BarChart2 },
    ],
  },
  {
    title: 'Komunikasi',
    items: [
      { to: '/owner/chat', label: 'Pesan Tamu', icon: MessageSquare },
    ],
  },
]

export default function OwnerLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const [propertiOpen, setPropertiOpen] = useState(
    location.pathname.startsWith('/owner/properti')
  )

  const { data: hotel } = useQuery({
    queryKey: ['owner-my-hotel'],
    queryFn: () => hotelApi.myHotel().then(r => r.data?.data),
    enabled: !!user?.id,
  })

  const { data: chatRooms } = useQuery({
    queryKey: ['owner-chat-rooms'],
    queryFn: () => chatApi.ownerRooms().then(r => r.data?.data || []),
    enabled: !!user?.id,
    refetchInterval: 15000,
  })
  const totalUnread = chatRooms?.reduce((sum, r) => sum + (r.unreadCount || 0), 0) || 0

  const pageMeta = PAGE_META[location.pathname] || {
    title: 'Extranet Owner',
    subtitle: 'Kelola properti Anda dari satu tempat.',
  }

  const propertyCode = useMemo(() => {
    if (!hotel?.id) return 'PROP-0000'
    return `PROP-${String(hotel.id).padStart(4, '0')}`
  }, [hotel?.id])

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/login')
    toast({ title: 'Berhasil keluar.' })
  }

  const isActive = (to, exact = false) =>
    exact ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] border-r border-slate-200 bg-white xl:flex xl:flex-col">
        <div className="border-b border-slate-200 px-7 py-6">
          <Link to="/owner" className="flex items-center gap-3">
            <img src="/logo.png" alt="Arahinn" className="h-10 w-auto" />
            <div className="leading-tight">
              <p className="font-display text-xl font-bold tracking-tight text-slate-900">ARAHINN</p>
              <p className="text-sm font-medium text-slate-500">Extranet Owner</p>
            </div>
          </Link>
        </div>

        <div className="border-b border-slate-200 px-7 py-5">
          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{hotel?.name || 'Memuat properti...'}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{propertyCode}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{hotel?.city || 'Lokasi belum tersedia'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="custom-scroll flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-6">
            {MENU_SECTIONS.map(section => (
              <div key={section.title} className="space-y-2">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {section.title}
                </p>

                {section.collapsible ? (
                  <div className="rounded-3xl bg-slate-50/80 p-2">
                    <button
                      onClick={() => setPropertiOpen(open => !open)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors',
                        location.pathname.startsWith(section.base)
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-slate-700 hover:bg-white hover:text-slate-900'
                      )}
                    >
                      <section.icon className="h-4.5 w-4.5 shrink-0" />
                      <span className="flex-1 text-left">Pengaturan Properti</span>
                      <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', propertiOpen && 'rotate-180')} />
                    </button>

                    {propertiOpen && (
                      <div className="mt-2 space-y-1 px-1 pb-1">
                        {section.items.map(item => (
                          <Link
                            key={item.to}
                            to={item.to}
                            className={cn(
                              'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors',
                              location.pathname === item.to
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-white hover:text-slate-900'
                            )}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {section.items.map(item => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                          'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                          isActive(item.to, item.exact)
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-700 hover:bg-white hover:text-slate-900'
                        )}
                      >
                        <item.icon className="h-4.5 w-4.5 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {item.to === '/owner/chat' && totalUnread > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                            {totalUnread > 99 ? '99+' : totalUnread}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-slate-200 px-4 py-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                {user?.name?.[0]?.toUpperCase() || 'O'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Owner Account
                </p>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link
                to="/"
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
              >
                <ExternalLink className="h-4 w-4" />
                Lihat Website
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-h-screen xl:ml-[280px]">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex flex-col gap-5 px-5 py-5 md:px-8 xl:px-10">
            <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
              <div className="flex min-w-0 items-start gap-4">
                <div className="hidden h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-700 md:flex">
                  <Building2 className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-500">Selamat datang, {user?.name || 'Owner'}</p>
                  <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-900">
                    {hotel?.name || 'Kelola Properti Anda'}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                    <span className="font-medium text-slate-700">{propertyCode}</span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {hotel?.city || 'Indonesia'}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {hotel?.status === 'approved' ? 'Properti aktif' : 'Menunggu persetujuan'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button className="rounded-full bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100">
                  Hubungi Market Manager
                </button>
                <button className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
                  <Languages className="h-4 w-4" />
                  Bahasa ID
                </button>
                <button className="relative rounded-full border border-slate-200 p-3 text-slate-500 transition-colors hover:bg-slate-50">
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white" />
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-blue-50 px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-bold text-slate-900">{pageMeta.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{pageMeta.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  Extranet mode aktif
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-5 py-6 md:px-8 xl:px-10">
          <div className="page-enter">
            <Outlet context={{ hotel }} />
          </div>
        </main>
      </div>
    </div>
  )
}
