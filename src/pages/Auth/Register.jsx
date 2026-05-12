import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { authApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Mail, Lock, User, Phone, UserPlus, CheckCircle2, X } from 'lucide-react'

export default function Register() {
  const { t }     = useTranslation()
  const navigate  = useNavigate()
  const setAuth   = useAuthStore(s => s.setAuth)
  const { toast } = useToast()
  const [showPass,    setShowPass]    = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [registeredEmail, setEmail]   = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  const mutation = useMutation({
    mutationFn: (d) => authApi.register(d),
    onSuccess : (r) => {
      const { user, accessToken, refreshToken } = r.data.data
      setAuth(user, accessToken, refreshToken)
      setEmail(user.email)
      setShowSuccess(true)
    },
    onError: (e) => toast({ title: 'Registrasi gagal', description: e?.response?.data?.message || 'Coba lagi.', variant: 'destructive' }),
  })

  const handleClose = () => { setShowSuccess(false); navigate('/') }

  const onSubmit = ({ confirmPassword, ...d }) => mutation.mutate(d)

  const fields = [
    { name: 'name',    label: t('auth.name'),    icon: User,  type: 'text',     placeholder: 'Nama Lengkap Anda', rules: { required: 'Nama wajib diisi', minLength: { value: 3, message: 'Minimal 3 karakter' } } },
    { name: 'email',   label: t('auth.email'),   icon: Mail,  type: 'email',    placeholder: 'email@contoh.com', rules: { required: 'Email wajib diisi', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Format email tidak valid' } } },
    { name: 'phone',   label: t('auth.phone'),   icon: Phone, type: 'tel',      placeholder: '08xxxxxxxxxx', rules: {} },
  ]

  return (
    <>
    {/* Success popup */}
    {showSuccess && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
          <div className="flex justify-end px-5 pt-4">
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="px-8 pb-8 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-slate-900">
                Terima kasih sudah mendaftar di Arahinn.com!
              </h3>
              <p className="mt-1 text-sm text-slate-500">Akun Anda berhasil dibuat.</p>
            </div>
            <div className="bg-blue-50 rounded-xl px-5 py-4 text-left space-y-1.5">
              <p className="text-sm font-semibold text-blue-800">Verifikasi Email</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Kami telah mengirimkan email sambutan ke <span className="font-semibold">{registeredEmail}</span>.
                Silakan cek kotak masuk Anda (termasuk folder <em>Spam</em>) untuk mengkonfirmasi akun.
              </p>
            </div>
            <button onClick={handleClose}
              className="w-full py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-sm">
              Tutup
            </button>
          </div>
        </div>
      </div>
    )}

    <div className="animate-fade-in">
      <h2 className="font-display text-3xl font-bold mb-2">{t('auth.register')}</h2>
      <p className="text-muted-foreground mb-8">{t('auth.haveAccount')}{' '}
        <Link to="/login" className="text-brand font-medium hover:underline">{t('auth.login')}</Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {fields.map(({ name, label, icon: Icon, type, placeholder, rules }) => (
          <div key={name}>
            <label className="block text-sm font-medium mb-1.5">
              {label} {rules.required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type={type} placeholder={placeholder}
                {...register(name, rules)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand" />
            </div>
            {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>}
          </div>
        ))}

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-1.5">{t('auth.password')} <span className="text-red-500">*</span></label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type={showPass ? 'text' : 'password'} placeholder="Minimal 6 karakter"
              {...register('password', { required: 'Password wajib diisi', minLength: { value: 6, message: 'Minimal 6 karakter' } })}
              className="w-full pl-10 pr-10 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand" />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Konfirmasi Password <span className="text-red-500">*</span></label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="password" placeholder="Ulangi password"
              {...register('confirmPassword', { required: 'Konfirmasi password', validate: v => v === password || 'Password tidak cocok' })}
              className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand" />
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={mutation.isPending}
          className="w-full py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-brand/30 shadow-md flex items-center justify-center gap-2 mt-2">
          {mutation.isPending
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <UserPlus className="w-4 h-4" />}
          {mutation.isPending ? 'Memproses...' : 'Buat Akun'}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          Dengan mendaftar, Anda menyetujui{' '}
          <a href="#" className="text-brand hover:underline">Syarat & Ketentuan</a>{' '}dan{' '}
          <a href="#" className="text-brand hover:underline">Kebijakan Privasi</a> kami.
        </p>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs text-muted-foreground bg-white px-3">{t('auth.orWith')}</div>
      </div>

      {/* Google SSO */}
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
    </>
  )
}
