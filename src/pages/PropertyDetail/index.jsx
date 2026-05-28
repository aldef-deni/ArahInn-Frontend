import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { propertyApi } from '@/services/propertyApi'
import { reviewApi } from '@/services/reviewApi'
import { formatRupiah, getImageUrl } from '@/utils'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
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
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import ReviewForm from '@/components/ReviewForm'
import MapEmbed from '@/components/ui/MapEmbed'
import SEO from '@/components/SEO'

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

  const resolvedId = data?.id

  const { data: reviewData } = useQuery({
    queryKey: ['property-reviews', resolvedId],
    queryFn: () => reviewApi.byProperty(resolvedId).then(r => r.data?.data),
    enabled: !!resolvedId,
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

  const seoTitle = data?.title
    ? `${data.title}${data.city ? ` di ${data.city}` : ''} — ${listingTypeLabel}`
    : 'Properti'
  const seoDescription = data?.description
    ? String(data.description).replace(/<[^>]+>/g, '').slice(0, 160)
    : `${listingTypeLabel}: ${data?.title || 'properti pilihan'} di ArahInn. Listing properti terkurasi dengan harga transparan.`
  const seoImage = images[0] ? getImageUrl(images[0]) : undefined

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eff6ff_48%,#ffffff_100%)]">
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={seoImage}
        url={`/properti/${id}`}
        type="article"
      />
      <div className="container py-4 sm:py-6 lg:py-8 pb-24 lg:pb-8">
        <button
          onClick={() => navigate('/properti')}
          className="group mb-4 sm:mb-6 inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-200 bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-600 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="hidden sm:inline">Kembali ke daftar properti</span>
          <span className="sm:hidden">Kembali</span>
        </button>

        <section className="overflow-hidden rounded-2xl sm:rounded-3xl lg:rounded-[34px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="relative min-h-[260px] sm:min-h-[340px] lg:min-h-[420px] bg-slate-950">
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
                    className="absolute left-3 sm:left-5 top-1/2 flex h-9 w-9 sm:h-11 sm:w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25 active:scale-90"
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImg}
                    className="absolute right-3 sm:right-5 top-1/2 flex h-9 w-9 sm:h-11 sm:w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25 active:scale-90"
                  >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </>
              ) : null}

              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
                <div className="mb-2 sm:mb-4 flex flex-wrap gap-1.5 sm:gap-2">
                  <span className={`rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold ${listingTypeColor}`}>
                    {listingTypeLabel}
                  </span>
                  {data.category ? (
                    <span className="rounded-full border border-white/20 bg-white/10 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-white backdrop-blur">
                      {data.category}
                    </span>
                  ) : null}
                  {data.certificate ? (
                    <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-white backdrop-blur">
                      <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      {CERT_LABELS[data.certificate] || data.certificate}
                    </span>
                  ) : null}
                </div>

                <h1 className="max-w-3xl text-xl sm:text-2xl md:text-3xl lg:text-[2.5rem] font-bold leading-tight text-white">
                  {data.title}
                </h1>

                <div className="mt-2 sm:mt-4 flex flex-wrap items-center gap-x-3 sm:gap-x-5 gap-y-1.5 sm:gap-y-3 text-xs sm:text-sm text-white/85">
                  <span className="inline-flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate">{[data.address, data.city, data.province].filter(Boolean).join(', ')}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    {(data.viewsCount || 0).toLocaleString('id-ID')}<span className="hidden sm:inline"> kali dilihat</span>
                  </span>
                </div>
              </div>
            </div>

            <aside className="border-t border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 sm:p-5 lg:border-l lg:border-t-0">
              <div className="rounded-2xl sm:rounded-[28px] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Harga listing</p>
                <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-black text-orange-600 break-all">{formatRupiah(data.price)}</p>
                {data.priceNegotiable ? (
                  <span className="mt-2 sm:mt-3 inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-emerald-50 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    Harga dapat dinegosiasikan
                  </span>
                ) : null}

                <div className="my-4 sm:my-5 h-px bg-slate-100" />

                <div className="space-y-2.5 sm:space-y-3">
                  {data.contactPhone ? (
                    <a
                      href={`tel:${data.contactPhone}`}
                      className="flex w-full items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-600 active:scale-[0.98]"
                    >
                      <Phone className="h-4 w-4 shrink-0" />
                      <span className="truncate">{data.contactPhone}</span>
                    </a>
                  ) : null}
                  {data.contactEmail ? (
                    <a
                      href={`mailto:${data.contactEmail}`}
                      className="flex w-full items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
                    >
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{data.contactEmail}</span>
                    </a>
                  ) : null}
                </div>

                {!data.contactPhone && !data.contactEmail ? (
                  <div className="mt-4 rounded-xl sm:rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-xs sm:text-sm text-slate-500">
                    Kontak penjual belum tersedia
                  </div>
                ) : null}
              </div>

              <div className="mt-3 sm:mt-4 rounded-2xl sm:rounded-[28px] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ringkasan properti</p>
                <div className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Tipe listing</span>
                    <span className="font-semibold text-slate-900">{listingTypeLabel}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Kategori</span>
                    <span className="font-semibold text-slate-900 truncate">{data.category || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Kota</span>
                    <span className="font-semibold text-slate-900 truncate">{data.city || '-'}</span>
                  </div>
                  {data.owner?.name ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Pemilik</span>
                      <span className="font-semibold text-slate-900 truncate">{data.owner.name}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </aside>
          </div>
        </section>

        <div className="mt-6 sm:mt-8 grid gap-5 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5 sm:space-y-7">
            <section className="rounded-2xl sm:rounded-3xl lg:rounded-[30px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm md:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tentang listing</p>
                  <h2 className="mt-1.5 sm:mt-2 text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-tight">Detail properti yang lebih jelas</h2>
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
              <section className="rounded-2xl sm:rounded-3xl lg:rounded-[30px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm md:p-7">
                <div className="mb-5">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Spesifikasi</p>
                  <h2 className="mt-1.5 sm:mt-2 text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-tight">Ukuran dan komposisi ruangan</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {specCards.map(item => (
                    <SpecCard key={item.label} icon={item.icon} label={item.label} value={item.value} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl sm:rounded-3xl lg:rounded-[30px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm md:p-7">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Lokasi</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Posisi properti di area sekitar</h2>
              </div>

              <div className="overflow-hidden rounded-[26px] border border-slate-200">
                <MapEmbed
                  query={[data.address, data.city, data.province, 'Indonesia'].filter(Boolean).join(', ')}
                  lat={data.latitude ? parseFloat(data.latitude) : undefined}
                  lng={data.longitude ? parseFloat(data.longitude) : undefined}
                  height={320}
                />
              </div>
            </section>

            {data.facilities?.length > 0 ? (
              <section className="rounded-2xl sm:rounded-3xl lg:rounded-[30px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm md:p-7">
                <div className="mb-5">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Fasilitas</p>
                  <h2 className="mt-1.5 sm:mt-2 text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-tight">Nilai tambah dari properti ini</h2>
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

            <section className="rounded-2xl sm:rounded-3xl lg:rounded-[30px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm md:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ulasan</p>
                  <h2 className="mt-1.5 sm:mt-2 text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-tight">Pendapat tentang properti ini</h2>
                </div>
                {reviewData?.average_rating ? (
                  <div className="rounded-2xl bg-blue-50 px-4 py-3 text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">Skor rata-rata</p>
                    <p className="mt-1 text-sm font-bold text-blue-700">
                      {Number(reviewData.average_rating).toFixed(1)} / 5
                    </p>
                  </div>
                ) : null}
              </div>

              {reviewData?.reviews?.length ? (
                <div className="mt-5 space-y-4">
                  {reviewData.reviews.map(review => (
                    <div key={review.id} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-700">
                          {review.user?.name?.[0]?.toUpperCase() || 'T'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900">{review.user?.name || 'Tamu'}</p>
                            <span className="text-xs text-slate-400">
                              {review.created_at
                                ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: idLocale })
                                : ''}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, index) => (
                              <Star
                                key={index}
                                className={`h-3.5 w-3.5 ${
                                  index < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="mt-3 text-sm leading-7 text-slate-600">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[26px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                  <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-600">Belum ada ulasan untuk properti ini.</p>
                  <p className="mt-1 text-sm text-slate-500">Jadilah yang pertama membagikan pendapat Anda.</p>
                </div>
              )}

              {resolvedId && (
                <div className="mt-6">
                  <ReviewForm
                    targetType="property"
                    targetId={resolvedId}
                    invalidateKey={['property-reviews', resolvedId]}
                  />
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-4 sm:space-y-5">
            {data.owner ? (
              <section className="rounded-2xl sm:rounded-[30px] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Pemilik listing</p>
                <div className="mt-3 sm:mt-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-blue-50 font-bold text-blue-700 shrink-0">
                    {data.owner.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{data.owner.name}</p>
                    <p className="truncate text-xs text-slate-500">{data.owner.email}</p>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl sm:rounded-[30px] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Legalitas</p>
              <div className="mt-3 sm:mt-4 rounded-xl sm:rounded-[24px] border border-slate-200 bg-slate-50 p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-white text-blue-600 shadow-sm shrink-0">
                    <Landmark className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Sertifikat</p>
                    <p className="mt-0.5 sm:mt-1 text-sm font-semibold text-slate-900 truncate">
                      {data.certificate ? (CERT_LABELS[data.certificate] || data.certificate) : 'Belum tersedia'}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* ── Mobile floating CTA bar (hidden on lg+) ────────────── */}
      {(data.contactPhone || data.contactEmail) && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
          <div className="container py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{listingTypeLabel}</p>
              <p className="text-base font-black text-orange-600 leading-tight truncate">
                {formatRupiah(data.price)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {data.contactPhone && (
                <a href={`tel:${data.contactPhone}`}
                  className="h-11 w-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 active:scale-95 transition-all shadow-md"
                  aria-label="Telepon">
                  <Phone className="h-4 w-4" />
                </a>
              )}
              {data.contactEmail && (
                <a href={`mailto:${data.contactEmail}`}
                  className="px-4 h-11 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-md flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  Email
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
