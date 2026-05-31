import { Link } from 'react-router-dom'
import {
  Plane, TrainFront, Bus, Ship, ShieldCheck, ChevronRight,
} from 'lucide-react'
import SEO from '@/components/SEO'

const PRODUCTS = [
  {
    id: 'pesawat',
    label: 'Tiket Pesawat',
    desc: 'Domestic & internasional, semua maskapai',
    Icon: Plane,
    gradient: 'from-sky-500 to-blue-600',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    id: 'kereta',
    label: 'Tiket Kereta Api',
    desc: 'KAI semua kelas dan rute',
    Icon: TrainFront,
    gradient: 'from-orange-500 to-red-600',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    id: 'dlu',
    label: 'Tiket Bus',
    desc: 'DAMRI, Lorena, AKAP & AKDP',
    Icon: Bus,
    gradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'pelni',
    label: 'Tiket Kapal Laut',
    desc: 'PT PELNI semua rute Indonesia',
    Icon: Ship,
    gradient: 'from-cyan-500 to-blue-600',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
]

export default function TravelLanding() {
  return (
    <div className="min-h-[60vh] bg-slate-50 sm:bg-transparent">
      <SEO
        title="Tiket Travel — Pesawat, Kereta, Bus, Kapal"
        description="Pesan tiket pesawat, kereta KAI, bus DAMRI, dan kapal PELNI dengan harga terbaik di ArahInn."
        url="/tiket"
      />

      {/* Hero (mobile feel) */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white sm:bg-none sm:bg-transparent sm:text-slate-900">
        <div className="container py-5 sm:py-8">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-display font-bold leading-tight">
              Pesan Tiket Travel
            </h1>
            <p className="text-xs sm:text-sm text-white/85 sm:text-slate-500 mt-1 leading-snug">
              Pesawat, kereta, bus, kapal — semua dalam satu tempat.
            </p>
          </div>
        </div>
      </section>

      {/* Grid produk */}
      <section className="container py-5 sm:py-6 -mt-2 sm:mt-0 relative">
        <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
          Pilih Jenis Tiket
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
          {PRODUCTS.map(p => {
            const Icon = p.Icon
            return (
              <Link
                key={p.id}
                to={`/tiket/${p.id}`}
                className="group relative bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-brand hover:shadow-md active:scale-[0.97] transition-all overflow-hidden min-h-[130px] sm:min-h-[150px] flex flex-col"
              >
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${p.gradient} opacity-10 rounded-bl-full`} />

                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${p.iconBg} flex items-center justify-center mb-3 relative`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${p.iconColor}`} strokeWidth={2.25} />
                </div>
                <p className="font-bold text-slate-900 text-sm sm:text-base leading-tight relative">{p.label}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 line-clamp-2 leading-snug relative">
                  {p.desc}
                </p>
                <ChevronRight className="w-4 h-4 text-slate-300 absolute bottom-3 right-3 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
              </Link>
            )
          })}
        </div>

        {/* Trust block */}
        <div className="mt-5 sm:mt-7 bg-blue-50 border border-blue-200 rounded-2xl p-3.5 sm:p-5 flex items-start gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900 text-xs sm:text-sm">Aman &amp; Resmi</p>
            <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
              Tiket diissuance langsung oleh maskapai/operator resmi. E-ticket otomatis terkirim
              setelah pembayaran terverifikasi.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
