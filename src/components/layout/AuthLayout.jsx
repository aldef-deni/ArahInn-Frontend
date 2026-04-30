import { Outlet, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'

export default function AuthLayout() {
  const { i18n } = useTranslation()

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Form */}
      <div className="flex flex-col justify-center px-6 py-12 lg:px-16 bg-white">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2 mb-10 group">
            <img src="/logo.png" alt="Arahinn" className="h-10 w-auto" />
            <span className="font-display font-bold text-2xl text-brand-800">
              ARAHINN
            </span>
          </Link>
          <Outlet />

          {/* Back to Home */}
          <div className="mt-8 pt-6 border-t border-muted">
            <Link to="/"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-brand-700 transition-colors group">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              {i18n.language === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
            </Link>
          </div>
        </div>
      </div>

      {/* Right: Visual */}
      <div className="hidden lg:block relative overflow-hidden hero-gradient">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
        />
        <div className="relative h-full flex flex-col justify-center items-center text-white px-12 text-center">
          <div className="w-24 h-24 rounded-3xl bg-white/20 flex items-center justify-center mb-8 shadow-2xl">
            <img src="/logo.png" alt="Arahinn" className="w-20 h-20 object-contain" />
          </div>
          <h2 className="font-display text-4xl font-bold mb-4 leading-tight">
            Temukan Penginapan<br />Impian Anda
          </h2>
          <p className="text-blue-200 text-lg max-w-sm leading-relaxed">
            Ribuan pilihan hotel, resort, dan villa di seluruh Indonesia — harga terbaik, layanan 24 jam.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 w-full max-w-xs">
            {[['500+','Hotel'], ['50+','Kota'], ['24/7','Support']].map(([n, l]) => (
              <div key={l} className="text-center">
                <p className="font-display text-3xl font-bold">{n}</p>
                <p className="text-blue-200 text-sm mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
