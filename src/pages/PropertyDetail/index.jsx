import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { propertyApi } from '@/services/propertyApi'
import { formatRupiah, getImageUrl } from '@/utils'
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Landmark,
  Mail,
  MapPin,
  Maximize2,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

const CERT_LABELS = { SHM: 'SHM', HGB: 'HGB', Strata: 'Strata Title', Lainnya: 'Lainnya' }

function SpecCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default function PropertyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [imgIdx, setImgIdx] = useState(0)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['property-detail', id],
    queryFn: () => propertyApi.getById(id).then(r => r.data?.data),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eff6ff_48%,#ffffff_100%)]">
        <div className="container py-8">
          <div className="skeleton mb-6 h-6 w-56 rounded" />
          <div className="skeleton h-[420px] rounded-[32px]" />
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <div className="skeleton h-56 rounded-[28px]" />
              <div className="skeleton h-52 rounded-[28px]" />
              <div className="skeleton h-64 rounded-[28px]" />
            </div>
            <div className="skeleton h-[360px] rounded-[28px]" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eff6ff_48%,#ffffff_100%)]">
        <div className="container flex min-h-[70vh] items-center justify-center py-20">
          <div className="max-w-md rounded-[30px] border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
              <Building2 className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Properti tidak ditemukan</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Listing properti ini mungkin sudah dihapus atau tidak lagi tersedia.
            </p>
            <button
              onClick={() => navigate('/properti')}
              className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Kembali ke daftar properti
            </button>
          </div>
        </div>
      </div>
    )
  }

  const images = data.images || []
  const prevImg = () => setImgIdx(i => (i - 1 + images.length) % images.length)
  const nextImg = () => setImgIdx(i => (i + 1) % images.length)

  const listingTypeLabel = data.listingType === 'rent' ? 'Disewa' : 'Dijual'
  const listingTypeColor = data.listingType === 'rent'
    ? 'bg-blue-600 text-white'
    : 'bg-orange-500 text-white'

  const specCards = [
    data.landArea ? { icon: Maximize2, label: 'Luas tanah', value: `${data.landArea} m2` } : null,
    data.buildingArea ? { icon: Building2, label: 'Luas bangunan', value: `${data.buildingArea} m2` } : null,
    data.bedrooms != null ? { icon: BedDouble, label: 'Kamar tidur', value: `${data.bedrooms}` } : null,
    data.bathrooms != null ? { icon: Bath, label: 'Kamar mandi', value: `${data.bathrooms}` } : null,
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eff6ff_48%,#ffffff_100%)]">
      <div className="container py-8">
        <button
          onClick={() => navigate('/properti')}
          className="group mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Kembali ke daftar properti
        </button>

        <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="relative min-h-[420px] bg-slate-950">
              {images.length > 0 ? (
                <img
                  src={getImageUrl(images[imgIdx])}
                  alt={data.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#60a5fa,transparent_38%),linear-gradient(135deg,#dbeafe_0%,#eff6ff_55%,#ffffff_100%)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={prevImg}
                    className="absolute left-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImg}
                    className="absolute right-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              ) : null}

              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${listingTypeColor}`}>
                    {listingTypeLabel}
                  </span>
                  {data.category ? (
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      {data.category}
                    </span>
                  ) : null}
                  {data.certificate ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {CERT_LABELS[data.certificate] || data.certificate}
                    </span>
                  ) : null}
                </div>

                <h1 className="max-w-3xl text-3xl font-bold leading-tight text-white md:text-[2.5rem]">
                  {data.title}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-white/85">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {[data.address, data.city, data.province].filter(Boolean).join(', ')}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Eye className="h-4 w-4 shrink-0" />
                    {(data.viewsCount || 0).toLocaleString('id-ID')} kali dilihat
                  </span>
                </div>
              </div>
            </div>

            <aside className="border-t border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 lg:border-l lg:border-t-0">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Harga listing</p>
                <p className="mt-3 text-3xl font-black text-orange-600">{formatRupiah(data.price)}</p>
                {data.priceNegotiable ? (
                  <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Harga dapat dinegosiasikan
                  </span>
                ) : null}

                <div className="my-5 h-px bg-slate-100" />

                <div className="space-y-3">
                  {data.contactPhone ? (
                    <a
                      href={`tel:${data.contactPhone}`}
                      className="flex w-full items-center gap-3 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                    >
                      <Phone className="h-4 w-4" />
                      {data.contactPhone}
                    </a>
                  ) : null}
                  {data.contactEmail ? (
                    <a
                      href={`mailto:${data.contactEmail}`}
                      className="flex w-full items-center gap-3 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      <Mail className="h-4 w-4" />
                      {data.contactEmail}
                    </a>
                  ) : null}
                </div>

                {!data.contactPhone && !data.contactEmail ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
                    Kontak penjual belum tersedia
                  </div>
                ) : null}
              </div>

              <div className="mt-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ringkasan properti</p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Tipe listing</span>
                    <span className="font-semibold text-slate-900">{listingTypeLabel}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Kategori</span>
                    <span className="font-semibold text-slate-900">{data.category || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Kota</span>
                    <span className="font-semibold text-slate-900">{data.city || '-'}</span>
                  </div>
                  {data.owner?.name ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Pemilik</span>
                      <span className="font-semibold text-slate-900">{data.owner.name}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </aside>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-7">
            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tentang listing</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Detail properti yang lebih jelas</h2>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Listing premium
                </span>
              </div>

              <p className="mt-5 text-sm leading-8 text-slate-600">
                {data.description || 'Belum ada deskripsi yang tersedia untuk properti ini.'}
              </p>
            </section>

            {specCards.length ? (
              <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Spesifikasi</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Ukuran dan komposisi ruangan</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {specCards.map(item => (
                    <SpecCard key={item.label} icon={item.icon} label={item.label} value={item.value} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Lokasi</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Posisi properti di area sekitar</h2>
              </div>

              <div className="overflow-hidden rounded-[26px] border border-slate-200">
                <iframe
                  title="Lokasi properti"
                  src={`https://www.google.com/maps?q=${encodeURIComponent([data.address, data.city, data.province].filter(Boolean).join(', '))}&output=embed`}
                  className="h-[320px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </section>

            {data.facilities?.length > 0 ? (
              <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Fasilitas</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Nilai tambah dari properti ini</h2>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {data.facilities.map(facility => (
                    <div
                      key={facility}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <CheckCircle2 className="h-4.5 w-4.5" />
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{facility}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-5">
            {data.owner ? (
              <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Pemilik listing</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 font-bold text-blue-700">
                    {data.owner.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{data.owner.name}</p>
                    <p className="truncate text-xs text-slate-500">{data.owner.email}</p>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Legalitas</p>
              <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                    <Landmark className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Sertifikat</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {data.certificate ? (CERT_LABELS[data.certificate] || data.certificate) : 'Belum tersedia'}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
