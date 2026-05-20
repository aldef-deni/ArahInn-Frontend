import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useMemo, useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { useQuery } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { chatApi, mmApi } from '@/services/index'
import {
  Home, Building2, Image, CalendarDays, Tag, ShoppingBag, BarChart2,
  ChevronDown, LogOut, MapPin, Languages, Sparkles,
  BedDouble, ClipboardList, ShieldCheck, MessageSquare, PlusCircle,
  CheckCircle2, Clock, XCircle, ChevronRight, DollarSign, Megaphone,
  X, Mail, Phone, User, Layers, RefreshCw, Receipt, Activity,
  Calendar, Users, Star,
} from 'lucide-react'
import { cn, getImageUrl } from '@/utils'
import NotificationBell from '@/components/ui/NotificationBell'
import queryClient from '@/lib/queryClient'

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
  '/daftar-hotel-baru': {
    title: 'Daftarkan Hotel Baru',
    subtitle: 'Isi informasi dasar properti. Status akan Pending hingga disetujui Superadmin.',
  },
  '/owner/jual-properti': {
    title: 'Jual Properti',
    subtitle: 'Daftarkan properti Anda untuk dijual atau disewakan melalui platform ArahInn.',
  },
  '/owner/harga': {
    title: 'Harga dan Ketersediaan',
    subtitle: 'Atur harga dasar dan optimalkan ketersediaan kamar.',
  },
  '/owner/harga/pricing-model': {
    title: 'Pricing Model',
    subtitle: 'Pilih model penghitungan harga yang sesuai dengan properti Anda.',
  },
  '/owner/harga/rate-plan': {
    title: 'Rate Plan',
    subtitle: 'Kelola paket harga dan kebijakan pembatalan.',
  },
  '/owner/harga/harga-anak': {
    title: 'Kebijakan & Harga untuk Anak',
    subtitle: 'Atur ketentuan dan diskon khusus untuk tamu anak-anak.',
  },
  '/owner/harga/atur': {
    title: 'Atur Harga & Ketersediaan',
    subtitle: 'Kelola harga dan ketersediaan kamar per tanggal secara langsung.',
  },
  '/owner/harga/bulk-update': {
    title: 'Bulk Update',
    subtitle: 'Perbarui harga dan ketersediaan untuk beberapa kamar sekaligus.',
  },
  '/owner/harga/biaya-tambahan': {
    title: 'Biaya Tambahan',
    subtitle: 'Konfigurasi biaya ekstra yang dikenakan di luar harga kamar.',
  },
  '/owner/harga/ketersediaan-now': {
    title: 'Ketersediaan Now',
    subtitle: 'Kontrol ketersediaan kamar secara real-time untuk hari ini.',
  },
  '/owner/promo': {
    title: 'Promo',
    subtitle: 'Promo platform dari Arahinn dan promo hotel Anda.',
  },
  '/owner/campaign': {
    title: 'Campaign',
    subtitle: 'Kampanye marketing yang sedang berjalan dari platform Arahinn.',
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
    key: 'properti',
    buttonLabel: 'Pengaturan Properti',
    icon: Building2,
    base: '/owner/properti',
    items: [
      { to: '/owner/properti', label: 'Detail Properti', icon: ClipboardList },
      { to: '/owner/properti/unit', label: 'Data Unit', icon: BedDouble },
      { to: '/owner/properti/galeri', label: 'Galeri Foto', icon: Image },
      { to: '/owner/properti/fasilitas', label: 'Fasilitas & Layanan', icon: Sparkles },
    ],
    footerLink: { to: '/daftar-hotel-baru', label: 'Daftarkan Hotel Baru', icon: PlusCircle, external: true },
  },
  {
    title: 'Harga',
    collapsible: true,
    key: 'harga',
    buttonLabel: 'Harga & Ketersediaan',
    icon: CalendarDays,
    base: '/owner/harga',
    items: [
      { to: '/owner/harga/pricing-model',    label: 'Pricing Model',         icon: Layers      },
      { to: '/owner/harga/rate-plan',        label: 'Rate Plan',             icon: Tag         },
      { to: '/owner/harga/harga-anak',       label: 'Kebijakan Harga Anak',  icon: Users       },
      { to: '/owner/harga/atur',             label: 'Atur Harga & Tersedia', icon: Calendar    },
      { to: '/owner/harga/bulk-update',      label: 'Bulk Update',           icon: RefreshCw   },
      { to: '/owner/harga/biaya-tambahan',   label: 'Biaya Tambahan',        icon: Receipt     },
      { to: '/owner/harga/ketersediaan-now', label: 'Ketersediaan Now',      icon: Activity    },
    ],
  },
  {
    title: 'Komersial',
    items: [
      { to: '/owner/promo',    label: 'Promo',    icon: Tag },
      { to: '/owner/campaign', label: 'Campaign', icon: Megaphone },
      { to: '/owner/pesanan',  label: 'Pesanan',  icon: ShoppingBag },
      { to: '/owner/laporan',  label: 'Laporan',  icon: BarChart2 },
    ],
  },
  {
    title: 'Komunikasi',
    items: [
      { to: '/owner/chat', label: 'Pesan Tamu', icon: MessageSquare },
    ],
  },
  {
    title: 'Jual Properti',
    items: [
      { to: '/owner/jual-properti', label: 'Jual Properti', icon: DollarSign },
    ],
  },
]

