import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { userApi, promoApi, bookingApi, chatApi, wishlistApi } from '@/services/index'
import BookingChatModal from '@/components/chat/BookingChatModal'
import { reviewApi } from '@/services/reviewApi'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah, formatDateShort, statusBadgeClass, statusLabel, getImageUrl } from '@/utils'
import { validateImageFile, MIN_AVATAR_RESOLUTION_PX } from '@/utils/imageValidation'
import { prepareAvatarFile } from '@/utils/avatarPrep'
import {
  User, Mail, Phone, Lock, Star, Camera, Save,
  Eye, EyeOff, ShoppingBag, Calendar, ChevronRight,
  XCircle, RefreshCw, Shield, Heart, MessageSquare,
  CreditCard, BadgeCheck, CheckCircle2, Loader2,
  Clock, AlertCircle, Building2, Hotel as HotelIcon, Trash2,
  ShieldCheck, Zap, Search, BedDouble, Sparkles, ArrowRight,
  Headphones, ChevronDown, Globe, DollarSign, MapPin, Info,
  FileText, ScrollText, Settings, Send, Receipt,
  Crown, Award, UserCircle2,
} from 'lucide-react'
import PpobTransactionList from '@/pages/Ppob/PpobTransactionList'

// ── Avatar with fallback ──────────────────────────────────
function Avatar({ user, size = 'md' }) {
  const [err, setErr] = useState(false)
  const dim = size === 'lg' ? 'w-20 h-20 text-3xl rounded-2xl' : 'w-12 h-12 text-xl rounded-xl'
  return (
    <div className={`${dim} overflow-hidden bg-brand/10 flex items-center justify-center shrink-0`}>
      {user?.avatar && !err
        ? <img src={getImageUrl(user.avatar)} alt="" className="w-full h-full object-cover" onError={() => setErr(true)} />
        : <span className="font-bold text-brand-600">{user?.name?.[0]?.toUpperCase()}</span>}
    </div>
  )
}

// ── Tier helpers ──────────────────────────────────────────
// Tier mengikuti skema baru: dihitung dari LIFETIME EARNED (server), bukan saldo,
// supaya tier TIDAK turun saat poin dipakai. Konsisten dengan halaman /loyalty.
const TIER_STYLE = {
  member:   { label: 'Member',   color: 'from-blue-500 to-blue-700' },
  silver:   { label: 'Silver',   color: 'from-slate-400 to-slate-600' },
  gold:     { label: 'Gold',     color: 'from-amber-400 via-yellow-500 to-amber-600' },
  platinum: { label: 'Platinum', color: 'from-zinc-800 via-neutral-950 to-black' },
}
// Background image per tier (folder public) — sama dengan halaman /loyalty
const TIER_BG = {
  member: '/member-bg.webp', silver: '/silver-bg.webp', gold: '/gold-bg.webp', platinum: '/platinum-bg.webp',
}
const TIER_ICON = { member: UserCircle2, silver: Star, gold: Award, platinum: Crown }

const ORDER_TABS = [
  { value: '',         labelKey: 'profilePage.filterAll' },
  { value: 'pending',  labelKey: 'profilePage.filterPending' },
  { value: 'issued',   labelKey: 'profilePage.filterIssued' },
  { value: 'canceled', labelKey: 'profilePage.filterCanceled' },
]

