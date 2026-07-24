import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/services/index'
import { Mail, X, CheckCircle2, Send } from 'lucide-react'

/**
 * Modal lupa password — KHUSUS CUSTOMER.
 * Input email → cek terdaftar. Kalau ada → kirim email reset. Kalau tidak →
 * pesan "Email tersebut belum terdaftar di Kami" (dari backend).
 */
export default function ForgotPasswordModal({ open, onClose }) {
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const [sent, setSent] = useState(false)

  const mutation = useMutation({
    mutationFn: (d) => authApi.forgot(d),
    onSuccess: () => { setErr(''); setSent(true) },
    onError: (e) => {
      setErr(e?.response?.data?.message || 'Gagal mengirim. Coba lagi sebentar.')
    },
  })

  if (!open) return null

  const close = () => { setEmail(''); setErr(''); setSent(false); onClose?.() }

  const submit = (e) => {
    e.preventDefault()
    setErr('')
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr('Format email belum benar.'); return }
    mutation.mutate({ email })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={close}>
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display text-xl font-bold text-slate-900">Lupa Password</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {sent ? 'Cek email Anda untuk melanjutkan.' : 'Masukkan email terdaftar untuk reset password.'}
            </p>
          </div>
          <button onClick={close} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <p className="text-slate-700 font-semibold">Email reset password terkirim!</p>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              Kami sudah mengirim tautan reset ke <b className="text-slate-700">{email}</b>. Silakan cek kotak masuk (dan folder spam). Tautan berlaku 1 jam.
            </p>
            <button onClick={close}
              className="mt-5 w-full py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors">
              Mengerti
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email Terdaftar</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" value={email} autoFocus
                  onChange={(e) => { setEmail(e.target.value); setErr('') }}
                  placeholder="email@contoh.com"
                  className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand" />
              </div>
              {err && <p className="text-red-500 text-xs mt-1.5">{err}</p>}
            </div>
            <button type="submit" disabled={mutation.isPending}
              className="w-full py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {mutation.isPending
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Send className="w-4 h-4" />}
              {mutation.isPending ? 'Mengirim...' : 'Kirim Tautan Reset'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
