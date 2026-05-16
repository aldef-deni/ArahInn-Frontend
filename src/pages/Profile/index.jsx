import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { userApi, promoApi, bookingApi } from '@/services/index'
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
} from 'lucide-react'

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
        <h2 className="text-xl font-bold text-slate-900 mb-1">Akun</h2>
        <p className="text-sm text-slate-500">Kelola informasi profil Anda.</p>
      </div>

      {/* Avatar card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <Avatar key={user?.avatar || 'default'} user={user} size="lg" />
            {avatarMutation.isPending && (
              <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            <label className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center transition-colors shadow-sm ${avatarMutation.isPending ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer hover:bg-brand-700'}`}>
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept=".jpg,.jpeg,.png" className="hidden" disabled={avatarMutation.isPending}
                onChange={e => { handleAvatarChange(e.target.files[0]); e.target.value = '' }} />
            </label>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-lg text-slate-900">{user?.name}</p>
              <BadgeCheck className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <p className="text-xs text-slate-400 mt-1 capitalize">{user?.role?.replace('_', ' ')}</p>
            <p className="text-xs text-slate-400 mt-1">Foto avatar: min. resolusi 256 px · maks. 5 MB.</p>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
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
        <h2 className="text-xl font-bold text-slate-900 mb-1">Keamanan</h2>
        <p className="text-sm text-slate-500">Kelola password akun Anda.</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
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

function SectionOrders() {
  const navigate = useNavigate()
  const qc       = useQueryClient()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', activeTab, page],
    queryFn : () => bookingApi.myOrders({ status: activeTab || undefined, page, limit: 6 }).then(r => r.data),
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => bookingApi.cancel(id),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['my-orders'] })
      toast({ title: 'Booking dibatalkan.' })
    },
    onError: (e) => {
      // Refresh list regardless so stale status gets corrected
      qc.invalidateQueries({ queryKey: ['my-orders'] })
      const msg = e?.response?.data?.message || 'Gagal membatalkan booking.'
      toast({ title: 'Gagal membatalkan', description: msg, variant: 'destructive' })
    },
  })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Pesanan Saya</h2>
        <p className="text-sm text-slate-500">Semua riwayat booking Anda.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {ORDER_TABS.map(tab => (
          <button key={tab.value} onClick={() => { setActiveTab(tab.value); setPage(1) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors border ${
              activeTab === tab.value ? 'bg-brand text-white border-brand' : 'border-slate-200 hover:bg-slate-50'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="skeleton h-5 w-2/3 rounded mb-3" /><div className="skeleton h-4 w-1/2 rounded" />
              </div>
            ))
          : data?.data?.length
            ? data.data.map(order => (
                <div key={order.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className={`px-5 py-2 text-xs font-semibold flex items-center justify-between ${
                    order.status === 'issued'   ? 'bg-blue-50'   :
                    order.status === 'paid'     ? 'bg-green-50'  :
                    order.status === 'canceled' ? 'bg-red-50'    : 'bg-yellow-50'
                  }`}>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                    <span className="text-slate-400 font-mono">{order.bookingCode}</span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                          {order.hotel?.images?.[0]
                            ? <img src={getImageUrl(order.hotel.images[0])} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-2xl">🏨</div>}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{order.hotel?.name}</p>
                          <p className="text-sm text-slate-500">{order.room?.name}</p>
                          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDateShort(order.checkIn)} – {formatDateShort(order.checkOut)} · {order.totalNights} malam
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-slate-900">{formatRupiah(order.totalPrice)}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{order.guests} tamu</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                      <button onClick={() => navigate(`/booking/${order.id}`)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                        Detail <ChevronRight className="w-4 h-4" />
                      </button>
                      {order.status === 'pending' && (
                        <>
                          <button onClick={() => navigate(`/payment/${order.id}`)}
                            className="flex-1 py-2 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors">
                            Bayar Sekarang
                          </button>
                          <button onClick={() => cancelMutation.mutate(order.id)} disabled={cancelMutation.isPending}
                            className="px-3 py-2 border border-red-200 text-red-500 rounded-xl text-sm hover:bg-red-50 transition-colors">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {order.status === 'issued' && (
                        <button onClick={() => navigate(`/payment/${order.id}`)}
                          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                          <RefreshCw className="w-4 h-4" /> Jadwal Ulang
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            : (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <p className="text-5xl mb-4">📭</p>
                <p className="font-semibold text-lg text-slate-800">Belum ada pesanan</p>
                <p className="text-sm text-slate-400 mt-1 mb-6">Mulai pesan hotel impian Anda!</p>
                <button onClick={() => navigate('/search')}
                  className="px-6 py-2.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors">
                  Cari Hotel
                </button>
              </div>
            )
        }
      </div>

      {data?.pagination?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-medium border transition-colors ${
                page === p ? 'bg-brand text-white border-brand' : 'border-slate-200 hover:bg-slate-50'
              }`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function SectionLoyalty({ loyalty }) {
  const tier = getTier(loyalty?.balance)
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Poin Loyalitas</h2>
        <p className="text-sm text-slate-500">Kumpulkan poin dari setiap transaksi.</p>
      </div>
      <div className={`bg-gradient-to-br ${tier.color} rounded-2xl p-6 text-white shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold opacity-80">{tier.label}</span>
          <Star className="w-6 h-6 fill-white/40 text-white/40" />
        </div>
        <p className="font-display text-5xl font-bold">{(loyalty?.balance || 0).toLocaleString('id-ID')}</p>
        <p className="text-sm opacity-80 mt-1">Poin tersedia</p>
        <p className="text-xs opacity-60 mt-3">≈ {formatRupiah(loyalty?.balance || 0)} nilai tukar · 1 poin = Rp 1</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
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
      case 'reviews':  return <ComingSoon title="Ulasan Anda" />
      case 'payment':  return <ComingSoon title="Metode Pembayaran" />
      case 'wishlist': return <ComingSoon title="Wishlist" />
      default:         return null
    }
  }

  return (
    <div className="bg-[#f0f3f8] min-h-screen py-8">
      <div className="container max-w-6xl">
        <div className="flex gap-6 items-start">

          {/* ── Sidebar ─────────────────────────────────── */}
          <aside className="w-[280px] shrink-0 sticky top-24 space-y-4">
            {/* User card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
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
          <main className="flex-1 min-w-0 animate-fade-in">
            {renderContent()}
          </main>

        </div>
      </div>
    </div>
  )
}
