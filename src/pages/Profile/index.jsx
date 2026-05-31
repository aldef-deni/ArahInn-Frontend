import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { userApi, promoApi, bookingApi, chatApi } from '@/services/index'
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
  Clock, AlertCircle, Building2, Hotel as HotelIcon,
  ShieldCheck, Zap, Search, BedDouble, Sparkles, ArrowRight,
  Headphones, ChevronDown, Globe, DollarSign, MapPin, Info,
  FileText, ScrollText, Settings, Send, Receipt,
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
function getTier(points = 0) {
  if (points >= 5000) return { label: 'Gold Tier',   color: 'from-yellow-400 to-amber-500',  text: 'text-yellow-900' }
  if (points >= 1000) return { label: 'Silver Tier', color: 'from-slate-400 to-slate-500',   text: 'text-slate-900' }
  return               { label: 'Bronze Tier',        color: 'from-orange-400 to-amber-600',  text: 'text-orange-900' }
}

const ORDER_TABS = [
  { value: '',         label: 'Semua' },
  { value: 'pending',  label: 'Menunggu Bayar' },
  { value: 'issued',   label: 'Dikonfirmasi' },
  { value: 'canceled', label: 'Dibatalkan' },
]

// ── Sub-components ────────────────────────────────────────
function SectionAccount({ user, updateUser }) {
  const { toast } = useToast()
  const qc        = useQueryClient()
  const { register, handleSubmit } = useForm({ defaultValues: { name: user?.name, phone: user?.phone } })

  const profileMutation = useMutation({
    mutationFn: (d) => userApi.update(d),
    onSuccess : (r) => { updateUser(r.data.data); toast({ title: 'Profil berhasil diperbarui.' }); qc.invalidateQueries({ queryKey: ['profile'] }) },
    onError   : () => toast({ title: 'Gagal memperbarui profil.', variant: 'destructive' }),
  })

  const avatarMutation = useMutation({
    mutationFn: (file) => { const fd = new FormData(); fd.append('avatar', file); return userApi.avatar(fd) },
    onSuccess : (r) => { updateUser(r.data.data); toast({ title: 'Foto profil diperbarui.' }) },
    onError   : (e) => toast({ title: 'Gagal upload foto', description: e?.response?.data?.message || 'Terjadi kesalahan.', variant: 'destructive' }),
  })

  const handleAvatarChange = async (file) => {
    if (!file) return
    const allowed = ['jpg', 'jpeg', 'png']
    const ext = file.name.split('.').pop().toLowerCase()
    if (!allowed.includes(ext)) {
      toast({ title: 'Format tidak didukung', description: 'Hanya file .jpg, .jpeg, dan .png yang diizinkan.', variant: 'destructive' })
      return
    }
    const result = await validateImageFile(file, { minResolution: MIN_AVATAR_RESOLUTION_PX })
    if (!result.valid) {
      toast({ title: 'Foto avatar ditolak', description: result.error, variant: 'destructive' })
      return
    }
    try {
      const prepared = await prepareAvatarFile(file, { size: 512, quality: 0.85 })
      avatarMutation.mutate(prepared)
    } catch (e) {
      toast({ title: 'Gagal memproses foto', description: e?.message || 'Terjadi kesalahan.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">Akun</h2>
        <p className="text-xs sm:text-sm text-slate-500">Kelola informasi profil Anda.</p>
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
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 leading-relaxed">Foto avatar: min. 256 px · maks. 5 MB.</p>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-5">Informasi Profil</h3>
        <form onSubmit={handleSubmit(d => profileMutation.mutate(d))} className="space-y-4">
          {[
            { name: 'name',  label: 'Nama Lengkap', icon: User,  type: 'text', placeholder: 'Nama Anda' },
            { name: 'phone', label: 'Nomor Telepon', icon: Phone, type: 'tel',  placeholder: '08xxxxxxxxxx' },
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="email" value={user?.email} disabled
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-400 cursor-not-allowed" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Email tidak dapat diubah.</p>
          </div>
          <button type="submit" disabled={profileMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors">
            <Save className="w-4 h-4" />
            {profileMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </div>
  )
}

function SectionSecurity() {
  const { toast } = useToast()
  const [showPass, setShowPass] = useState(false)
  const { register, handleSubmit, reset, watch } = useForm()

  const passMutation = useMutation({
    mutationFn: (d) => userApi.password(d),
    onSuccess : () => { toast({ title: 'Password berhasil diubah.' }); reset() },
    onError   : (e) => toast({ title: 'Gagal', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">Keamanan</h2>
        <p className="text-xs sm:text-sm text-slate-500">Kelola password akun Anda.</p>
      </div>
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-5">Ubah Password</h3>
        <form onSubmit={handleSubmit(d => passMutation.mutate(d))} className="space-y-4 max-w-sm">
          {[
            { name: 'oldPassword', label: 'Password Lama',       rules: { required: 'Wajib diisi' } },
            { name: 'newPassword', label: 'Password Baru',       rules: { required: 'Wajib diisi', minLength: { value: 6, message: 'Minimal 6 karakter' } } },
            { name: 'confirm',     label: 'Konfirmasi Password', rules: { required: 'Wajib diisi', validate: v => v === watch('newPassword') || 'Password tidak cocok' } },
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
            {passMutation.isPending ? 'Menyimpan...' : 'Ubah Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Status dot color tints — soft palette
const STATUS_TINT = {
  pending:    { dot: 'bg-amber-400',   chip: 'bg-amber-50  text-amber-700',   label: 'Menunggu Bayar' },
  paid:       { dot: 'bg-emerald-400', chip: 'bg-emerald-50 text-emerald-700', label: 'Dibayar' },
  issued:     { dot: 'bg-blue-400',    chip: 'bg-blue-50   text-blue-700',    label: 'Dikonfirmasi' },
  rescheduled:{ dot: 'bg-indigo-400',  chip: 'bg-indigo-50 text-indigo-700',  label: 'Dijadwal Ulang' },
  canceled:   { dot: 'bg-rose-400',    chip: 'bg-rose-50   text-rose-700',    label: 'Dibatalkan' },
  refunded:   { dot: 'bg-slate-400',   chip: 'bg-slate-100 text-slate-600',   label: 'Refund' },
}

function OrderRow({ order, onDetail, onPay, onCancel, onChat, chatUnread = 0, canceling }) {
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
              {tint.label}
            </span>
            <span className="text-[10px] font-mono text-slate-400 tracking-wider">{order.bookingCode}</span>
          </div>
          <p className="font-semibold text-slate-900 truncate text-sm sm:text-base">{order.hotel?.name}</p>
          <p className="text-xs text-slate-500 truncate">{order.room?.name}</p>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-400">
            <Calendar className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {formatDateShort(order.checkIn)} – {formatDateShort(order.checkOut)} · {order.totalNights} mlm · {order.guests} tamu
            </span>
          </div>
        </div>
      </div>

      {/* Footer: price + actions */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Total</p>
          <p className="text-base sm:text-lg font-black text-slate-900 leading-tight">{formatRupiah(order.totalPrice)}</p>
        </div>
        <div className="flex items-center gap-2">
          {onChat && (
            <button onClick={onChat}
              className="relative inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-blue-200 transition-all">
              <MessageSquare className="w-3.5 h-3.5" />
              Chat Penginapan
              {chatUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center bg-red-500 text-white text-[10px] font-extrabold rounded-full border-2 border-white shadow-sm">
                  {chatUnread > 99 ? '99+' : chatUnread}
                </span>
              )}
            </button>
          )}
          <button onClick={onDetail}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors">
            Detail
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          {order.status === 'pending' && (
            <>
              <button onClick={onPay}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-sm shadow-orange-200 transition-all">
                Bayar Sekarang
              </button>
              <button onClick={onCancel} disabled={canceling}
                title="Batalkan booking"
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50">
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {order.status === 'issued' && (
            <button onClick={onPay}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Jadwal Ulang
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionOrders() {
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
      toast({ title: 'Booking dibatalkan.' })
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: ['my-orders'] })
      const msg = e?.response?.data?.message || 'Gagal membatalkan booking.'
      toast({ title: 'Gagal membatalkan', description: msg, variant: 'destructive' })
    },
  })

  const totalOrders = data?.pagination?.total ?? data?.data?.length ?? 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Pesanan Saya</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Semua riwayat booking & transaksi PPOB.</p>
        </div>
        {activeMain === 'akomodasi' && totalOrders > 0 && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {totalOrders} pesanan
          </span>
        )}
      </div>

      {/* ── Main tabs Akomodasi | PPOB (underline style) ────────────────── */}
      <div className="relative border-b border-slate-200">
        <div className="flex gap-1 sm:gap-2">
          {[
            { value: 'akomodasi', label: 'Akomodasi', Icon: HotelIcon },
            { value: 'ppob',      label: 'PPOB',      Icon: Receipt },
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
              {tab.label}
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
                  onPay={() => navigate(`/payment/${order.id}`)}
                  onCancel={() => cancelMutation.mutate(order.id)}
                  onChat={(order.hotelId || order.hotel?.id) ? () => setChatBooking({
                    id: order.id,
                    hotelId: order.hotelId || order.hotel?.id,
                    hotelName: order.hotel?.name || 'Penginapan',
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
                <p className="font-semibold text-lg text-slate-800">Belum ada pesanan</p>
                <p className="text-sm text-slate-400 mt-1 mb-6">Mulai pesan hotel impian Anda!</p>
                <button onClick={() => navigate('/search')}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm">
                  Cari Hotel
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
  const tier = getTier(loyalty?.balance)
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">Poin Loyalitas</h2>
        <p className="text-sm text-slate-500">Kumpulkan poin dari setiap transaksi.</p>
      </div>
      <div className={`bg-gradient-to-br ${tier.color} rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg`}>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <span className="text-xs sm:text-sm font-semibold opacity-80">{tier.label}</span>
          <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-white/40 text-white/40" />
        </div>
        <p className="font-display text-4xl sm:text-5xl font-bold break-all">{(loyalty?.balance || 0).toLocaleString('id-ID')}</p>
        <p className="text-xs sm:text-sm opacity-80 mt-1">Poin tersedia</p>
        <p className="text-[11px] sm:text-xs opacity-60 mt-2 sm:mt-3 leading-relaxed">≈ {formatRupiah(loyalty?.balance || 0)} nilai tukar · 1 poin = Rp 1</p>
      </div>
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4">Cara Mendapatkan Poin</h3>
        <ul className="space-y-3">
          {[
            ['🏨', 'Selesaikan booking', '1 poin per Rp 1.000'],
            ['⭐', 'Beri ulasan hotel',  'Bonus 50 poin'],
            ['🎁', 'Referral teman baru','Bonus 100 poin'],
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
    </div>
  )
}

// ── Section: Ulasan Anda ──────────────────────────────────
function SectionReviews() {
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
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Ulasan Anda</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Riwayat semua ulasan yang Anda kirim.</p>
        </div>
        {stats.total > 0 && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {stats.total} ulasan
          </span>
        )}
      </div>

      {/* Stats strip */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Tayang',    val: stats.approved, color: 'from-emerald-50 to-emerald-100/40 text-emerald-700', icon: CheckCircle2 },
            { label: 'Menunggu',  val: stats.pending,  color: 'from-amber-50 to-amber-100/40 text-amber-700',       icon: Clock },
            { label: 'Ditolak',   val: stats.rejected, color: 'from-red-50 to-red-100/40 text-red-700',             icon: XCircle },
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
          <p className="font-semibold text-slate-700">Belum ada ulasan</p>
          <p className="text-sm text-slate-400 mt-1">Setelah Anda menginap atau membeli properti, Anda dapat memberikan ulasan.</p>
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
  const created = review.createdAt ? new Date(review.createdAt) : null
  const dateStr = created ? created.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  const statusConfig = {
    approved: { label: 'Tayang',   bg: 'bg-emerald-100', text: 'text-emerald-700', Icon: CheckCircle2 },
    pending:  { label: 'Menunggu', bg: 'bg-amber-100',   text: 'text-amber-700',   Icon: Clock },
    rejected: { label: 'Ditolak',  bg: 'bg-red-100',     text: 'text-red-700',     Icon: XCircle },
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
                {isHotel ? 'Penginapan' : 'Properti'}
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
            <p className="text-red-700"><strong>Alasan ditolak:</strong> {review.rejectedReason}</p>
          </div>
        )}

        {/* Pending hint */}
        {review.status === 'pending' && (
          <p className="mt-3 text-xs text-amber-700/80 italic">
            Ulasan Anda sedang ditinjau oleh tim ArahInn dan akan tayang setelah disetujui.
          </p>
        )}
      </div>
    </div>
  )
}

// ── Section: Metode Pembayaran ────────────────────────────
const BANKS = [
  { key: 'bca',     label: 'BCA Virtual Account',     logo: '/banks/bca.png',      desc: "Bayar via m-BCA, KlikBCA, atau ATM BCA" },
  { key: 'mandiri', label: 'Mandiri Virtual Account', logo: '/banks/mandiri.png',  desc: "Bayar via Livin' by Mandiri atau ATM Mandiri" },
  { key: 'bri',     label: 'BRI Virtual Account',     logo: '/banks/bri.svg',      desc: 'Bayar via BRImo atau ATM BRI' },
  { key: 'bsi',     label: 'BSI Virtual Account',     logo: '/banks/bank_bsi.png', desc: 'Bayar via BSI Mobile atau ATM BSI' },
]

function SectionPayment() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Metode Pembayaran</h2>
        <p className="text-sm text-slate-500 mt-0.5">Bank yang didukung untuk transaksi.</p>
      </div>

      {/* Hero — security */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-900 to-blue-700 p-5 shadow-md shadow-blue-200 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-white font-bold">Transaksi 100% Aman</p>
          <p className="text-white/80 text-xs mt-1 leading-relaxed">
            Pembayaran diproses melalui gateway terenkripsi & terverifikasi otomatis.
          </p>
        </div>
      </div>

      {/* VA Bank list */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Virtual Account Bank</p>
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
                  <p className="text-xs text-slate-500 mt-0.5">{b.desc}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-700">Aktif</span>
                </span>
              </div>
              {i < BANKS.length - 1 && <div className="h-px bg-slate-100 mx-4" />}
            </div>
          ))}
        </div>
      </div>

      {/* Coming soon */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Segera Hadir</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { Icon: Zap, label: 'E-Wallet', desc: 'GoPay, OVO, DANA' },
            { Icon: Building2, label: 'Kartu Kredit', desc: 'Visa, Mastercard' },
          ].map(({ Icon, label, desc }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 opacity-80">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-slate-400" />
              </div>
              <p className="font-semibold text-sm text-slate-900">{label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              <span className="inline-block mt-2 px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold">
                Segera
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* How to pay */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Cara Pembayaran</p>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          {[
            'Pilih akomodasi & lakukan pemesanan.',
            'Pilih metode pembayaran (Virtual Account).',
            'Pilih bank, sistem akan generate nomor VA.',
            'Transfer sesuai nominal & nomor VA dalam batas waktu.',
            'Pembayaran terverifikasi otomatis dalam 1–2 menit.',
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

// ── Section: Wishlist (Coming Soon) ───────────────────────
function SectionWishlist() {
  const navigate = useNavigate()
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Wishlist</h2>
        <p className="text-sm text-slate-500 mt-0.5">Hotel & properti favorit Anda.</p>
      </div>

      {/* Hero Coming Soon with pulse */}
      <div className="bg-white rounded-3xl border border-rose-100 shadow-md shadow-rose-100/50 p-10 text-center">
        <div className="relative inline-flex">
          <span className="absolute inset-0 rounded-full bg-rose-300/50 animate-ping" />
          <div className="relative w-24 h-24 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-300">
            <Heart className="w-12 h-12 text-white" fill="white" />
          </div>
        </div>
        <h3 className="mt-5 text-2xl font-black text-slate-900">Coming Soon</h3>
        <p className="mt-1.5 text-sm text-slate-500">Fitur Wishlist sedang dalam pengembangan</p>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-2">Apa Itu Wishlist?</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          Simpan hotel & properti favorit Anda untuk diakses lagi nanti. Cocok untuk rencana liburan, atau properti incaran yang ingin Anda pantau harga & ketersediaannya.
        </p>
      </div>

      {/* Features preview */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Yang Akan Hadir</p>
        <div className="space-y-2">
          {[
            { Icon: Heart,    title: 'Simpan Sekali Klik',         desc: 'Tambah ke wishlist langsung dari kartu hotel atau properti.' },
            { Icon: BedDouble,title: 'Pantau Ketersediaan Kamar',  desc: 'Dapat notifikasi saat hotel favorit punya promo.' },
            { Icon: Building2,title: 'Properti Favorit',           desc: 'Simpan properti dijual atau disewa untuk dipertimbangkan.' },
            { Icon: Search,   title: 'Akses Cepat',                desc: 'Buka kembali tanpa harus mencari ulang.' },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate('/search')}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand text-white rounded-2xl text-sm font-bold hover:bg-brand-700 transition-colors shadow-md shadow-brand/30"
      >
        <Search className="w-4 h-4" />
        Telusuri Hotel & Properti
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ── Section: Customer Care ────────────────────────────────
function SectionCustomerCare() {
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
        <h2 className="text-xl font-bold text-slate-900">Customer Care</h2>
        <p className="text-sm text-slate-500 mt-0.5">Hubungi kami atau atur preferensi akun.</p>
      </div>

      {/* ─── Section 1: Customer Support ──────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Customer Support</p>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
            supportOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${supportOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {supportOpen ? 'Online' : 'Offline'} · 09:00 – 00:00 WIB
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
              <p className="font-semibold text-sm text-slate-900">Pusat Bantuan</p>
              <p className="text-xs text-slate-500 mt-0.5">FAQ & panduan halo ArahInn</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded.help ? 'rotate-180' : ''}`} />
          </button>
          {expanded.help && (
            <div className="px-5 pb-4 bg-slate-50/50 border-t border-slate-100">
              <div className="space-y-2 pt-3">
                {[
                  { q: 'Bagaimana cara memesan kamar?',          a: 'Pilih hotel → pilih tanggal & kamar → checkout → bayar via Virtual Account.' },
                  { q: 'Bagaimana cara membatalkan booking?',    a: 'Buka menu Pesanan Saya → pilih booking → klik Batalkan. Refund mengikuti kebijakan hotel.' },
                  { q: 'Berapa lama pembayaran terverifikasi?',  a: 'Pembayaran via VA terverifikasi otomatis dalam 1–2 menit setelah transfer.' },
                  { q: 'Bagaimana mengubah jadwal menginap?',    a: 'Buka detail booking → Jadwal Ulang. Tersedia untuk booking dengan status Dikonfirmasi.' },
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
              <p className="font-semibold text-sm text-slate-900">Live Chat</p>
              <p className="text-xs text-slate-500 mt-0.5">Chat langsung dengan tim kami</p>
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
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Pengaturan</p>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Bahasa */}
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900">Bahasa</p>
              <p className="text-xs text-slate-500 mt-0.5">Pilih bahasa antarmuka</p>
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
              <p className="font-semibold text-sm text-slate-900">Mata Uang</p>
              <p className="text-xs text-slate-500 mt-0.5">Tampilan harga</p>
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
              <p className="font-semibold text-sm text-slate-900">Negara</p>
              <p className="text-xs text-slate-500 mt-0.5">Region akun & promo</p>
            </div>
            <select
              value={settings.country}
              onChange={(e) => setSettings(p => ({ ...p, country: e.target.value }))}
              className="text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="ID">🇮🇩 Indonesia</option>
              <option value="SG">🇸🇬 Singapura</option>
              <option value="MY">🇲🇾 Malaysia</option>
              <option value="TH">🇹🇭 Thailand</option>
            </select>
          </div>

          <div className="h-px bg-slate-100 mx-5" />

          {/* Lokasi toggle */}
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900">Lokasi</p>
              <p className="text-xs text-slate-500 mt-0.5">Aktifkan untuk rekomendasi hotel terdekat</p>
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
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Lainnya</p>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tentang ArahInn — expandable */}
          <button onClick={() => toggle('about')}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900">Tentang ArahInn</p>
              <p className="text-xs text-slate-500 mt-0.5">Profil & informasi perusahaan</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded.about ? 'rotate-180' : ''}`} />
          </button>
          {expanded.about && (
            <div className="px-5 pb-4 bg-slate-50/50 border-t border-slate-100">
              <div className="pt-3.5">
                <div className="mb-3">
                  <p className="text-sm font-bold text-slate-900">ArahInn.com</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Platform terpadu untuk akomodasi, transportasi, dan aktivitas wisata di Indonesia.
                    Hadir untuk memudahkan perjalanan Anda dengan harga terbaik dari ribuan partner hotel & properti.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[
                    { label: '1.000+', sub: 'Hotel Partner' },
                    { label: '50+',    sub: 'Kota di Indonesia' },
                    { label: '24/7',   sub: 'Sistem Booking' },
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
              <p className="font-semibold text-sm text-slate-900">Kebijakan Privasi</p>
              <p className="text-xs text-slate-500 mt-0.5">Cara kami menggunakan data Anda</p>
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
              <p className="font-semibold text-sm text-slate-900">Syarat & Ketentuan</p>
              <p className="text-xs text-slate-500 mt-0.5">Aturan penggunaan platform</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </a>
        </div>
      </div>

    </div>
  )
}

function ComingSoon({ title }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
        <p className="text-5xl mb-4">🚧</p>
        <p className="font-semibold text-slate-700">Segera Hadir</p>
        <p className="text-sm text-slate-400 mt-1">Fitur ini sedang dalam pengembangan.</p>
      </div>
    </div>
  )
}

// ── Menu definitions ──────────────────────────────────────
const MENU_USER = [
  { id: 'account',  label: 'Akun',             icon: User          },
  { id: 'orders',   label: 'Pesanan Saya',      icon: ShoppingBag   },
  { id: 'security', label: 'Keamanan',          icon: Shield        },
  { id: 'loyalty',  label: 'Poin Loyalitas',    icon: Star          },
  { id: 'reviews',  label: 'Ulasan Anda',       icon: MessageSquare },
  { id: 'payment',  label: 'Metode Pembayaran', icon: CreditCard    },
  { id: 'wishlist', label: 'Wishlist',          icon: Heart         },
  { id: 'care',     label: 'Customer Care',     icon: Headphones    },
]

const MENU_PENGELOLA = [
  { id: 'account',  label: 'Akun',      icon: User   },
  { id: 'security', label: 'Keamanan',  icon: Shield },
]

const PENGELOLA_ROLES = ['superadmin', 'admin', 'owner', 'finance', 'admin_property', 'design_interior']

export default function Profile() {
  const { user, updateUser } = useAuthStore()
  const [active, setActive]  = useState('account')

  const isPengelola = PENGELOLA_ROLES.includes(user?.role)
  const MENU        = isPengelola ? MENU_PENGELOLA : MENU_USER

  const { data: loyalty } = useQuery({
    queryKey: ['loyalty-balance'],
    queryFn : () => promoApi.loyalty.balance().then(r => r.data.data),
    enabled : !isPengelola,
  })

  const tier = getTier(loyalty?.balance)

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
                {item.label}
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
                <div className={`mt-4 bg-gradient-to-r ${tier.color} rounded-xl p-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-white/70" />
                      <span className="text-sm font-semibold text-white">{tier.label}</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-bold text-white">{(loyalty?.balance || 0).toLocaleString('id-ID')}</span>
                    <span className="text-xs text-white/70">Poin</span>
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
                  {item.label}
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
