import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { authApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import {
  Eye, EyeOff, Mail, Lock, User, Phone, UserPlus,
  Building2, ShieldCheck, CheckCircle2, Sparkles, Check, X,
} from 'lucide-react'
import { getCustomerPortalUrl } from '@/utils/isExtranet'

// ── Password strength rules ────────────────────────────────────
const PW_RULES = [
  { key: 'length',  test: (v) => v.length >= 8,             label: 'Minimal 8 karakter' },
  { key: 'lower',   test: (v) => /[a-z]/.test(v),           label: 'Huruf kecil (a-z)' },
  { key: 'upper',   test: (v) => /[A-Z]/.test(v),           label: 'Huruf kapital (A-Z)' },
  { key: 'number',  test: (v) => /\d/.test(v),              label: 'Angka (0-9)' },
  { key: 'symbol',  test: (v) => /[^A-Za-z0-9]/.test(v),    label: 'Simbol khusus (!@#$%)' },
]

const STRENGTH_LEVELS = [
  { label: 'Sangat lemah', color: 'bg-red-500',    text: 'text-red-600',    width: '20%' },
  { label: 'Lemah',        color: 'bg-orange-500', text: 'text-orange-600', width: '40%' },
  { label: 'Cukup',        color: 'bg-amber-500',  text: 'text-amber-600',  width: '60%' },
  { label: 'Kuat',         color: 'bg-lime-500',   text: 'text-lime-600',   width: '80%' },
  { label: 'Sangat kuat',  color: 'bg-emerald-500',text: 'text-emerald-600',width: '100%' },
]

function getPasswordStrength(pw) {
  if (!pw) return null
  const passed = PW_RULES.filter(r => r.test(pw)).length
  const score = Math.max(0, Math.min(STRENGTH_LEVELS.length - 1, passed - 1))
  return { score, passed, total: PW_RULES.length, ...STRENGTH_LEVELS[score] }
}

export default function RegisterExtranet() {
  const navigate  = useNavigate()
  const setAuth   = useAuthStore(s => s.setAuth)
  const { toast } = useToast()
  const [showPass,    setShowPass]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agree,       setAgree]       = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password') || ''
  const pwStrength = getPasswordStrength(password)

  const mutation = useMutation({
    mutationFn: (d) => authApi.registerOwner(d),
    onSuccess: (r) => {
      const { user, token } = r.data.data
      setAuth(user, token, null)
      toast({
        title: `Selamat datang, ${user.name}!`,
        description: 'Akun owner berhasil dibuat. Mari daftarkan properti pertama Anda.',
      })
      navigate('/owner')
    },
    onError: (e) => toast({
      title: 'Registrasi gagal',
      description: e?.response?.data?.message || 'Terjadi kesalahan saat mendaftar.',
      variant: 'destructive',
    }),
  })

  const onSubmit = (d) => {
    if (!agree) {
      toast({
        title: 'Persetujuan diperlukan',
        description: 'Silakan setujui Syarat & Ketentuan untuk melanjutkan.',
        variant: 'destructive',
      })
      return
    }
    if (d.password !== d.password_confirmation) {
      toast({ title: 'Password tidak cocok', variant: 'destructive' })
      return
    }
    const payload = { name: d.name, email: d.email, phone: d.phone, password: d.password }
    mutation.mutate(payload)
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-7">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 mb-3">
          <Building2 className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Daftar Akun Owner</span>
        </div>
        <h2 className="font-display text-3xl font-bold text-slate-900">Extranet Owner Properti</h2>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
          Daftarkan akun untuk mengelola hotel, villa, atau properti Anda di platform ArahInn.
        </p>
      </div>

      {/* Benefits highlight */}
      <div className="mb-6 grid gap-2.5">
        {[
          { Icon: ShieldCheck, text: 'Akses penuh ke Extranet untuk kelola properti & harga' },
          { Icon: Sparkles,    text: 'Dapatkan booking dari ribuan tamu di seluruh Indonesia' },
          { Icon: CheckCircle2,text: 'Pendaftaran cepat, tanpa biaya komitmen di awal' },
        ].map(({ Icon, text }) => (
          <div key={text} className="flex items-start gap-2.5 text-xs text-slate-600">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <Icon className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="leading-relaxed pt-1">{text}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
        {/* Honeypot: fake fields untuk "menyerap" autofill browser agar field asli tidak ikut ke-isi */}
        <input type="text"     name="fake-username" autoComplete="username" tabIndex={-1} style={{ display: 'none' }} />
        <input type="password" name="fake-password" autoComplete="current-password" tabIndex={-1} style={{ display: 'none' }} />
        {/* Nama */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input {...register('name', {
              required: 'Nama wajib diisi',
              minLength: { value: 3, message: 'Minimal 3 karakter' },
            })} placeholder="Nama pemilik properti"
              autoComplete="off"
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors" />
          </div>
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input {...register('email', {
              required: 'Email wajib diisi',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Format email tidak valid' },
            })} type="email" placeholder="email@contoh.com"
              autoComplete="off"
              data-form-type="other"
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors" />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Nomor Telepon / WhatsApp
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input {...register('phone', {
              pattern: { value: /^[0-9+\s\-()]{8,20}$/, message: 'Nomor tidak valid' },
            })} type="tel" placeholder="08xxxxxxxxxx"
              autoComplete="off"
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors" />
          </div>
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input {...register('password', {
              required: 'Password wajib diisi',
              minLength: { value: 8, message: 'Minimal 8 karakter' },
              validate: {
                hasLetter: (v) => /[a-zA-Z]/.test(v) || 'Password harus mengandung huruf',
                hasNumber: (v) => /\d/.test(v)        || 'Password harus mengandung angka',
              },
            })} type={showPass ? 'text' : 'password'} placeholder="Minimal 8 karakter, huruf & angka"
              autoComplete="new-password"
              className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors" />
            <button type="button" onClick={() => setShowPass(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}

          {/* Password strength indicator */}
          {password && pwStrength && (
            <div className="mt-2.5 space-y-2">
              {/* Bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${pwStrength.color} transition-all duration-300`}
                    style={{ width: pwStrength.width }}
                  />
                </div>
                <span className={`text-xs font-bold whitespace-nowrap ${pwStrength.text}`}>
                  {pwStrength.label}
                </span>
              </div>

              {/* Checklist */}
              <div className="grid grid-cols-2 gap-1.5">
                {PW_RULES.map(rule => {
                  const ok = rule.test(password)
                  return (
                    <div key={rule.key} className="flex items-center gap-1.5">
                      {ok ? (
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" strokeWidth={3} />
                      ) : (
                        <X className="w-3 h-3 text-slate-300 shrink-0" strokeWidth={3} />
                      )}
                      <span className={`text-[11px] ${ok ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                        {rule.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Konfirmasi Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input {...register('password_confirmation', {
              required: 'Konfirmasi password wajib diisi',
              validate: (v) => v === password || 'Password tidak cocok',
            })} type={showConfirm ? 'text' : 'password'} placeholder="Ulangi password"
              autoComplete="new-password"
              className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors" />
            <button type="button" onClick={() => setShowConfirm(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation.message}</p>}
        </div>

        {/* Agree T&C */}
        <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
          <div className="relative shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="sr-only peer"
            />
            <div className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${
              agree ? 'bg-brand border-brand' : 'border-slate-300 bg-white'
            }`}>
              {agree && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Saya menyetujui{' '}
            <a href="https://arahinn.com/terms" target="_blank" rel="noreferrer" className="text-brand font-semibold hover:underline">
              Syarat & Ketentuan
            </a>{' '}
            dan{' '}
            <a href="https://arahinn.com/privacy" target="_blank" rel="noreferrer" className="text-brand font-semibold hover:underline">
              Kebijakan Privasi
            </a>{' '}
            ArahInn sebagai pemilik properti.
          </p>
        </label>

        {/* Submit */}
        <button type="submit" disabled={mutation.isPending}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-amber-200 flex items-center justify-center gap-2">
          {mutation.isPending
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <UserPlus className="w-4 h-4" />}
          {mutation.isPending ? 'Mendaftar...' : 'Daftar Sebagai Owner'}
        </button>
      </form>

      {/* Footer links */}
      <div className="mt-7 pt-5 border-t border-slate-100 space-y-3 text-center">
        <p className="text-sm text-slate-600">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-brand font-semibold hover:underline">
            Masuk di sini
          </Link>
        </p>
        <p className="text-xs text-slate-400">
          Bukan pemilik properti?{' '}
          <a href={getCustomerPortalUrl()} className="text-slate-500 hover:underline">
            Kembali ke Arahinn.com
          </a>
        </p>
      </div>
    </div>
  )
}
