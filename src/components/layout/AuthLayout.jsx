import { Outlet, Link } from 'react-router-dom'
import { Hotel } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Form */}
      <div className="flex flex-col justify-center px-6 py-12 lg:px-16 bg-white">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2 mb-10 group">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shadow-brand/30 shadow-md">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-brand-800">
              ARAHINN
            </span>
          </Link>
          <Outlet />
        </div>
      </div>

      {/* Right: Visual */}
      <div className="hidden lg:block relative overflow-hidden hero-gradient">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
        />
        <div className="relative h-full flex flex-col justify-center items-center text-white px-12 text-center">
          <div className="w-24 h-24 rounded-3xl bg-white/20 flex items-center justify-center mb-8 shadow-2xl">
            <Hotel className="w-14 h-14" />
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
