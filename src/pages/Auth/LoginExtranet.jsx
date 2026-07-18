import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { authApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Mail, Lock, LogIn, UserPlus } from 'lucide-react'
import {
  getCustomerPortalUrl,
  getManagementPortalUrl,
  getOwnerPortalUrl,
  isManagementPortal,
  isManagementRole,
  isOwnerPortal,
  isOwnerRole,
} from '@/utils/isExtranet'
import { applyServerErrors } from '@/utils/formErrors'

export default function LoginExtranet() {
  const navigate  = useNavigate()
  const setAuth   = useAuthStore(s => s.setAuth)
  const { toast } = useToast()
  const [showPass, setShowPass] = useState(false)
  const managementMode = isManagementPortal()
  const ownerMode = isOwnerPortal()

  const { register, handleSubmit, formState: { errors }, setError } = useForm()

  const mutation = useMutation({
    // Portal owner → backend pilih akun primary_role='owner' (model akun terpisah)
    mutationFn: (d) => authApi.login(ownerMode ? { ...d, portal: 'owner' } : d),
    onSuccess: (r) => {
      const { user, accessToken, refreshToken } = r.data.data

      // Cek dari array `roles` (multi-role) — fallback ke `role` (single)
      const rolesPayload = user.roles || user.role
      const isMgmt   = isManagementRole(rolesPayload)
      const isOwner  = isOwnerRole(rolesPayload)

      if (managementMode && !isMgmt) {
        if (isOwner) {
          toast({
            title: 'Gunakan portal Owner',
            description: 'Akun owner properti harus login melalui my.arahinn.com.',
            variant: 'destructive',
          })
          setTimeout(() => { window.location.href = getOwnerPortalUrl('/owner') }, 1200)
          return
        }
        toast({
          title: 'Akses ditolak',
          description: 'Akun ini bukan akun pengelola. Gunakan portal utama arahinn.com.',
          variant: 'destructive',
        })
        setTimeout(() => { window.location.href = getCustomerPortalUrl() }, 1200)
        return
      }

      if (ownerMode && !isOwner) {
        if (isMgmt) {
          toast({
            title: 'Gunakan portal Kelola',
            description: 'Akun pengelola harus login melalui kelola.arahinn.com.',
            variant: 'destructive',
          })
          setTimeout(() => { window.location.href = getManagementPortalUrl('/admin') }, 1200)
          return
        }
        toast({
          title: 'Akses ditolak',
          description: 'Akun ini bukan akun owner properti. Gunakan portal utama arahinn.com.',
          variant: 'destructive',
        })
        setTimeout(() => { window.location.href = getCustomerPortalUrl() }, 1200)
        return
      }

      // Force primary role saat di extranet: kalau user multi-role,
      // set role aktif sesuai portal yang sedang diakses
      const effectiveUser = { ...user, role: ownerMode ? 'owner' : (isMgmt ? (user.role || 'admin') : user.role) }

      setAuth(effectiveUser, accessToken, refreshToken)
      toast({ title: `Selamat datang, ${user.name}!` })
      navigate(ownerMode ? '/owner' : '/admin')
    },
    onError: (e) => {
      // Error ditempelkan ke kolom yang salah; toast hanya untuk error umum.
      const generalMsg = applyServerErrors(e, setError, {
        email_not_found: {
          field  : 'email',
          message: 'Email Anda salah atau belum terdaftar. Coba ulangi lagi.',
        },
        wrong_password: {
          field  : 'password',
          message: 'Password Anda salah, coba ulangi lagi.',
        },
      })
      if (generalMsg) {
        toast({ title: 'Login gagal', description: generalMsg, variant: 'destructive' })
      }
    },
  })

  const onSubmit = (d) => mutation.mutate(d)

  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-3xl font-bold mb-2">Masuk Extranet</h2>
      <p className="text-muted-foreground mb-8">
        Portal khusus pengelola properti Arahinn.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="email" placeholder="email@contoh.com"
              {...register('email', { required: 'Email wajib diisi', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Format email tidak valid' } })}
              className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand" />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type={showPass ? 'text' : 'password'} placeholder="Minimal 6 karakter"
              {...register('password', { required: 'Password wajib diisi', minLength: { value: 6, message: 'Minimal 6 karakter' } })}
              className="w-full pl-10 pr-10 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand" />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={mutation.isPending}
          className="w-full py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-brand/30 shadow-md flex items-center justify-center gap-2">
          {mutation.isPending
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <LogIn className="w-4 h-4" />}
          {mutation.isPending ? 'Memproses...' : 'Masuk'}
        </button>
      </form>

      {/* Register CTA — hanya untuk owner portal */}
      {ownerMode && (
        <div className="mt-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-semibold text-slate-900 mb-1">Belum punya akun owner?</p>
          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            Daftarkan properti Anda sekarang dan mulai menerima booking dari ribuan tamu.
          </p>
          <Link to="/register"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm shadow-amber-200">
            <UserPlus className="w-3.5 h-3.5" />
            Daftar Sebagai Owner
          </Link>
        </div>
      )}

      <p className="mt-8 pt-6 border-t border-muted text-center text-xs text-muted-foreground">
        Bukan pengelola properti?{' '}
        <a href={getCustomerPortalUrl()} className="text-brand hover:underline font-medium">
          Kembali ke Arahinn.com
        </a>
      </p>
    </div>
  )
}
