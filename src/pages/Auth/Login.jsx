import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { authApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react'
import { isManagementRole, isOwnerRole } from '@/utils/isExtranet'
import SEO from '@/components/SEO'
import { applyServerErrors } from '@/utils/formErrors'

export default function Login() {
  const { t }      = useTranslation()
  const navigate   = useNavigate()
  const setAuth    = useAuthStore(s => s.setAuth)
  const { toast }  = useToast()
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors }, setError } = useForm()

  const mutation = useMutation({
    mutationFn: (d) => authApi.login(d),
    onSuccess : (r) => {
      const { user, accessToken, refreshToken } = r.data.data
      const rolesPayload = user.roles || user.role
      const hasCustomer  = (user.roles || []).includes('user') || user.role === 'user'

      // Multi-role friendly: kalau user juga punya role 'user' (customer),
      // perbolehkan login dari portal customer meskipun juga punya role lain.
      if (!hasCustomer && isManagementRole(rolesPayload)) {
        toast({
          title: 'Login gagal',
          description: 'Akun superadmin, market manager, dan finance tidak bisa login dari arahinn.com.',
          variant: 'destructive',
        })
        setAuth(null, null, null)
        return
      }
      if (!hasCustomer && isOwnerRole(rolesPayload)) {
        toast({
          title: 'Login gagal',
          description: 'Akun owner properti tidak bisa login dari arahinn.com.',
          variant: 'destructive',
        })
        setAuth(null, null, null)
        return
      }

      // Paksa primary role = 'user' supaya UI render mode customer
      const effectiveUser = { ...user, role: 'user' }

      setAuth(effectiveUser, accessToken, refreshToken)
      toast({ title: t('auth.welcome', { name: user.name }) })
      navigate('/dashboard')
    },
    onError: (e) => {
      // Error ditempelkan ke kolom yang salah (email / password).
      // Toast hanya muncul untuk error yang tidak terkait kolom tertentu.
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

  // Kolom yang error → border merah supaya jelas kolom mana yang salah.
  const inputCls = (hasError, extraPad = 'pr-4') =>
    `w-full pl-10 ${extraPad} py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${
      hasError
        ? 'border-red-400 bg-red-50/40 focus:ring-red-300 focus:border-red-500'
        : 'focus:ring-brand/50 focus:border-brand'
    }`

  return (
    <div className="animate-fade-in">
      <SEO title="Masuk" description="Masuk ke akun ArahInn untuk memesan hotel, villa, dan layanan lainnya." url="/login" noindex />
      <h2 className="font-display text-3xl font-bold mb-2">{t('auth.login')}</h2>
      <p className="text-muted-foreground mb-8">{t('auth.noAccount')}{' '}
        <Link to="/register" className="text-brand font-medium hover:underline">{t('auth.register')}</Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">{t('auth.email')}</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="email" placeholder="email@contoh.com"
              {...register('email', {
                required: 'Email wajib diisi.',
                pattern : { value: /^\S+@\S+\.\S+$/, message: 'Format email belum benar. Contoh: nama@email.com' },
              })}
              aria-invalid={!!errors.email}
              className={inputCls(!!errors.email)} />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">{t('auth.password')}</label>
            <Link to="/forgot-password" className="text-xs text-brand hover:underline">{t('auth.forgot')}</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type={showPass ? 'text' : 'password'} placeholder="Masukkan password Anda"
              {...register('password', { required: 'Password wajib diisi.' })}
              aria-invalid={!!errors.password}
              className={inputCls(!!errors.password, 'pr-10')} />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={mutation.isPending}
          className="w-full py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-brand/30 shadow-md flex items-center justify-center gap-2">
          {mutation.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LogIn className="w-4 h-4" />}
          {mutation.isPending ? 'Memproses...' : t('auth.login')}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs text-muted-foreground bg-white px-3">{t('auth.orWith')}</div>
      </div>

      {/* OAuth buttons */}
      {(() => {
        const apiBase = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/+$/, '')
        return (
          <a href={`${apiBase}/auth/google`}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </a>
        )
      })()}
    </div>
  )
}