const STATUS_META = {
  approved : { label: 'Aktif',    cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  pending  : { label: 'Pending',  cls: 'bg-amber-100 text-amber-700',     icon: Clock        },
  blocked  : { label: 'Diblokir', cls: 'bg-red-100 text-red-600',         icon: XCircle      },
}

export default function OwnerLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const [sectionsOpen, setSectionsOpen]   = useState(() => ({
    properti: true,
    harga: true,
  }))
  const toggleSection = (key) => setSectionsOpen(s => ({ ...s, [key]: !s[key] }))

  useEffect(() => {
    if (location.pathname.startsWith('/owner/harga')) {
      setSectionsOpen(s => ({ ...s, harga: true }))
    }
    if (location.pathname.startsWith('/owner/properti')) {
      setSectionsOpen(s => ({ ...s, properti: true }))
    }
  }, [location.pathname])
  const [switcherOpen, setSwitcherOpen]   = useState(false)
  const [pendingModal, setPendingModal]   = useState(null)
  const [mmOpen,       setMmOpen]         = useState(false)
  const switcherRef                       = useRef(null)

  const { data: mmData, isLoading: mmLoading } = useQuery({
    queryKey: ['owner-my-mm'],
    queryFn : () => mmApi.myMM().then(r => r.data?.data),
    enabled : !!user?.id,
    staleTime: 5 * 60 * 1000,
  })

  const [selectedHotelId, setSelectedHotelId] = useState(() => {
    const saved = localStorage.getItem('owner_selected_hotel_id')
    return saved ? Number(saved) : null
  })

  const { data: allHotels } = useQuery({
    queryKey: ['owner-my-hotels'],
    queryFn : () => hotelApi.myHotels().then(r => r.data?.data || []),
    enabled : !!user?.id,
    staleTime: 0,
  })

  const hotel = useMemo(() => {
    if (!allHotels?.length) return null
    return allHotels.find(h => h.id === selectedHotelId) || allHotels[0]
  }, [allHotels, selectedHotelId])

  useEffect(() => {
    if (hotel?.id) localStorage.setItem('owner_selected_hotel_id', hotel.id)
  }, [hotel?.id])

  useEffect(() => {
    const handler = (e) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) setSwitcherOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: chatRooms } = useQuery({
    queryKey: ['owner-chat-rooms'],
    queryFn: () => chatApi.ownerRooms().then(r => r.data?.data || []),
    enabled: !!user?.id && !!hotel?.id,
    refetchInterval: 15000,
  })
  const { data: inquiryRooms } = useQuery({
    queryKey: ['owner-chat-inquiries'],
    queryFn: () => chatApi.ownerInquiries().then(r => r.data?.data || []),
    enabled: !!user?.id && !!hotel?.id,
    refetchInterval: 15000,
  })
  const unreadBooking = chatRooms?.reduce((sum, r) => sum + Number(r.unreadCount || 0), 0) || 0
  const unreadInquiry = inquiryRooms?.reduce((sum, r) => sum + Number(r.unreadCount || 0), 0) || 0
  const totalUnread   = unreadBooking + unreadInquiry

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
    localStorage.removeItem('owner_selected_hotel_id')
    queryClient.clear()
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
            <img src="/logo-arahin.png" alt="Arahinn" className="h-10 w-auto" />
          </Link>
        </div>

        <div className="border-b border-slate-200 px-4 py-4" ref={switcherRef}>
          {/* Hotel switcher button */}
          <button
            onClick={() => setSwitcherOpen(o => !o)}
            className={cn(
              'w-full rounded-2xl p-3.5 flex items-center gap-3 transition-all text-left',
              switcherOpen ? 'bg-blue-50 ring-2 ring-blue-200' : 'bg-slate-50 hover:bg-slate-100'
            )}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 leading-tight">
                {hotel?.name || 'Memuat properti...'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {hotel?.status && (() => {
                  const s = STATUS_META[hotel.status] || STATUS_META.pending
                  return (
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${s.cls}`}>
                      <s.icon className="w-2.5 h-2.5" /> {s.label}
                    </span>
                  )
                })()}
                {allHotels?.length > 1 && (
                  <span className="text-[10px] text-slate-400">{allHotels.length} properti</span>
                )}
              </div>
            </div>
            <ChevronDown className={cn('h-4 w-4 text-slate-400 shrink-0 transition-transform', switcherOpen && 'rotate-180')} />
          </button>

          {/* Dropdown panel */}
          {switcherOpen && (
            <div className="mt-2 rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
              <p className="px-4 pt-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Properti Anda</p>
              <div className="max-h-64 overflow-y-auto">
                {allHotels?.map(h => {
                  const s       = STATUS_META[h.status] || STATUS_META.pending
                  const active  = h.id === hotel?.id
                  const isPending = h.status === 'pending'
                  return (
                    <button key={h.id}
                      onClick={() => {
                        if (isPending) {
                          setSwitcherOpen(false)
                          setPendingModal(h)
                        } else {
                          setSelectedHotelId(h.id)
                          setSwitcherOpen(false)
                        }
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                        active     ? 'bg-blue-50'   : '',
                        isPending  ? 'opacity-70 hover:bg-amber-50' : 'hover:bg-slate-50'
                      )}
                    >
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm overflow-hidden',
                        active    ? 'bg-blue-100 text-blue-700'  :
                        isPending ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500')}>
                        {h.images?.[0]
                          ? <img src={getImageUrl(h.images[0])} alt="" className="w-full h-full object-cover" />
                          : <Building2 className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-sm font-semibold truncate',
                          active    ? 'text-blue-700'  :
                          isPending ? 'text-amber-700' : 'text-slate-800')}>
                          {h.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <MapPin className="w-3 h-3" /> {h.city}
                          </span>
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${s.cls}`}>
                            <s.icon className="w-2.5 h-2.5" /> {s.label}
                          </span>
                        </div>
                      </div>
                      {active && !isPending && <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />}
                      {isPending && <Clock className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>
                  )
                })}
              </div>
              <div className="border-t border-slate-100 p-2">
                <a
                  href="/daftar-hotel-baru"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setSwitcherOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" /> Daftarkan Hotel Baru
                </a>
              </div>
            </div>
          )}
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
                      onClick={() => toggleSection(section.key)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors',
                        location.pathname.startsWith(section.base)
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-slate-700 hover:bg-white hover:text-slate-900'
                      )}
                    >
                      <section.icon className="h-4.5 w-4.5 shrink-0" />
                      <span className="flex-1 text-left">{section.buttonLabel}</span>
                      <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', sectionsOpen[section.key] && 'rotate-180')} />
                    </button>

                    {sectionsOpen[section.key] && (
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
                        {section.footerLink && (
                          <div className="pt-1 mt-1 border-t border-slate-200/70">
                            {section.footerLink.external ? (
                              <a
                                href={section.footerLink.to}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors font-medium text-blue-600 hover:bg-blue-50"
                              >
                                <section.footerLink.icon className="h-4 w-4 shrink-0" />
                                {section.footerLink.label}
                              </a>
                            ) : (
                              <Link
                                to={section.footerLink.to}
                                className={cn(
                                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors font-medium',
                                  location.pathname === section.footerLink.to
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-blue-600 hover:bg-blue-50'
                                )}
                              >
                                <section.footerLink.icon className="h-4 w-4 shrink-0" />
                                {section.footerLink.label}
                              </Link>
                            )}
                          </div>
                        )}
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
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white overflow-hidden shrink-0">
                {user?.avatar
                  ? <img key={user.avatar} src={getImageUrl(user.avatar)} alt={user.name} className="h-full w-full object-cover" onError={e => { e.currentTarget.replaceWith(Object.assign(document.createElement('span'), { textContent: user?.name?.[0]?.toUpperCase() || 'O' })) }} />
                  : (user?.name?.[0]?.toUpperCase() || 'O')}
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
                to="/owner/profile"
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
              >
                <User className="h-4 w-4" />
                Profil
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
                  {(() => {
                    const stars = parseInt(hotel?.starRating, 10)
                    if (!stars || stars < 1) return null
                    return (
                      <div className="mt-1.5 flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'h-4 w-4 shrink-0',
                              i < stars
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-slate-200 text-slate-200'
                            )}
                          />
                        ))}
                        <span className="ml-1.5 text-xs font-semibold text-amber-600">{stars} Bintang</span>
                      </div>
                    )
                  })()}
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
                <button
                  onClick={() => setMmOpen(true)}
                  className="rounded-full bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100">
                  Hubungi Market Manager
                </button>
                <button className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
                  <Languages className="h-4 w-4" />
                  Bahasa ID
                </button>
                <NotificationBell />
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
            <Outlet context={{ hotel, allHotels, setSelectedHotelId }} />
          </div>
        </main>
      </div>

      {/* ── Market Manager Contact Popup ─────────────────── */}
      {mmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMmOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
            {/* Header gradient */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 px-6 pt-8 pb-10 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full overflow-hidden ring-4 ring-white/30">
                {mmData?.avatar
                  ? <img src={getImageUrl(mmData.avatar)} alt={mmData.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-white/20 flex items-center justify-center">
                      {mmData?.name
                        ? <span className="text-2xl font-bold text-white">{mmData.name[0].toUpperCase()}</span>
                        : <User className="h-8 w-8 text-white" />
                      }
                    </div>
                }
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-1">Market Manager Anda</p>
              <h2 className="text-xl font-bold text-white">
                {mmLoading ? 'Memuat...' : mmData?.name || 'Belum ditugaskan'}
              </h2>
            </div>

            <div className="-mt-4 h-4 bg-white rounded-t-[2rem]" />

            <div className="px-6 pb-6 -mt-1">
              {mmLoading ? (
                <div className="space-y-3 py-4">
                  <div className="h-10 bg-slate-100 animate-pulse rounded-2xl" />
                  <div className="h-10 bg-slate-100 animate-pulse rounded-2xl" />
                </div>
              ) : !mmData ? (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500">
                    Belum ada Market Manager yang terhubung dengan Anda
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Email */}
                  <a
                    href={`mailto:${mmData.email}`}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-400 font-medium">Email</p>
                      <p className="text-sm font-semibold text-slate-800 truncate">{mmData.email}</p>
                    </div>
                  </a>

                  {/* WhatsApp */}
                  {mmData.phone ? (
                    <a
                      href={`https://wa.me/${mmData.phone.replace(/\D/g, '').replace(/^0/, '62')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
                        <Phone className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-400 font-medium">WhatsApp</p>
                        <p className="text-sm font-semibold text-slate-800">{mmData.phone}</p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                        Chat
                      </span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">WhatsApp</p>
                        <p className="text-sm text-slate-400">Nomor belum tersedia</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setMmOpen(false)}
                className="mt-5 w-full rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-3 transition-colors"
              >
                Tutup
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={() => setMmOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ── Pending Hotel Modal ───────────────────────────── */}
      {pendingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setPendingModal(null)}
          />
          {/* Card */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
            {/* Top amber strip */}
            <div className="bg-gradient-to-br from-amber-400 to-orange-400 px-6 pt-8 pb-10 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">Menunggu Persetujuan</h2>
            </div>

            {/* Wave divider */}
            <div className="-mt-4 h-4 bg-white rounded-t-[2rem]" />

            {/* Body */}
            <div className="px-6 pb-6 -mt-1 text-center">
              <p className="text-base font-semibold text-slate-800 mb-1">{pendingModal.name}</p>
              <p className="text-sm text-slate-500 mb-1">{pendingModal.city}</p>
              <p className="text-sm text-slate-600 leading-relaxed mt-3">
                Properti ini sedang dalam proses review oleh{' '}
                <span className="font-semibold text-amber-600">Manajemen ArahInn</span>.
                Anda akan mendapat notifikasi setelah properti disetujui.
              </p>

              <div className="mt-5 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-700 text-left space-y-1">
                <p className="font-semibold">Yang terjadi selanjutnya:</p>
                <p>• Tim kami akan memverifikasi data properti Anda</p>
                <p>• Proses review biasanya 1–3 hari kerja</p>
                <p>• Notifikasi dikirim saat status berubah</p>
              </div>

              <button
                onClick={() => setPendingModal(null)}
                className="mt-5 w-full rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-3 transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
