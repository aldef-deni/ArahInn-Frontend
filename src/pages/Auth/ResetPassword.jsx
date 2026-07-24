import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react'
import SEO from '@/components/SEO'

// Halaman reset password (dibuka dari tautan email). KHUSUS CUSTOMER.
export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()
  const { toast } = useToast()
  const [show, setShow] = useState(false)
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')

  const mutation = useMutation({
    mutationFn: (d) => authApi.reset(d),
    onSuccess: () => {
      toast({ title: 'Password berhasil direset. Silakan login dengan password baru.' })
      navigate('/login', { replace: true })
    },
    onError: (e) => setErr(e?.response?.data?.message || 'Token tidak valid atau sudah kedaluwarsa.'),
  })

  const submit = (e) => {
    e.preventDefault()
    setErr('')
    if (pw.length < 8) { setErr('Password minimal 8 karakter.'); return }
    if (pw !== confirm) { setErr('Konfirmasi password tidak sama.'); return }
    mutation.mutate({ token, password: pw })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-slate-50">
      <SEO title="Reset Password" description="Buat password baru untuk akun ArahInn Anda." url="/reset-password" noindex />
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Buat Password Baru</h1>
          <p className="text-slate-500 text-sm mt-1.5">Masukkan password baru untuk akun Anda.</p>
        </div>

        {!token ? (
          <div className="text-center">
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              Tautan reset tidak valid. Silakan minta ulang dari halaman login.
            </p>
            <Link to="/login" className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-brand hover:underline">
              <ArrowLeft className="w-4 h-4" /> Kembali ke Login
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Password Baru</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={show ? 'text' : 'password'} value={pw}
                  onChange={(e) => { setPw(e.target.value); setErr('') }}
                  placeholder="Minimal 8 karakter"
                  className="w-full pl-10 pr-10 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand" />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Konfirmasi Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={show ? 'text' : 'password'} value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setErr('') }}
                  placeholder="Ulangi password baru"
                  className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand" />
              </div>
            </div>
            {err && <p className="text-red-500 text-xs">{err}</p>}
            <button type="submit" disabled={mutation.isPending}
              className="w-full py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {mutation.isPending
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <ShieldCheck className="w-4 h-4" />}
              {mutation.isPending ? 'Menyimpan...' : 'Reset Password'}
            </button>
            <Link to="/login" className="block text-center text-xs text-slate-400 hover:text-slate-600">
              ← Kembali ke Login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
