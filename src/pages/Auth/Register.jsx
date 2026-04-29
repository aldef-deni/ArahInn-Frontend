import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { authApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Mail, Lock, User, Phone, UserPlus } from 'lucide-react'

export default function Register() {
  const { t }     = useTranslation()
  const navigate  = useNavigate()
  const setAuth   = useAuthStore(s => s.setAuth)
  const { toast } = useToast()
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  const mutation = useMutation({
    mutationFn: (d) => authApi.register(d),
    onSuccess : (r) => {
      const { user, accessToken, refreshToken } = r.data.data
      setAuth(user, accessToken, refreshToken)
      toast({ title: 'Selamat datang! 🎉', description: 'Akun berhasil dibuat.' })
      navigate('/')
    },
    onError: (e) => toast({ title: 'Registrasi gagal', description: e?.response?.data?.message || 'Coba lagi.', variant: 'destructive' }),
  })

  const onSubmit = ({ confirmPassword, ...d }) => mutation.mutate(d)

  const fields = [
    { name: 'name',    label: t('auth.name'),    icon: User,  type: 'text',     placeholder: 'Nama Lengkap Anda', rules: { required: 'Nama wajib diisi', minLength: { value: 3, message: 'Minimal 3 karakter' } } },
    { name: 'email',   label: t('auth.email'),   icon: Mail,  type: 'email',    placeholder: 'email@contoh.com', rules: { required: 'Email wajib diisi', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Format email tidak valid' } } },
    { name: 'phone',   label: t('auth.phone'),   icon: Phone, type: 'tel',      placeholder: '08xxxxxxxxxx', rules: {} },
  ]

  return (
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
            <input type={showPass ? 'text' : 'password'} placeholder="Minimal 8 karakter"
              {...register('password', { required: 'Password wajib diisi', minLength: { value: 8, message: 'Minimal 8 karakter' } })}
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
    </div>
  )
}
