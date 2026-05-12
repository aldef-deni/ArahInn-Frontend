import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { authApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react'
import {
  getCustomerPortalUrl,
  getManagementPortalUrl,
  getOwnerPortalUrl,
  isManagementPortal,
  isManagementRole,
  isOwnerPortal,
  isOwnerRole,
} from '@/utils/isExtranet'

export default function LoginExtranet() {
  const navigate  = useNavigate()
  const setAuth   = useAuthStore(s => s.setAuth)
  const { toast } = useToast()
  const [showPass, setShowPass] = useState(false)
  const managementMode = isManagementPortal()
  const ownerMode = isOwnerPortal()

  const { register, handleSubmit, formState: { errors } } = useForm()

  const mutation = useMutation({
    mutationFn: (d) => authApi.login(d),
    onSuccess: (r) => {
      const { user, accessToken, refreshToken } = r.data.data
      if (managementMode && !isManagementRole(user.role)) {
        if (isOwnerRole(user.role)) {
          toast({
            title: 'Gunakan portal Extranet',
            description: 'Akun owner properti harus login melalui extranet.arahinn.com.',
            variant: 'destructive',
          })
          setTimeout(() => {
            window.location.href = getOwnerPortalUrl('/owner')
          }, 1200)
          return
        }
        toast({
          title: 'Akses ditolak',
          description: 'Akun ini bukan akun pengelola. Gunakan portal utama arahinn.com.',
          variant: 'destructive',
        })
        setTimeout(() => {
          window.location.href = getCustomerPortalUrl()
        }, 1200)
        return
      }

      if (ownerMode && !isOwnerRole(user.role)) {
        if (isManagementRole(user.role)) {
          toast({
            title: 'Gunakan portal Kelola',
            description: 'Akun pengelola harus login melalui kelola.arahinn.com.',
            variant: 'destructive',
          })
          setTimeout(() => {
            window.location.href = getManagementPortalUrl('/admin')
          }, 1200)
          return
        }
        toast({
          title: 'Akses ditolak',
          description: 'Akun ini bukan akun owner properti. Gunakan portal utama arahinn.com.',
          variant: 'destructive',
        })
        setTimeout(() => {
          window.location.href = getCustomerPortalUrl()
        }, 1200)
        return
      }

      setAuth(user, accessToken, refreshToken)
      toast({ title: `Selamat datang, ${user.name}!` })
      navigate(isOwnerRole(user.role) ? '/owner' : '/admin')
    },
    onError: (e) => toast({
      title: 'Login gagal',
      description: e?.response?.data?.message || 'Email atau password salah.',
      variant: 'destructive',
    }),
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

      <p className="mt-8 pt-6 border-t border-muted text-center text-xs text-muted-foreground">
        Bukan pengelola properti?{' '}
        <a href={getCustomerPortalUrl()} className="text-brand hover:underline font-medium">
          Kembali ke Arahinn.com
        </a>
      </p>
    </div>
  )
}
