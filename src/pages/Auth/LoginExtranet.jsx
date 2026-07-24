import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { authApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Mail, Lock, LogIn, UserPlus, ShieldCheck, Smartphone, Copy } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
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
  const [twoFA, setTwoFA] = useState(null) // { mode:'required'|'setup', challenge, otpauthUrl, secret }
  const [code, setCode] = useState('')
  const managementMode = isManagementPortal()
  const ownerMode = isOwnerPortal()

  // Selesaikan login (role check + set auth + navigate). Dipakai login normal & setelah 2FA.
  const finishLogin = ({ user, accessToken, refreshToken }) => {
    const rolesPayload = user.roles || user.role
    const isMgmt   = isManagementRole(rolesPayload)
    const isOwner  = isOwnerRole(rolesPayload)

    if (managementMode && !isMgmt) {
      if (isOwner) {
        toast({ title: 'Gunakan portal Owner', description: 'Akun owner properti harus login melalui my.arahinn.com.', variant: 'destructive' })
        setTimeout(() => { window.location.href = getOwnerPortalUrl('/owner') }, 1200); return
      }
      toast({ title: 'Akses ditolak', description: 'Akun ini bukan akun pengelola. Gunakan portal utama arahinn.com.', variant: 'destructive' })
      setTimeout(() => { window.location.href = getCustomerPortalUrl() }, 1200); return
    }
    if (ownerMode && !isOwner) {
      if (isMgmt) {
        toast({ title: 'Gunakan portal Kelola', description: 'Akun pengelola harus login melalui kelola.arahinn.com.', variant: 'destructive' })
        setTimeout(() => { window.location.href = getManagementPortalUrl('/admin') }, 1200); return
      }
      toast({ title: 'Akses ditolak', description: 'Akun ini bukan akun owner properti. Gunakan portal utama arahinn.com.', variant: 'destructive' })
      setTimeout(() => { window.location.href = getCustomerPortalUrl() }, 1200); return
    }
    const effectiveUser = { ...user, role: ownerMode ? 'owner' : (isMgmt ? (user.role || 'admin') : user.role) }
    setAuth(effectiveUser, accessToken, refreshToken)
    toast({ title: `Selamat datang, ${user.name}!` })
    navigate(ownerMode ? '/owner' : '/admin')
  }

  const { register, handleSubmit, formState: { errors }, setError } = useForm()

  const mutation = useMutation({
    // Penanda portal → backend pilih akun sesuai role (model akun terpisah, email bisa sama):
    // owner→my.arahinn.com, management→kelola.arahinn.com.
    mutationFn: (d) => authApi.login(
      ownerMode ? { ...d, portal: 'owner' }
      : managementMode ? { ...d, portal: 'management' }
      : d
    ),
    onSuccess: (r) => {
      const res = r.data
      // Superadmin → butuh langkah kode Google Authenticator (wajib / setup).
      if (res?.two_factor) {
        setCode('')
        setTwoFA({ mode: res.two_factor, challenge: res.challenge, otpauthUrl: res.otpauth_url, secret: res.secret })
        return
      }
      finishLogin(res.data)
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

  const verifyMutation = useMutation({
    mutationFn: (d) => authApi.twoFactorVerify(d),
    onSuccess: (r) => finishLogin(r.data.data),
    onError: (e) => {
      const msg = e?.response?.data?.message || 'Kode salah. Coba lagi.'
      if (e?.response?.data?.error === 'challenge_expired') { setTwoFA(null) }
      toast({ title: 'Verifikasi gagal', description: msg, variant: 'destructive' })
    },
  })

  const onSubmit = (d) => mutation.mutate(d)
  const submitCode = (e) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(code)) { toast({ title: 'Kode harus 6 digit', variant: 'destructive' }); return }
    verifyMutation.mutate({ challenge: twoFA.challenge, code })
  }

  // ── Langkah 2FA (Google Authenticator) untuk superadmin ──
  if (twoFA) {
    return (
      <div className="animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Verifikasi Keamanan</h2>
          <p className="text-slate-500 text-sm mt-1.5">
            {twoFA.mode === 'setup'
              ? 'Aktifkan Google Authenticator untuk akun superadmin Anda.'
              : 'Masukkan kode 6 digit dari Google Authenticator.'}
          </p>
        </div>

        {twoFA.mode === 'setup' && (
          <div className="mb-5 p-4 rounded-2xl border border-slate-200 bg-slate-50">
            <ol className="text-xs text-slate-600 space-y-1.5 mb-3 list-decimal list-inside leading-relaxed">
              <li>Buka aplikasi <b>Google Authenticator</b> (atau Authy) di HP.</li>
              <li>Scan QR di bawah, atau masukkan kode rahasia manual.</li>
              <li>Masukkan 6 digit yang muncul di aplikasi.</li>
            </ol>
            <div className="flex justify-center bg-white p-3 rounded-xl border border-slate-200">
              <QRCodeSVG value={twoFA.otpauthUrl} size={168} includeMargin />
            </div>
            {twoFA.secret && (
              <button type="button"
                onClick={() => { navigator.clipboard.writeText(twoFA.secret); toast({ title: 'Kode rahasia disalin.' }) }}
                className="mt-3 w-full flex items-center justify-center gap-2 text-xs font-mono tracking-wider text-slate-600 bg-white border border-dashed border-slate-300 rounded-lg py-2 hover:bg-slate-50">
                <Copy className="w-3.5 h-3.5" /> {twoFA.secret}
              </button>
            )}
          </div>
        )}

        <form onSubmit={submitCode} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Kode Authenticator</label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6}
                value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full pl-10 pr-4 py-3 border rounded-xl text-center text-lg font-mono tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand" />
            </div>
          </div>
          <button type="submit" disabled={verifyMutation.isPending}
            className="w-full py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-brand/30 shadow-md flex items-center justify-center gap-2">
            {verifyMutation.isPending
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <ShieldCheck className="w-4 h-4" />}
            {verifyMutation.isPending ? 'Memverifikasi...' : (twoFA.mode === 'setup' ? 'Aktifkan & Masuk' : 'Verifikasi & Masuk')}
          </button>
          <button type="button" onClick={() => { setTwoFA(null); setCode('') }}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-600">
            ← Kembali ke login
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {managementMode ? (
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold text-slate-900">Selamat Datang</h2>
          <p className="text-slate-500 text-sm mt-1.5">Masuk untuk mengelola dashboard ArahInn</p>
        </div>
      ) : (
        <>
          <h2 className="font-display text-3xl font-bold mb-2">Masuk Extranet</h2>
          <p className="text-muted-foreground mb-8">
            Portal khusus pengelola properti Arahinn.
          </p>
        </>
      )}

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

      {!managementMode && (
        <p className="mt-8 pt-6 border-t border-muted text-center text-xs text-muted-foreground">
          Bukan pengelola properti?{' '}
          <a href={getCustomerPortalUrl()} className="text-brand hover:underline font-medium">
            Kembali ke Arahinn.com
          </a>
        </p>
      )}
    </div>
  )
}
