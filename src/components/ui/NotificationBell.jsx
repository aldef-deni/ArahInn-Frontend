import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { notificationApi } from '@/services/notificationApi'
import {
  Bell, BellRing, CheckCheck, X,
  ShoppingBag, Hotel, CreditCard, Ban, Star, Building2,
  MessageSquare, Wallet, RotateCcw, Clock, CalendarCheck, ThumbsUp, ThumbsDown, Tag,
  Receipt, Zap, UserPlus, FileCheck,
} from 'lucide-react'

const TYPE_META = {
  // Booking
  booking_new              : { icon: ShoppingBag,    color: 'text-blue-500',    bg: 'bg-blue-50'    },
  booking_paid             : { icon: CreditCard,     color: 'text-green-500',   bg: 'bg-green-50'   },
  booking_canceled         : { icon: Ban,            color: 'text-red-500',     bg: 'bg-red-50'     },
  booking_rescheduled      : { icon: RotateCcw,      color: 'text-blue-500',    bg: 'bg-blue-50'    },
  booking_completed        : { icon: CalendarCheck,  color: 'text-emerald-500', bg: 'bg-emerald-50' },
  booking_reminder_checkin : { icon: Clock,          color: 'text-amber-500',   bg: 'bg-amber-50'   },
  booking_refund_request   : { icon: Wallet,         color: 'text-red-500',     bg: 'bg-red-50'     },
  booking_refunded         : { icon: Wallet,         color: 'text-emerald-500', bg: 'bg-emerald-50' },
  // Payment
  payment_pending          : { icon: CreditCard,     color: 'text-amber-500',   bg: 'bg-amber-50'   },
  payment_expired          : { icon: CreditCard,     color: 'text-red-500',     bg: 'bg-red-50'     },
  payment_proof_uploaded   : { icon: FileCheck,      color: 'text-blue-500',    bg: 'bg-blue-50'    },
  // PPOB (top-up & tagihan)
  ppob_success             : { icon: Receipt,        color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ppob_failed              : { icon: Zap,            color: 'text-red-500',     bg: 'bg-red-50'     },
  ppob_canceled            : { icon: Ban,            color: 'text-red-500',     bg: 'bg-red-50'     },
  ppob_refunded            : { icon: Wallet,         color: 'text-emerald-500', bg: 'bg-emerald-50' },
  // Chat
  chat_message             : { icon: MessageSquare,  color: 'text-orange-500',  bg: 'bg-orange-50'  },
  inquiry_new              : { icon: MessageSquare,  color: 'text-orange-500',  bg: 'bg-orange-50'  },
  // Hotel / Property
  hotel_new                : { icon: Hotel,          color: 'text-amber-500',   bg: 'bg-amber-50'   },
  hotel_approved           : { icon: Star,           color: 'text-emerald-500', bg: 'bg-emerald-50' },
  hotel_blocked            : { icon: Ban,            color: 'text-red-500',     bg: 'bg-red-50'     },
  hotel_created_by_admin   : { icon: Hotel,          color: 'text-blue-500',    bg: 'bg-blue-50'    },
  property_listing_new     : { icon: Building2,      color: 'text-blue-500',    bg: 'bg-blue-50'    },
  property_listing_approved: { icon: Building2,      color: 'text-emerald-500', bg: 'bg-emerald-50' },
  property_listing_rejected: { icon: Building2,      color: 'text-red-500',     bg: 'bg-red-50'     },
  // Review
  review_pending           : { icon: Star,           color: 'text-amber-500',   bg: 'bg-amber-50'   },
  review_new               : { icon: Star,           color: 'text-amber-500',   bg: 'bg-amber-50'   },
  review_approved          : { icon: ThumbsUp,       color: 'text-emerald-500', bg: 'bg-emerald-50' },
  review_rejected          : { icon: ThumbsDown,     color: 'text-red-500',     bg: 'bg-red-50'     },
  review_invitation        : { icon: Star,           color: 'text-orange-500',  bg: 'bg-orange-50'  },
  // Promo
  promo_new                : { icon: Tag,            color: 'text-pink-500',    bg: 'bg-pink-50'    },
  // Owner onboarding (untuk admin/superadmin)
  owner_registered         : { icon: UserPlus,       color: 'text-blue-500',    bg: 'bg-blue-50'    },
}

const DEFAULT_META = { icon: Bell, color: 'text-slate-500', bg: 'bg-slate-50' }

/**
 * Route resolver: terima (type, role, data) → kembalikan path tujuan.
 * Sengaja per-role agar UX cocok dengan layout/menu masing-masing.
 */
function resolveRoute(type, role, data) {
  const d = data || {}
  const bookingId  = d.booking_id  ?? d.bookingId
  const bookingRef = d.booking_code ?? d.bookingCode ?? bookingId  // URL ramah (kode booking)
  const hotelId    = d.hotel_id    ?? d.hotelId
  const propertyId = d.property_id ?? d.propertyId
  const reviewId   = d.review_id   ?? d.reviewId
  const promoId    = d.promo_id    ?? d.promoId
  const targetType = d.target_type
  const targetId   = d.target_id

  const adminRoles = ['superadmin', 'admin', 'finance']
  const isAdmin    = adminRoles.includes(role)
  const isOwner    = role === 'owner'

  switch (type) {
    // ── Booking ──────────────────────────────────────────────
    case 'booking_new':
    case 'booking_canceled':
    case 'booking_paid':
    case 'booking_rescheduled':
    case 'booking_completed':
    case 'booking_reminder_checkin':
      if (isAdmin) return '/admin/orders'
      if (isOwner) return '/owner/pesanan'
      return bookingId ? `/orders/${bookingId}` : '/orders'

    // ── Refund ───────────────────────────────────────────────
    case 'booking_refund_request':
      if (isAdmin) return '/admin/finance/invoices'
      return '/admin/orders'
    case 'booking_refunded':
      return bookingId ? `/orders/${bookingId}` : '/orders'

    // ── Payment ──────────────────────────────────────────────
    case 'payment_pending':
    case 'payment_expired':
      return bookingRef ? `/payment/${bookingRef}` : '/orders'
    // Bukti bayar manual diunggah → admin/finance verifikasi di daftar pesanan
    case 'payment_proof_uploaded':
      return '/admin/orders'

    // ── PPOB (top-up & tagihan) — customer ──────────────────
    case 'ppob_success':
    case 'ppob_failed':
    case 'ppob_canceled':
    case 'ppob_refunded':
      return '/topup-tagihan/history'

    // ── Chat / Inquiry ───────────────────────────────────────
    case 'chat_message':
    case 'inquiry_new': {
      const channel = d.channel
      if (isOwner) return '/owner/chat'
      if (isAdmin && channel === 'support') return '/admin/customer-chat'
      if (isAdmin) return '/admin/customer-chat'
      // Customer: arahkan ke hotel terkait kalau inquiry, atau ke order kalau booking
      if (channel === 'inquiry' && hotelId) return `/hotel/${hotelId}`
      if (bookingId) return `/orders/${bookingId}`
      return null
    }

    // ── Hotel ────────────────────────────────────────────────
    case 'hotel_new':
      return '/admin/hotels'
    case 'hotel_approved':
    case 'hotel_blocked':
    case 'hotel_created_by_admin':   // admin buatkan hotel utk owner → owner cek propertinya
      return '/owner/properti'

    // ── Owner onboarding (admin/superadmin) ─────────────────
    case 'owner_registered':
      return '/admin/owners'

    // ── Property listing ─────────────────────────────────────
    case 'property_listing_new':
      return '/admin/property-approval'
    case 'property_listing_approved':
    case 'property_listing_rejected':
      return '/owner/jual-properti'

    // ── Review ───────────────────────────────────────────────
    case 'review_pending':
      return '/admin/reviews'
    case 'review_new':
      // Owner ingin lihat ulasan di hotel/properti miliknya
      if (targetType === 'hotel' && targetId)    return `/hotel/${targetId}`
      if (targetType === 'property' && targetId) return `/properti/${targetId}`
      return '/owner/properti'
    case 'review_approved':
    case 'review_rejected':
      // Customer: lihat review tampil → arahkan ke target
      if (targetType === 'hotel' && targetId)    return `/hotel/${targetId}`
      if (targetType === 'property' && targetId) return `/properti/${targetId}`
      return '/orders'
    case 'review_invitation':
      // Customer diundang review → arahkan ke order
      return bookingId ? `/orders/${bookingId}` : '/orders'

    // ── Promo ────────────────────────────────────────────────
    case 'promo_new':
      return promoId ? `/promo` : '/promo'

    default:
      return null
  }
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  return `${Math.floor(h / 24)} hari lalu`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref      = useRef(null)
  const navigate = useNavigate()
  const qc       = useQueryClient()
  const { user } = useAuthStore()

  const { data: countData } = useQuery({
    queryKey: ['notif-unread'],
    queryFn : () => notificationApi.unreadCount().then(r => r.data.data.count),
    refetchInterval: 15000,
  })

  const { data: listData, isLoading } = useQuery({
    queryKey: ['notif-list'],
    queryFn : () => notificationApi.getAll({ limit: 20 }).then(r => r.data.data),
    enabled : open,
    staleTime: 0,
  })

  const markRead = useMutation({
    mutationFn: (id) => notificationApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notif-unread'] })
      qc.invalidateQueries({ queryKey: ['notif-list'] })
    },
  })

  const markAll = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notif-unread'] })
      qc.invalidateQueries({ queryKey: ['notif-list'] })
    },
  })

  const unread        = countData ?? 0
  const notifications = listData  ?? []

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleItemClick = useCallback((notif) => {
    if (!notif.readAt) markRead.mutate(notif.id)

    const route = resolveRoute(notif.type, user?.role, notif.data)
    if (route) {
      setOpen(false)
      navigate(route)
    }
  }, [markRead, navigate, user?.role])

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
        aria-label="Notifikasi"
      >
        {unread > 0 ? (
          <BellRing className="w-5 h-5 text-slate-600 animate-wiggle" />
        ) : (
          <Bell className="w-5 h-5 text-slate-600" />
        )}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 w-[calc(100vw-1.5rem)] max-w-sm sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:translate-x-0 sm:mt-2 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="font-semibold text-slate-800 text-sm">Notifikasi</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={() => markAll.mutate()}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  disabled={markAll.isPending}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Tandai semua
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[360px] divide-y divide-slate-50">
            {isLoading && (
              <div className="flex flex-col gap-3 p-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-full" />
                      <div className="h-2.5 bg-slate-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Belum ada notifikasi</p>
              </div>
            )}

            {!isLoading && notifications.map((notif) => {
              const meta      = TYPE_META[notif.type] ?? DEFAULT_META
              const Icon      = meta.icon
              const hasRoute  = !!resolveRoute(notif.type, user?.role, notif.data)
              return (
                <button
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={[
                    'w-full text-left px-4 py-3 flex gap-3 transition-colors',
                    !notif.readAt ? 'bg-blue-50/40' : '',
                    hasRoute ? 'hover:bg-blue-50 cursor-pointer' : 'hover:bg-slate-50',
                  ].join(' ')}
                >
                  <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center ${meta.bg}`}>
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className={`text-xs font-semibold leading-tight ${!notif.readAt ? 'text-slate-800' : 'text-slate-600'}`}>
                        {notif.title}
                      </p>
                      {!notif.readAt && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-snug mt-0.5 line-clamp-2">
                      {notif.body}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-slate-400">{timeAgo(notif.createdAt)}</p>
                      {hasRoute && (
                        <span className="text-[10px] text-blue-500 font-medium">Lihat →</span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