// ── Sub-components ────────────────────────────────────────
function SectionAccount({ user, updateUser }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const qc        = useQueryClient()
  const { register, handleSubmit } = useForm({ defaultValues: { name: user?.name, phone: user?.phone } })

  const profileMutation = useMutation({
    mutationFn: (d) => userApi.update(d),
    onSuccess : (r) => { updateUser(r.data.data); toast({ title: t('profilePage.toastProfileUpdated') }); qc.invalidateQueries({ queryKey: ['profile'] }) },
    onError   : () => toast({ title: t('profilePage.toastProfileFailed'), variant: 'destructive' }),
  })

  const avatarMutation = useMutation({
    mutationFn: (file) => { const fd = new FormData(); fd.append('avatar', file); return userApi.avatar(fd) },
    onSuccess : (r) => { updateUser(r.data.data); toast({ title: t('profilePage.toastAvatarUpdated') }) },
    onError   : (e) => toast({ title: t('profilePage.toastAvatarFailed'), description: e?.response?.data?.message || t('profilePage.errorGeneric'), variant: 'destructive' }),
  })

  const handleAvatarChange = async (file) => {
    if (!file) return
    const allowed = ['jpg', 'jpeg', 'png']
    const ext = file.name.split('.').pop().toLowerCase()
    if (!allowed.includes(ext)) {
      toast({ title: t('profilePage.toastFormatTitle'), description: t('profilePage.toastFormatDesc'), variant: 'destructive' })
      return
    }
    const result = await validateImageFile(file, { minResolution: MIN_AVATAR_RESOLUTION_PX })
    if (!result.valid) {
      toast({ title: t('profilePage.toastAvatarRejected'), description: result.error, variant: 'destructive' })
      return
    }
    try {
      const prepared = await prepareAvatarFile(file, { size: 512, quality: 0.85 })
      avatarMutation.mutate(prepared)
    } catch (e) {
      toast({ title: t('profilePage.toastAvatarProcessFailed'), description: e?.message || t('profilePage.errorGeneric'), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">{t('profilePage.accountTitle')}</h2>
        <p className="text-xs sm:text-sm text-slate-500">{t('profilePage.accountSubtitle')}</p>
      </div>

      {/* Avatar card */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative shrink-0">
            <Avatar key={user?.avatar || 'default'} user={user} size="lg" />
            {avatarMutation.isPending && (
              <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            <label className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center transition-colors shadow-sm ${avatarMutation.isPending ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer hover:bg-brand-700 active:scale-90'}`}>
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept=".jpg,.jpeg,.png" className="hidden" disabled={avatarMutation.isPending}
                onChange={e => { handleAvatarChange(e.target.files[0]); e.target.value = '' }} />
            </label>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-base sm:text-lg text-slate-900 truncate">{user?.name}</p>
              <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 shrink-0" />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 truncate">{user?.email}</p>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1 capitalize">{user?.role?.replace('_', ' ')}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 leading-relaxed">{t('profilePage.avatarHint')}</p>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-5">{t('profilePage.profileInfo')}</h3>
        <form onSubmit={handleSubmit(d => profileMutation.mutate(d))} className="space-y-4">
          {[
            { name: 'name',  label: t('profilePage.fullName'),  icon: User,  type: 'text', placeholder: t('profilePage.namePlaceholder') },
            { name: 'phone', label: t('profilePage.phoneLabel'), icon: Phone, type: 'tel',  placeholder: '08xxxxxxxxxx' },
          ].map(({ name, label, icon: Icon, type, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={type} placeholder={placeholder} {...register(name)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('profilePage.emailLabel')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="email" value={user?.email} disabled
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-400 cursor-not-allowed" />
            </div>
            <p className="text-xs text-slate-400 mt-1">{t('profilePage.emailLocked')}</p>
          </div>
          <button type="submit" disabled={profileMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors">
            <Save className="w-4 h-4" />
            {profileMutation.isPending ? t('profilePage.saving') : t('profilePage.saveChanges')}
          </button>
        </form>
      </div>
    </div>
  )
}

function SectionSecurity() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [showPass, setShowPass] = useState(false)
  const { register, handleSubmit, reset, watch } = useForm()

  const passMutation = useMutation({
    mutationFn: (d) => userApi.password(d),
    onSuccess : () => { toast({ title: t('profilePage.toastPasswordChanged') }); reset() },
    onError   : (e) => toast({ title: t('profilePage.failed'), description: e?.response?.data?.message, variant: 'destructive' }),
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">{t('profilePage.securityTitle')}</h2>
        <p className="text-xs sm:text-sm text-slate-500">{t('profilePage.securitySubtitle')}</p>
      </div>
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-5">{t('profilePage.changePasswordTitle')}</h3>
        <form onSubmit={handleSubmit(d => passMutation.mutate(d))} className="space-y-4 max-w-sm">
          {[
            { name: 'oldPassword', label: t('profilePage.oldPassword'),     rules: { required: t('profilePage.required') } },
            { name: 'newPassword', label: t('profilePage.newPassword'),     rules: { required: t('profilePage.required'), minLength: { value: 6, message: t('profilePage.minChars') } } },
            { name: 'confirm',     label: t('profilePage.confirmPassword'), rules: { required: t('profilePage.required'), validate: v => v === watch('newPassword') || t('profilePage.passwordMismatch') } },
          ].map(({ name, label, rules }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={showPass ? 'text' : 'password'} {...register(name, rules)}
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                {name === 'oldPassword' && (
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="submit" disabled={passMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors">
            <Shield className="w-4 h-4" />
            {passMutation.isPending ? t('profilePage.saving') : t('profilePage.changePasswordTitle')}
          </button>
        </form>
      </div>
    </div>
  )
}

// Status dot color tints — soft palette
const STATUS_TINT = {
  pending:    { dot: 'bg-amber-400',   chip: 'bg-amber-50  text-amber-700',   labelKey: 'profilePage.statusPending' },
  paid:       { dot: 'bg-emerald-400', chip: 'bg-emerald-50 text-emerald-700', labelKey: 'profilePage.statusPaid' },
  issued:     { dot: 'bg-blue-400',    chip: 'bg-blue-50   text-blue-700',    labelKey: 'profilePage.statusIssued' },
  rescheduled:{ dot: 'bg-indigo-400',  chip: 'bg-indigo-50 text-indigo-700',  labelKey: 'profilePage.statusRescheduled' },
  canceled:   { dot: 'bg-rose-400',    chip: 'bg-rose-50   text-rose-700',    labelKey: 'profilePage.statusCanceled' },
  refunded:   { dot: 'bg-slate-400',   chip: 'bg-slate-100 text-slate-600',   labelKey: 'profilePage.statusRefunded' },
}

function OrderRow({ order, onDetail, onPay, onCancel, onChat, chatUnread = 0, canceling }) {
  const { t } = useTranslation()
  const tint = STATUS_TINT[order.status] || STATUS_TINT.pending
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-blue-200 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Thumbnail */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
          {order.hotel?.images?.[0]
            ? <img src={getImageUrl(order.hotel.images[0])} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-slate-300">🏨</div>}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${tint.chip}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${tint.dot}`} />
              {t(tint.labelKey)}
            </span>
            <span className="text-[10px] font-mono text-slate-400 tracking-wider">{order.bookingCode}</span>
          </div>
          <p className="font-semibold text-slate-900 truncate text-sm sm:text-base">{order.hotel?.name}</p>
          <p className="text-xs text-slate-500 truncate">{order.room?.name}</p>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-400">
            <Calendar className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {formatDateShort(order.checkIn)} – {formatDateShort(order.checkOut)} · {order.totalNights} {t('profilePage.nightsUnit')} · {order.guests} {t('profilePage.guestsUnit')}
            </span>
          </div>
        </div>
      </div>

      {/* Footer: price + actions */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{t('profilePage.total')}</p>
          <p className="text-base sm:text-lg font-black text-slate-900 leading-tight">{formatRupiah(order.totalPrice)}</p>
        </div>
        <div className="flex items-center gap-2">
          {onChat && (
            <button onClick={onChat}
              className="relative inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-blue-200 transition-all">
              <MessageSquare className="w-3.5 h-3.5" />
              {t('profilePage.chatStay')}
              {chatUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center bg-red-500 text-white text-[10px] font-extrabold rounded-full border-2 border-white shadow-sm">
                  {chatUnread > 99 ? '99+' : chatUnread}
                </span>
              )}
            </button>
          )}
          <button onClick={onDetail}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors">
            {t('profilePage.detail')}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          {order.status === 'pending' && (
            <>
              <button onClick={onPay}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-sm shadow-orange-200 transition-all">
                {t('profilePage.payNow')}
              </button>
              <button onClick={onCancel} disabled={canceling}
                title={t('profilePage.cancelBooking')}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50">
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {order.status === 'issued' && (
            <button onClick={onPay}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> {t('profilePage.reschedule')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionOrders() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc       = useQueryClient()
  const { toast } = useToast()
  const [activeMain, setActiveMain] = useState('akomodasi') // akomodasi | ppob
  const [activeTab, setActiveTab] = useState('')
  const [page, setPage] = useState(1)
  const [chatBooking, setChatBooking] = useState(null) // { id, hotelId, hotelName, bookingCode } | null

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', activeTab, page],
    queryFn : () => bookingApi.myOrders({ status: activeTab || undefined, page, limit: 6 }).then(r => r.data),
  })

  // Fetch unread chat per booking — polling 15s untuk update real-time
  const { data: myRooms } = useQuery({
    queryKey: ['my-chat-rooms'],
    queryFn : () => chatApi.myRooms().then(r => r.data?.data || []),
    refetchInterval: 15000,
  })
  // Build map: bookingId → unread count (room type=booking atau null)
  const bookingUnreadMap = {}
  for (const r of (myRooms || [])) {
    if ((r.type === 'booking' || !r.type) && r.bookingId) {
      bookingUnreadMap[r.bookingId] = Number(r.unreadCount || 0)
    }
  }

  const cancelMutation = useMutation({
    mutationFn: (id) => bookingApi.cancel(id),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['my-orders'] })
      toast({ title: t('profilePage.toastBookingCanceled') })
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: ['my-orders'] })
      const msg = e?.response?.data?.message || t('profilePage.toastCancelFailedDesc')
      toast({ title: t('profilePage.toastCancelFailedTitle'), description: msg, variant: 'destructive' })
    },
  })

  const totalOrders = data?.pagination?.total ?? data?.data?.length ?? 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">{t('profilePage.ordersTitle')}</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{t('profilePage.ordersSubtitle')}</p>
        </div>
        {activeMain === 'akomodasi' && totalOrders > 0 && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {t('profilePage.ordersCount', { count: totalOrders })}
          </span>
        )}
      </div>

      {/* ── Main tabs Akomodasi | PPOB (underline style) ────────────────── */}
      <div className="relative border-b border-slate-200">
        <div className="flex gap-1 sm:gap-2">
          {[
            { value: 'akomodasi', label: t('profilePage.tabAkomodasi'), Icon: HotelIcon },
            { value: 'ppob',      label: t('profilePage.tabPpob'),      Icon: Receipt },
          ].map(tab => {
            const TabIcon = tab.Icon
            const active = activeMain === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setActiveMain(tab.value)}
                className={`relative flex items-center gap-2 px-4 sm:px-5 py-3 text-sm font-semibold transition-colors ${
                  active ? 'text-brand' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <TabIcon className={`w-4 h-4 transition-transform ${active ? 'scale-110' : ''}`} />
                {tab.label}
                {active && (
                  <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── PPOB tab content ──────────────────────────── */}
      {activeMain === 'ppob' && (
        <PpobTransactionList limit={30} />
      )}

      {/* ── Akomodasi tab content (existing) ──────────── */}
      {activeMain === 'akomodasi' && (<>
      {/* Tabs status — pill segmented control */}
      <div className="inline-flex p-1 bg-slate-100 rounded-2xl overflow-x-auto max-w-full">
        {ORDER_TABS.map(tab => {
          const active = activeTab === tab.value
          return (
            <button
              key={tab.value || 'all'}
              onClick={() => { setActiveTab(tab.value); setPage(1) }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                active
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading
          ? Array(3).fill(0).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex gap-4">
                  <div className="skeleton w-20 h-20 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-1/3 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                    <div className="skeleton h-3 w-2/3 rounded" />
                  </div>
                </div>
              </div>
            ))
          : data?.data?.length
            ? data.data.map(order => (
                <OrderRow
                  key={order.id}
                  order={order}
                  onDetail={() => navigate(`/orders/${order.bookingCode || order.id}`)}
                  onPay={() => navigate(`/payment/${order.bookingCode || order.id}`)}
                  onCancel={() => cancelMutation.mutate(order.id)}
                  onChat={(order.hotelId || order.hotel?.id) ? () => setChatBooking({
                    id: order.id,
                    hotelId: order.hotelId || order.hotel?.id,
                    hotelName: order.hotel?.name || t('profilePage.accommodationFallback'),
                    bookingCode: order.bookingCode,
                  }) : undefined}
                  chatUnread={bookingUnreadMap[order.id] || 0}
                  canceling={cancelMutation.isPending}
                />
              ))
            : (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-semibold text-lg text-slate-800">{t('profilePage.ordersEmptyTitle')}</p>
                <p className="text-sm text-slate-400 mt-1 mb-6">{t('profilePage.ordersEmptyDesc')}</p>
                <button onClick={() => navigate('/search')}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm">
                  {t('profilePage.findHotel')}
                </button>
              </div>
            )
        }
      </div>

      {/* Pagination */}
      {data?.pagination?.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-9 h-9 rounded-xl text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`min-w-[36px] h-9 px-2 rounded-xl text-xs font-bold transition-colors ${
                page === p
                  ? 'bg-brand text-white shadow-sm shadow-brand/30'
                  : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
            disabled={page === data.pagination.totalPages}
            className="w-9 h-9 rounded-xl text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      </>)}

      {/* Chat modal */}
      <BookingChatModal
        open={!!chatBooking}
        bookingId={chatBooking?.id}
        hotelId={chatBooking?.hotelId}
        hotelName={chatBooking?.hotelName}
        bookingCode={chatBooking?.bookingCode}
        onClose={() => {
          setChatBooking(null)
          qc.invalidateQueries({ queryKey: ['my-chat-rooms'] })
        }}
      />
    </div>
  )
}

function SectionLoyalty({ loyalty }) {
  const { t } = useTranslation()
  // Tier dari summary (lifetime earned) → tidak turun saat redeem. Fallback silver.
  const { data: summary } = useQuery({
    queryKey: ['loyalty-summary'],
    queryFn: () => promoApi.loyalty.summary().then(r => r.data?.data),
  })
  const tierKey = summary?.tier || 'member'
  const tier    = TIER_STYLE[tierKey] || TIER_STYLE.member
  const balance = loyalty?.balance ?? summary?.balance ?? 0
  const isPlat  = tierKey === 'platinum'
  const isGold  = tierKey === 'gold'
  const lux     = isPlat || isGold
  const mult    = summary?.multiplier ?? 1
  const earnPer = summary?.config?.earnPer ?? summary?.config?.earn_per ?? 100
  const TierIcon = TIER_ICON[tierKey] || Star
  const { data: history = [] } = useQuery({
    queryKey: ['loyalty-history'],
    queryFn: () => promoApi.loyalty.history({ limit: 50 }).then(r => r.data?.data ?? []),
  })
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">{t('profilePage.loyaltyTitle')}</h2>
        <p className="text-sm text-slate-500">{t('profilePage.loyaltySubtitle')}</p>
      </div>
      <div
        className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg bg-zinc-900 ${isPlat ? 'ring-1 ring-amber-300/30' : isGold ? 'ring-1 ring-white/30' : ''}`}
        style={{ backgroundImage: `url(${TIER_BG[tierKey] || TIER_BG.member})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/45 via-black/10 to-transparent" />
        <div className="relative">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <span className={`text-xs sm:text-sm font-semibold drop-shadow ${isPlat ? 'text-amber-200' : 'text-white/90'}`}>{tier.label}</span>
            {lux ? (
              <div className="relative w-9 h-9 sm:w-11 sm:h-11 shrink-0">
                <div className="absolute -inset-1.5 rounded-full blur-md opacity-80 animate-spin"
                  style={{ background: isPlat
                    ? 'conic-gradient(from 0deg, transparent 0deg, rgba(251,191,36,0.55) 70deg, transparent 150deg, transparent 360deg)'
                    : 'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.75) 70deg, transparent 150deg, transparent 360deg)', animationDuration: '5s' }} />
                <div className={`absolute inset-0.5 rounded-full blur-md animate-pulse ${isPlat ? 'bg-amber-400/15' : 'bg-white/25'}`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <TierIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${isPlat ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.65)]' : 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.75)]'}`} />
                </div>
              </div>
            ) : (
              <TierIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white/45" />
            )}
          </div>
          <p className={`font-display text-4xl sm:text-5xl font-bold break-all ${isPlat ? 'bg-gradient-to-b from-amber-100 via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow' : 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]'}`}>{balance.toLocaleString('id-ID')}</p>
          <p className={`text-xs sm:text-sm mt-1 drop-shadow ${isPlat ? 'text-amber-100/80' : 'text-white/85'}`}>{t('profilePage.pointsAvailable')}</p>
          <p className="text-[11px] sm:text-xs text-white/75 mt-2 sm:mt-3 leading-relaxed drop-shadow">{t('loyalty.perRule', { per: earnPer.toLocaleString('id-ID'), mult })} · {t('loyalty.lifetime')}: {(summary?.lifetime ?? balance).toLocaleString('id-ID')}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4">{t('profilePage.howToEarn')}</h3>
        <ul className="space-y-3">
          {[
            ['🏨', t('profilePage.earnBooking'), t('profilePage.earnBookingDesc')],
            ['⭐', t('profilePage.earnReview'),  t('profilePage.earnReviewDesc')],
            ['🎁', t('profilePage.earnReferral'),t('profilePage.earnReferralDesc')],
          ].map(([icon, title, desc]) => (
            <li key={title} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="text-sm font-medium text-slate-800">{title}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />
            </li>
          ))}
        </ul>
      </div>

      {/* Riwayat pendapatan / pemakaian poin */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-900">{t('loyalty.historyTitle')}</h3>
          <Link to="/poin" className="text-xs font-semibold text-brand hover:underline shrink-0">
            {t('loyalty.seeAll')}
          </Link>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">{t('loyalty.empty')}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {history.map((h, i) => {
              const pts = Number(h.points ?? 0)
              const isEarn = pts > 0
              return (
                <li key={h.id ?? i} className="flex items-center gap-3 py-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isEarn ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                    <Star className={`w-4 h-4 ${isEarn ? 'text-emerald-500 fill-emerald-200' : 'text-rose-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{h.description || (isEarn ? t('profilePage.earnBooking') : '-')}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDateShort(h.createdAt ?? h.created_at)}
                    </p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${isEarn ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {isEarn ? '+' : ''}{pts.toLocaleString('id-ID')}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

// ── Section: Ulasan Anda ──────────────────────────────────
function SectionReviews() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => reviewApi.mine().then(r => r.data?.data || []),
  })

  const stats = {
    total: reviews.length,
    approved: reviews.filter(r => r.status === 'approved').length,
    pending: reviews.filter(r => r.status === 'pending').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">{t('profilePage.reviewsTitle')}</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{t('profilePage.reviewsSubtitle')}</p>
        </div>
        {stats.total > 0 && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {t('profilePage.reviewsCount', { count: stats.total })}
          </span>
        )}
      </div>

      {/* Stats strip */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t('profilePage.statApproved'), val: stats.approved, color: 'from-emerald-50 to-emerald-100/40 text-emerald-700', icon: CheckCircle2 },
            { label: t('profilePage.statPending'),  val: stats.pending,  color: 'from-amber-50 to-amber-100/40 text-amber-700',       icon: Clock },
            { label: t('profilePage.statRejected'), val: stats.rejected, color: 'from-red-50 to-red-100/40 text-red-700',             icon: XCircle },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className={`rounded-2xl bg-gradient-to-br ${s.color} px-4 py-3 border border-white/60`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">{s.label}</span>
                </div>
                <p className="text-2xl font-black">{s.val}</p>
              </div>
            )
          })}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
          <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">{t('profilePage.reviewsEmptyTitle')}</p>
          <p className="text-sm text-slate-400 mt-1">{t('profilePage.reviewsEmptyDesc')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => <UserReviewCard key={r.id} review={r} navigate={navigate} />)}
        </div>
      )}
    </div>
  )
}

function UserReviewCard({ review, navigate }) {
  const { t, i18n } = useTranslation()
  const created = review.createdAt ? new Date(review.createdAt) : null
  const dateStr = created ? created.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  const statusConfig = {
    approved: { label: t('profilePage.statApproved'), bg: 'bg-emerald-100', text: 'text-emerald-700', Icon: CheckCircle2 },
    pending:  { label: t('profilePage.statPending'),  bg: 'bg-amber-100',   text: 'text-amber-700',   Icon: Clock },
    rejected: { label: t('profilePage.statRejected'), bg: 'bg-red-100',     text: 'text-red-700',     Icon: XCircle },
  }[review.status] || { label: review.status, bg: 'bg-slate-100', text: 'text-slate-700', Icon: AlertCircle }

  const StatusIcon = statusConfig.Icon
  const isHotel = review.targetType === 'hotel'

  const goToTarget = () => {
    if (!review.targetId) return
    navigate(isHotel ? `/hotel/${review.targetId}` : `/properti/${review.targetId}`)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Header — target */}
        <div className="flex items-start gap-3 mb-3">
          {review.targetImage ? (
            <img
              src={getImageUrl(review.targetImage)}
              alt={review.targetName}
              className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              {isHotel ? <HotelIcon className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={goToTarget} className="text-sm font-bold text-slate-900 hover:text-brand transition-colors text-left truncate">
                {review.targetName}
              </button>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isHotel ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {isHotel ? t('profilePage.tagStay') : t('profilePage.tagProperty')}
              </span>
            </div>
            {review.targetCity && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">{review.targetCity}</p>
            )}
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${statusConfig.bg} ${statusConfig.text} shrink-0`}>
            <StatusIcon className="w-3 h-3" /> {statusConfig.label}
          </span>
        </div>

        {/* Rating stars */}
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`}
            />
          ))}
          <span className="ml-1 text-xs text-slate-400">· {dateStr}</span>
        </div>

        {/* Comment */}
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{review.comment}</p>

        {/* Rejected reason */}
        {review.status === 'rejected' && review.rejectedReason && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700"><strong>{t('profilePage.rejectedReason')}</strong> {review.rejectedReason}</p>
          </div>
        )}

        {/* Pending hint */}
        {review.status === 'pending' && (
          <p className="mt-3 text-xs text-amber-700/80 italic">
            {t('profilePage.pendingHint')}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Section: Metode Pembayaran ────────────────────────────
const BANKS = [
  { key: 'bca',     label: 'BCA Virtual Account',     logo: '/banks/bca.png',      descKey: 'profilePage.bankBcaDesc' },
  { key: 'mandiri', label: 'Mandiri Virtual Account', logo: '/banks/mandiri.png',  descKey: 'profilePage.bankMandiriDesc' },
  { key: 'bri',     label: 'BRI Virtual Account',     logo: '/banks/bri.svg',      descKey: 'profilePage.bankBriDesc' },
  { key: 'bsi',     label: 'BSI Virtual Account',     logo: '/banks/bank_bsi.png', descKey: 'profilePage.bankBsiDesc' },
]

function SectionPayment() {
  const { t } = useTranslation()
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{t('profilePage.paymentTitle')}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t('profilePage.paymentSubtitle')}</p>
      </div>

      {/* Hero — security */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-900 to-blue-700 p-5 shadow-md shadow-blue-200 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-white font-bold">{t('profilePage.secureTitle')}</p>
          <p className="text-white/80 text-xs mt-1 leading-relaxed">
            {t('profilePage.secureDesc')}
          </p>
        </div>
      </div>

      {/* VA Bank list */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{t('profilePage.vaBankTitle')}</p>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {BANKS.map((b, i) => (
            <div key={b.key}>
              <div className="flex items-center gap-4 p-4">
                <div className="w-20 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <img src={b.logo} alt={b.label} className="max-h-7 w-auto object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{b.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t(b.descKey)}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-700">{t('profilePage.active')}</span>
                </span>
              </div>
              {i < BANKS.length - 1 && <div className="h-px bg-slate-100 mx-4" />}
            </div>
          ))}
        </div>
      </div>

      {/* Coming soon */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{t('profilePage.comingSoon')}</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { Icon: Zap, label: t('profilePage.ewallet'), desc: t('profilePage.ewalletDesc') },
            { Icon: Building2, label: t('profilePage.creditCard'), desc: t('profilePage.creditCardDesc') },
          ].map(({ Icon, label, desc }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 opacity-80">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-slate-400" />
              </div>
              <p className="font-semibold text-sm text-slate-900">{label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              <span className="inline-block mt-2 px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold">
                {t('profilePage.soon')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* How to pay */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{t('profilePage.howToPay')}</p>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          {[
            t('profilePage.payStep1'),
            t('profilePage.payStep2'),
            t('profilePage.payStep3'),
            t('profilePage.payStep4'),
            t('profilePage.payStep5'),
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed flex-1">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Section: Wishlist (hotel & properti favorit) ───────────────────────
function SectionWishlist() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: cfg } = useQuery({ queryKey: ['wishlist-config'], queryFn: () => wishlistApi.config().then(r => r.data?.data), staleTime: 5 * 60_000 })
  const { data: items = [], isLoading } = useQuery({ queryKey: ['wishlist-list'], queryFn: () => wishlistApi.list().then(r => r.data?.data || []) })

  const removeMut = useMutation({
    mutationFn: (wid) => wishlistApi.remove(wid),
    onMutate: async (wid) => {
      await qc.cancelQueries({ queryKey: ['wishlist-list'] })
      const prev = qc.getQueryData(['wishlist-list'])
      qc.setQueryData(['wishlist-list'], (old = []) => old.filter(x => x.wid !== wid))
      return { prev }
    },
    onError: (_e, _wid, ctx) => { if (ctx?.prev) qc.setQueryData(['wishlist-list'], ctx.prev); toast({ title: t('wishlistBtn.failed') }) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wishlist-ids'] }); toast({ title: t('wishlistBtn.removed') }) },
  })

  const detailUrl = (it) => it.type === 'hotel' ? `/hotel/${it.id}` : `/properti/${it.id}`
  const featureOff = cfg && cfg.enabled === false

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('profilePage.wishlistTitle')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t('profilePage.wishlistSubtitle')}</p>
        </div>
        {!featureOff && items.length > 0 && (
          <span className="shrink-0 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
            {items.length}{cfg?.maxItems > 0 ? ` / ${cfg.maxItems}` : ''}
          </span>
        )}
      </div>

      {featureOff ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3"><Heart className="w-7 h-7 text-slate-300" /></div>
          <p className="font-semibold text-slate-700">{t('profilePage.wishlistOffTitle')}</p>
          <p className="text-sm text-slate-400 mt-1">{t('profilePage.wishlistOffDesc')}</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-rose-100 shadow-md shadow-rose-100/40 p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4"><Heart className="w-10 h-10 text-rose-300" /></div>
          <h3 className="text-lg font-bold text-slate-900">{t('profilePage.wishlistEmptyTitle')}</h3>
          <p className="mt-1.5 text-sm text-slate-500 max-w-sm mx-auto">{t('profilePage.whatIsWishlistDesc')}</p>
          <button onClick={() => navigate('/search')} className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors shadow-md shadow-brand/30">
            <Search className="w-4 h-4" /> {t('profilePage.browseHotelsProps')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map(it => (
            <div key={it.wid} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow flex">
              <Link to={detailUrl(it)} className="w-28 sm:w-32 shrink-0 bg-slate-100 relative">
                {it.image
                  ? <img src={getImageUrl(it.image)} alt={it.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">{it.type === 'hotel' ? <HotelIcon className="w-7 h-7 text-slate-300" /> : <Building2 className="w-7 h-7 text-slate-300" />}</div>}
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-white/90 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                  {it.type === 'hotel' ? t('profilePage.wlTypeHotel') : t('profilePage.wlTypeProperty')}
                </span>
              </Link>
              <div className="flex-1 min-w-0 p-3 flex flex-col">
                <Link to={detailUrl(it)} className="min-w-0">
                  <p className="font-bold text-sm text-slate-900 truncate">{it.name}</p>
                  {it.city && <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /> {it.city}</p>}
                </Link>
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  {it.type === 'property'
                    ? <span className="text-sm font-bold text-brand">{it.price ? formatRupiah(it.price) : '-'}</span>
                    : <span className="text-xs text-amber-500 flex items-center gap-0.5">{it.starRating ? <>{it.starRating} <Star className="w-3 h-3 fill-amber-400 text-amber-400" /></> : ''}</span>}
                  <button onClick={() => removeMut.mutate(it.wid)} disabled={removeMut.isPending}
                    className="shrink-0 w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:border-rose-300 hover:text-rose-500 transition-colors" aria-label={t('wishlistBtn.removed')}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Section: Customer Care ────────────────────────────────
function SectionCustomerCare() {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState({ help: false, about: false })
  const [settings, setSettings] = useState({
    language: 'id',
    currency: 'IDR',
    country:  'ID',
    locationEnabled: true,
  })

  const toggle = (k) => setExpanded(p => ({ ...p, [k]: !p[k] }))

  const supportOpen = (() => {
    // Customer support 09:00 - 00:00 WIB
    const now = new Date()
    const h = now.getHours()
    return h >= 9 || h < 0  // basically 09:00 to 23:59
  })()

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{t('profilePage.careTitle')}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t('profilePage.careSubtitle')}</p>
      </div>

      {/* ─── Section 1: Customer Support ──────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('profilePage.customerSupport')}</p>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
            supportOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${supportOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {supportOpen ? t('profilePage.online') : t('profilePage.offline')} · {t('profilePage.supportHours')}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Pusat Bantuan — expandable */}
          <button onClick={() => toggle('help')}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900">{t('profilePage.helpCenter')}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t('profilePage.helpCenterDesc')}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded.help ? 'rotate-180' : ''}`} />
          </button>
          {expanded.help && (
            <div className="px-5 pb-4 bg-slate-50/50 border-t border-slate-100">
              <div className="space-y-2 pt-3">
                {[
                  { q: t('profilePage.faq1Q'), a: t('profilePage.faq1A') },
                  { q: t('profilePage.faq2Q'), a: t('profilePage.faq2A') },
                  { q: t('profilePage.faq3Q'), a: t('profilePage.faq3A') },
                  { q: t('profilePage.faq4Q'), a: t('profilePage.faq4A') },
                ].map((f, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-100 p-3.5">
                    <p className="text-sm font-semibold text-slate-900">{f.q}</p>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{f.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="h-px bg-slate-100 mx-5" />

          {/* Email */}
          <a href="mailto:cs@arahinn.com" className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900">Email</p>
              <p className="text-xs text-slate-500 mt-0.5">cs@arahinn.com</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </a>

          <div className="h-px bg-slate-100 mx-5" />

          {/* Live Chat */}
          <button
            onClick={() => {
              const btn = document.querySelector('[data-livechat-trigger]')
              if (btn instanceof HTMLElement) btn.click()
            }}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900">{t('profilePage.liveChat')}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t('profilePage.liveChatDesc')}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          <div className="h-px bg-slate-100 mx-5" />

          {/* WhatsApp */}
          <a
            href="https://wa.me/6285188136009"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Send className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900">WhatsApp</p>
              <p className="text-xs text-slate-500 mt-0.5">+62 851-8813-6009</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </a>
        </div>
      </div>

      {/* ─── Section 2: Pengaturan ──────────────── */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{t('profilePage.settings')}</p>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Bahasa */}
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900">{t('profilePage.language')}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t('profilePage.languageDesc')}</p>
            </div>
            <select
              value={settings.language}
              onChange={(e) => setSettings(p => ({ ...p, language: e.target.value }))}
              className="text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="id">🇮🇩 Indonesia</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>

          <div className="h-px bg-slate-100 mx-5" />

          {/* Mata Uang */}
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900">{t('profilePage.currency')}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t('profilePage.currencyDesc')}</p>
            </div>
            <select
              value={settings.currency}
              onChange={(e) => setSettings(p => ({ ...p, currency: e.target.value }))}
              className="text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="IDR">IDR · Rp</option>
              <option value="USD">USD · $</option>
              <option value="SGD">SGD · S$</option>
              <option value="MYR">MYR · RM</option>
            </select>
          </div>

          <div className="h-px bg-slate-100 mx-5" />

          {/* Negara */}
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900">{t('profilePage.country')}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t('profilePage.countryDesc')}</p>
            </div>
            <select
              value={settings.country}
              onChange={(e) => setSettings(p => ({ ...p, country: e.target.value }))}
              className="text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="ID">🇮🇩 {t('profilePage.countryID')}</option>
              <option value="SG">🇸🇬 {t('profilePage.countrySG')}</option>
              <option value="MY">🇲🇾 {t('profilePage.countryMY')}</option>
              <option value="TH">🇹🇭 {t('profilePage.countryTH')}</option>
            </select>
          </div>

          <div className="h-px bg-slate-100 mx-5" />

          {/* Lokasi toggle */}
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900">{t('profilePage.location')}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t('profilePage.locationDesc')}</p>
            </div>
            <button
              onClick={() => setSettings(p => ({ ...p, locationEnabled: !p.locationEnabled }))}
              className={`relative w-12 h-7 rounded-full transition-colors ${settings.locationEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-1 ${settings.locationEnabled ? 'left-6' : 'left-1'} w-5 h-5 bg-white rounded-full shadow-md transition-all`} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Section 3: Lainnya ──────────────────── */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{t('profilePage.others')}</p>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tentang ArahInn — expandable */}
          <button onClick={() => toggle('about')}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900">{t('profilePage.aboutArahinn')}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t('profilePage.aboutArahinnDesc')}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded.about ? 'rotate-180' : ''}`} />
          </button>
          {expanded.about && (
            <div className="px-5 pb-4 bg-slate-50/50 border-t border-slate-100">
              <div className="pt-3.5">
                <div className="mb-3">
                  <p className="text-sm font-bold text-slate-900">ArahInn.com</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {t('profilePage.aboutDesc')}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[
                    { label: '1.000+', sub: t('profilePage.statHotelPartner') },
                    { label: '50+',    sub: t('profilePage.statCities') },
                    { label: '24/7',   sub: t('profilePage.statBookingSystem') },
                  ].map(stat => (
                    <div key={stat.sub} className="bg-white border border-slate-100 rounded-xl p-2.5 text-center">
                      <p className="font-bold text-brand text-sm">{stat.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{stat.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="h-px bg-slate-100 mx-5" />

          {/* Kebijakan Privasi */}
          <a href="/privacy" className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900">{t('profilePage.privacyPolicy')}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t('profilePage.privacyPolicyDesc')}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </a>

          <div className="h-px bg-slate-100 mx-5" />

          {/* Syarat & Ketentuan */}
          <a href="/terms" className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <ScrollText className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900">{t('profilePage.terms')}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t('profilePage.termsDesc')}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </a>
        </div>
      </div>

    </div>
  )
}

function ComingSoon({ title }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
        <p className="text-5xl mb-4">🚧</p>
        <p className="font-semibold text-slate-700">{t('profilePage.comingSoon')}</p>
        <p className="text-sm text-slate-400 mt-1">{t('profilePage.csDevNote')}</p>
      </div>
    </div>
  )
}

// ── Menu definitions ──────────────────────────────────────
const MENU_USER = [
  { id: 'account',  labelKey: 'profilePage.menuAccount',  icon: User          },
  { id: 'orders',   labelKey: 'profilePage.menuOrders',   icon: ShoppingBag   },
  { id: 'security', labelKey: 'profilePage.menuSecurity', icon: Shield        },
  { id: 'loyalty',  labelKey: 'profilePage.menuLoyalty',  icon: Star          },
  { id: 'reviews',  labelKey: 'profilePage.menuReviews',  icon: MessageSquare },
  { id: 'payment',  labelKey: 'profilePage.menuPayment',  icon: CreditCard    },
  { id: 'wishlist', labelKey: 'profilePage.menuWishlist', icon: Heart         },
  { id: 'care',     labelKey: 'profilePage.menuCare',     icon: Headphones    },
]

const MENU_PENGELOLA = [
  { id: 'account',  labelKey: 'profilePage.menuAccount',  icon: User   },
  { id: 'security', labelKey: 'profilePage.menuSecurity', icon: Shield },
]

const PENGELOLA_ROLES = ['superadmin', 'admin', 'owner', 'finance', 'admin_property', 'design_interior']

export default function Profile() {
  const { t } = useTranslation()
  const { user, updateUser } = useAuthStore()
  const [active, setActive]  = useState('account')

  const isPengelola = PENGELOLA_ROLES.includes(user?.role)
  const MENU        = isPengelola ? MENU_PENGELOLA : MENU_USER

  const { data: loyalty } = useQuery({
    queryKey: ['loyalty-balance'],
    queryFn : () => promoApi.loyalty.balance().then(r => r.data.data),
    enabled : !isPengelola,
  })
  // Tier dari lifetime earned (server) → tidak turun saat poin dipakai.
  const { data: loyaltySummary } = useQuery({
    queryKey: ['loyalty-summary'],
    queryFn : () => promoApi.loyalty.summary().then(r => r.data?.data),
    enabled : !isPengelola,
  })

  const tier = TIER_STYLE[loyaltySummary?.tier] || TIER_STYLE.member

  const renderContent = () => {
    switch (active) {
      case 'account':  return <SectionAccount user={user} updateUser={updateUser} />
      case 'orders':   return <SectionOrders />
      case 'security': return <SectionSecurity />
      case 'loyalty':  return <SectionLoyalty loyalty={loyalty} />
      case 'reviews':  return <SectionReviews />
      case 'payment':  return <SectionPayment />
      case 'wishlist': return <SectionWishlist />
      case 'care':     return <SectionCustomerCare />
      default:         return null
    }
  }

  return (
    <div className="bg-[#f0f3f8] min-h-screen py-4 sm:py-6 lg:py-8">
      <div className="container max-w-6xl">

        {/* ── Mobile: user card on top ────────────────────── */}
        <div className="lg:hidden bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 shadow-sm mb-3">
          <div className="flex items-center gap-3">
            <Avatar key={user?.avatar || 'default'} user={user} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-slate-900 truncate text-sm sm:text-base">{user?.name}</p>
                <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            {!isPengelola && loyalty?.balance != null && (
              <div className={`bg-gradient-to-r ${tier.color} rounded-xl px-2.5 py-1.5 shrink-0`}>
                <p className="text-[9px] uppercase tracking-wide text-white/70 font-bold leading-tight">{tier.label}</p>
                <p className="text-sm font-bold text-white leading-tight">
                  {(loyalty?.balance || 0).toLocaleString('id-ID')}<span className="text-[10px] font-normal text-white/70 ml-0.5">pt</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile: horizontal scroll tabs ──────────────── */}
        <div className="lg:hidden -mx-4 px-4 mb-4 overflow-x-auto scrollbar-thin">
          <div className="flex gap-2 min-w-max">
            {MENU.map(item => (
              <button key={item.id} onClick={() => setActive(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 border ${
                  active === item.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}>
                <item.icon className="w-3.5 h-3.5" />
                {t(item.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-6 items-start">

          {/* ── Desktop Sidebar ─────────────────────────────── */}
          <aside className="hidden lg:block w-[280px] shrink-0 sticky top-24 space-y-4">
            {/* User card */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar key={user?.avatar || 'default'} user={user} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-slate-900 truncate">{user?.name}</p>
                    <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>

              {/* Tier card — hanya untuk user biasa */}
              {!isPengelola && (
                <div
                  className={`relative overflow-hidden mt-4 rounded-xl p-3 bg-zinc-900 ${loyaltySummary?.tier === 'platinum' ? 'ring-1 ring-amber-300/30' : loyaltySummary?.tier === 'gold' ? 'ring-1 ring-white/30' : ''}`}
                  style={{ backgroundImage: `url(${TIER_BG[loyaltySummary?.tier] || TIER_BG.member})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/45 via-black/10 to-transparent" />
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      {(() => { const TI = TIER_ICON[loyaltySummary?.tier] || Star; return <TI className={`w-4 h-4 ${loyaltySummary?.tier === 'platinum' ? 'text-amber-300' : 'text-white/80'}`} /> })()}
                      <span className={`text-sm font-semibold drop-shadow ${loyaltySummary?.tier === 'platinum' ? 'text-amber-200' : 'text-white'}`}>{tier.label}</span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className={`text-2xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] ${loyaltySummary?.tier === 'platinum' ? 'bg-gradient-to-b from-amber-100 via-amber-200 to-amber-400 bg-clip-text text-transparent' : 'text-white'}`}>{(loyalty?.balance || 0).toLocaleString('id-ID')}</span>
                      <span className="text-xs text-white/75">{t('profilePage.pointsLabel')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Nav menu */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {MENU.map((item, idx) => (
                <button key={item.id} onClick={() => setActive(item.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors text-left
                    ${idx < MENU.length - 1 ? 'border-b border-slate-100' : ''}
                    ${active === item.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-50'
                    }`}>
                  <item.icon className={`w-4.5 h-4.5 shrink-0 ${active === item.id ? 'text-blue-600' : 'text-slate-400'}`} />
                  {t(item.labelKey)}
                  {active === item.id && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </aside>

          {/* ── Content ──────────────────────────────────── */}
          <main className="flex-1 min-w-0 animate-fade-in w-full">
            {renderContent()}
          </main>

        </div>
      </div>
    </div>
  )
}
