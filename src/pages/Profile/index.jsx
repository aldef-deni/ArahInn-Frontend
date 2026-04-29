import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { userApi, promoApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/utils'
import { User, Mail, Phone, Lock, Star, Camera, Save, Eye, EyeOff } from 'lucide-react'

export default function Profile() {
  const { user, updateUser } = useAuthStore()
  const { toast }            = useToast()
  const qc                   = useQueryClient()
  const [showPass, setShowPass] = useState(false)
  const [tab, setTab]        = useState('profile')

  const { data: loyalty } = useQuery({
    queryKey: ['loyalty-balance'],
    queryFn : () => promoApi.loyalty.balance().then(r => r.data.data),
  })

  const { register: regProfile, handleSubmit: handleProfile } = useForm({
    defaultValues: { name: user?.name, phone: user?.phone },
  })
  const { register: regPass, handleSubmit: handlePass, reset: resetPass, watch } = useForm()

  const profileMutation = useMutation({
    mutationFn: (d) => userApi.update(d),
    onSuccess : (r) => {
      updateUser(r.data.data)
      toast({ title: 'Profil berhasil diperbarui.' })
      qc.invalidateQueries(['profile'])
    },
    onError: () => toast({ title: 'Gagal memperbarui profil.', variant: 'destructive' }),
  })

  const passMutation = useMutation({
    mutationFn: (d) => userApi.password(d),
    onSuccess : () => {
      toast({ title: 'Password berhasil diubah.' })
      resetPass()
    },
    onError: (e) => toast({ title: 'Gagal', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const avatarMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData()
      fd.append('avatar', file)
      return userApi.avatar(fd)
    },
    onSuccess: (r) => {
      updateUser(r.data.data)
      toast({ title: 'Foto profil diperbarui.' })
    },
  })

  const tabs = [
    { id: 'profile', label: 'Profil' },
    { id: 'security', label: 'Keamanan' },
    { id: 'loyalty', label: 'Poin Loyalitas' },
  ]

  return (
    <div className="container py-8 max-w-3xl">
      <h1 className="font-display text-2xl font-bold mb-8">Akun Saya</h1>

      {/* Avatar & name header */}
      <div className="bg-white border rounded-2xl p-6 shadow-card mb-6 flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-brand/10 flex items-center justify-center">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              : <span className="text-3xl font-bold text-brand-600">{user?.name?.[0]?.toUpperCase()}</span>}
          </div>
          <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center cursor-pointer hover:bg-brand-700 transition-colors shadow-sm">
            <Camera className="w-3.5 h-3.5" />
            <input type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files[0] && avatarMutation.mutate(e.target.files[0])} />
          </label>
        </div>
        <div>
          <h2 className="font-semibold text-lg">{user?.name}</h2>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="px-2.5 py-0.5 bg-brand/10 text-brand-700 rounded-full text-xs font-medium capitalize">
              {user?.role?.replace('_', ' ')}
            </span>
            {loyalty?.balance > 0 && (
              <span className="px-2.5 py-0.5 bg-gold/10 text-gold-dark rounded-full text-xs font-medium flex items-center gap-1">
                <Star className="w-3 h-3 fill-gold text-gold" /> {loyalty.balance.toLocaleString('id-ID')} poin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile form */}
      {tab === 'profile' && (
        <div className="bg-white border rounded-2xl p-6 shadow-card animate-fade-in">
          <h2 className="font-semibold mb-5">Informasi Profil</h2>
          <form onSubmit={handleProfile(d => profileMutation.mutate(d))} className="space-y-4">
            {[
              { name: 'name',  label: 'Nama Lengkap', icon: User,  type: 'text',  placeholder: 'Nama Anda' },
              { name: 'phone', label: 'No. Telepon',   icon: Phone, type: 'tel',   placeholder: '08xxxxxxxxxx' },
            ].map(({ name, label, icon: Icon, type, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-medium mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type={type} placeholder={placeholder}
                    {...regProfile(name)}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand" />
                </div>
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={user?.email} disabled
                  className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-muted/50 text-muted-foreground cursor-not-allowed" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Email tidak dapat diubah.</p>
            </div>
            <button type="submit" disabled={profileMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors">
              <Save className="w-4 h-4" />
              {profileMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>
      )}

      {/* Security form */}
      {tab === 'security' && (
        <div className="bg-white border rounded-2xl p-6 shadow-card animate-fade-in">
          <h2 className="font-semibold mb-5">Ubah Password</h2>
          <form onSubmit={handlePass(d => passMutation.mutate(d))} className="space-y-4">
            {[
              { name: 'oldPassword', label: 'Password Lama',        rules: { required: 'Wajib diisi' } },
              { name: 'newPassword', label: 'Password Baru',        rules: { required: 'Wajib diisi', minLength: { value: 8, message: 'Minimal 8 karakter' } } },
              { name: 'confirm',     label: 'Konfirmasi Password',  rules: { required: 'Wajib diisi', validate: v => v === watch('newPassword') || 'Password tidak cocok' } },
            ].map(({ name, label, rules }) => (
              <div key={name}>
                <label className="block text-sm font-medium mb-1.5">{label}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type={showPass ? 'text' : 'password'}
                    {...regPass(name, rules)}
                    className="w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand" />
                  {name === 'oldPassword' && (
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="submit" disabled={passMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors">
              <Lock className="w-4 h-4" />
              {passMutation.isPending ? 'Menyimpan...' : 'Ubah Password'}
            </button>
          </form>
        </div>
      )}

      {/* Loyalty */}
      {tab === 'loyalty' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-gradient-to-br from-gold to-amber-500 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-amber-100 text-sm font-medium">Total Poin Loyalitas</p>
            <p className="font-display text-5xl font-bold mt-2">{loyalty?.balance?.toLocaleString('id-ID') || 0}</p>
            <p className="text-amber-100 text-sm mt-1">≈ {formatRupiah(loyalty?.balance || 0)} nilai tukar</p>
            <p className="text-xs text-amber-200 mt-3">1 poin = Rp 1 · Maks redeem 10% dari total transaksi</p>
          </div>
          <div className="bg-white border rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold mb-3">Cara Mendapatkan Poin</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                ['🏨', 'Selesaikan booking → 1 poin per Rp 1.000'],
                ['⭐', 'Beri ulasan hotel → bonus 50 poin'],
                ['🎁', 'Referral teman baru → bonus 100 poin'],
              ].map(([icon, text]) => (
                <li key={text} className="flex items-center gap-2.5 p-3 bg-muted/50 rounded-xl">
                  <span className="text-xl">{icon}</span>{text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
