import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format, addDays, formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { hotelApi } from '@/services/hotelApi'
import { reviewApi } from '@/services/reviewApi'
import { campaignApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { formatRupiah, diffDays, formatDate, getImageUrl } from '@/utils'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Dumbbell,
  Image as ImageIcon,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  UtensilsCrossed,
  Waves,
  Wifi,
  X,
} from 'lucide-react'
import MapEmbed from '@/components/ui/MapEmbed'
import ReviewForm from '@/components/ReviewForm'

const facilityIcons = {
  wifi: Wifi,
  parking: Car,
  pool: Waves,
  gym: Dumbbell,
  spa: Sparkles,
  restaurant: UtensilsCrossed,
  bar: Coffee,
  breakfast: Coffee,
}

function GalleryLightbox({ open, images, startIdx = 0, onClose, hotelName }) {
  const [idx, setIdx] = useState(startIdx)
  const stripRef = useRef(null)

  useEffect(() => {
    if (open) setIdx(startIdx)
  }, [open, startIdx])

  useEffect(() => {
    if (!open) return

    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + images.length) % images.length)
      else if (e.key === 'ArrowRight') setIdx(i => (i + 1) % images.length)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, images.length, onClose])

  // Auto-scroll active thumbnail into view in strip
  useEffect(() => {
    if (!open || !stripRef.current) return
    const active = stripRef.current.children[idx]
    if (active) active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [idx, open])

  if (!open || !images?.length) return null

  const prev = () => setIdx(i => (i - 1 + images.length) % images.length)
  const next = () => setIdx(i => (i + 1) % images.length)

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 backdrop-blur-md">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 sm:px-8">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Galeri Foto</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-white sm:text-base">{hotelName}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
            {idx + 1} / {images.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main image */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-3 sm:px-6">
        <img
          src={getImageUrl(images[idx])}
          alt={`${hotelName} - foto ${idx + 1}`}
          className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/25 sm:left-6"
              aria-label="Foto sebelumnya"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/25 sm:right-6"
              aria-label="Foto berikutnya"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="border-t border-white/10 px-3 py-4 sm:px-6">
          <div
            ref={stripRef}
            className="mx-auto flex max-w-full gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'thin' }}
          >
            {images.map((img, i) => (
              <button
                key={`${img}-${i}`}
                type="button"
                onClick={() => setIdx(i)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all sm:h-20 sm:w-28 ${
                  i === idx
                    ? 'border-blue-400 ring-2 ring-blue-300/40'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={getImageUrl(img)}
                  alt={`thumb ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RoomCard({ room, nights, onBook }) {
  const [expanded, setExpanded] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)

  const roomImages = (room.images?.length ? room.images : [])
    .filter(img => img && (typeof img === 'string' ? true : img.path))

  const prevImg = () => setImgIdx(i => (i - 1 + roomImages.length) % roomImages.length)
  const nextImg = () => setImgIdx(i => (i + 1) % roomImages.length)

  return (
    <article
      className={`rounded-[26px] border p-5 transition-all ${
        room.available
          ? 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg'
          : 'border-slate-200 bg-slate-50 opacity-70'
      }`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">{room.name}</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
              {room.type}
            </span>
            {room.available ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Tersedia
              </span>
            ) : (
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                Tidak tersedia
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Maksimal {room.maxGuests} tamu
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {nights > 0 ? `${nights} malam dipilih` : '1 malam'}
            </span>
          </div>

          {room.facilities?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {room.facilities.slice(0, 6).map(facility => (
                <span
                  key={facility}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600"
                >
                  <Check className="h-3 w-3 text-emerald-500" />
                  {facility.replaceAll('_', ' ')}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="min-w-[220px] rounded-[24px] bg-slate-50 p-4 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Mulai dari</p>
          {room.discountedPrice && room.discountedPrice < room.basePrice ? (
            <>
              <p className="mt-1 text-sm text-slate-400 line-through">{formatRupiah(room.basePrice)}</p>
              <p className="text-2xl font-black text-orange-600 leading-tight">{formatRupiah(room.discountedPrice)}</p>
              {room.appliedPromo && (
                <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold">
                  <Sparkles className="h-2.5 w-2.5" />
                  {room.appliedPromo.discountType === 'percent'
                    ? `${Number(room.appliedPromo.discountValue)}% OFF`
                    : `Hemat ${formatRupiah(room.appliedPromo.discountValue)}`}
                </span>
              )}
            </>
          ) : (
            <p className="mt-1 text-2xl font-black text-orange-600">{formatRupiah(room.basePrice)}</p>
          )}
          <p className="text-xs text-slate-500">per malam</p>
          {nights > 1 ? (
            <p className="mt-2 text-xs text-slate-500">
              Estimasi {formatRupiah((room.discountedPrice ?? room.basePrice) * nights)} untuk {nights} malam
            </p>
          ) : null}

          <button
            onClick={() => setExpanded(v => !v)}
            disabled={!room.available}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-500 bg-white px-5 py-3 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
          >
            {room.available ? (
              <>
                {expanded ? 'Sembunyikan' : 'Lihat Kamar'}
                <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </>
            ) : (
              'Kamar penuh'
            )}
          </button>
        </div>
      </div>

      {/* Expandable detail panel */}
      <div
        className={`grid transition-all duration-500 ease-out ${
          expanded ? 'grid-rows-[1fr] opacity-100 mt-5' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-[24px] border border-slate-100 bg-gradient-to-br from-slate-50/80 to-blue-50/40 p-5">
            {/* Photos */}
            {roomImages.length > 0 && (
              <div className="relative mb-5 overflow-hidden rounded-2xl bg-slate-200 aspect-[16/9]">
                <img
                  src={getImageUrl(roomImages[imgIdx])}
                  alt={`${room.name} foto ${imgIdx + 1}`}
                  className="h-full w-full object-cover"
                />
                {roomImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImg}
                      className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 backdrop-blur transition-colors hover:bg-white shadow"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextImg}
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 backdrop-blur transition-colors hover:bg-white shadow"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-3 right-3 rounded-full bg-slate-950/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                      {imgIdx + 1} / {roomImages.length}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              {/* Description */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Deskripsi Kamar</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {room.description || 'Belum ada deskripsi untuk tipe kamar ini.'}
                </p>
              </div>

              {/* Full facilities */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Fasilitas Kamar</p>
                {room.facilities?.length ? (
                  <div className="mt-2 grid grid-cols-2 gap-y-1.5 gap-x-3">
                    {room.facilities.map(facility => (
                      <div key={facility} className="inline-flex items-center gap-2 text-sm text-slate-600">
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        <span className="capitalize truncate">{facility.replaceAll('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Belum ada fasilitas yang dicantumkan.</p>
                )}
              </div>
            </div>

            {/* Booking CTA */}
            <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Total mulai dari</p>
                <p className="text-lg font-black text-orange-600">
                  {formatRupiah((room.discountedPrice ?? room.basePrice) * Math.max(nights, 1))}
                </p>
                <p className="text-[11px] text-slate-500">
                  {formatRupiah(room.discountedPrice ?? room.basePrice)} × {Math.max(nights, 1)} malam
                </p>
              </div>
              <button
                onClick={() => onBook(room)}
                disabled={!room.available}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
              >
                Pesan Sekarang
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function GalleryThumb({ active, src, onClick, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative aspect-square overflow-hidden rounded-2xl border-2 transition-all ${
        active
          ? 'border-blue-500 ring-2 ring-blue-300/40 shadow-md'
          : 'border-slate-200 hover:border-blue-200'
      }`}
    >
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {count ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-sm font-bold text-white">
          +{count} foto
        </div>
      ) : null}
    </button>
  )
}

function FacilityBadge({ facility }) {
  const Icon = facilityIcons[facility] || ShieldCheck

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900 capitalize">{facility.replaceAll('_', ' ')}</p>
        <p className="text-xs text-slate-500">Tersedia untuk kenyamanan menginap</p>
      </div>
    </div>
  )
}

function ReviewCard({ review }) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
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
  )
}

function Stepper({ value, min = 1, max, onChange, label }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <span className="min-w-[3rem] text-center text-sm font-semibold text-slate-900">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
        <span className="ml-auto text-xs text-slate-400">maks. {max}</span>
      </div>
    </div>
  )
}

function BookingModal({
  open,
  room,
  hotelName,
  today,
  initialDates,
  initialGuests,
  initialRoomCount = 1,
  onClose,
  onSubmit,
}) {
  const [draft, setDraft] = useState({
    checkIn: initialDates.checkIn,
    checkOut: initialDates.checkOut,
    guests: initialGuests,
    roomCount: initialRoomCount,
  })

  useEffect(() => {
    if (!open) return
    setDraft({
      checkIn: initialDates.checkIn,
      checkOut: initialDates.checkOut,
      guests: initialGuests,
      roomCount: initialRoomCount,
    })
  }, [initialDates.checkIn, initialDates.checkOut, initialGuests, initialRoomCount, open, room?.id])

  if (!open || !room) return null

  const perRoomCapacity = Math.max(Number(room.maxGuests) || 1, 1)
  const maxRoomCount = Math.max(Number(room.totalUnits) || 10, 1)
  const maxGuests = perRoomCapacity * draft.roomCount
  const stayNights = diffDays(draft.checkIn, draft.checkOut)

  const handleCheckInChange = (value) => {
    const nextCheckOut = value >= draft.checkOut ? format(addDays(new Date(value), 1), 'yyyy-MM-dd') : draft.checkOut
    setDraft(current => ({ ...current, checkIn: value, checkOut: nextCheckOut }))
  }

  const handleRoomCountChange = (value) => {
    const newMax = perRoomCapacity * value
    setDraft(current => ({
      ...current,
      roomCount: value,
      guests: Math.min(current.guests, newMax),
    }))
  }

  const handleSubmit = () => {
    if (!draft.checkIn || !draft.checkOut || stayNights <= 0) return
    onSubmit(draft)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/30 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.28)]">
        <div className="border-b border-slate-200 px-6 py-5 md:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Pemesanan kamar</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">Lengkapi detail sebelum checkout</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {room.name} di {hotelName}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800"
            >
              Tutup
            </button>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-[minmax(0,1fr)_260px] md:px-7">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Check-in
                </label>
                <input
                  type="date"
                  value={draft.checkIn}
                  min={today}
                  onChange={e => handleCheckInChange(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Check-out
                </label>
                <input
                  type="date"
                  value={draft.checkOut}
                  min={draft.checkIn || today}
                  onChange={e => setDraft(current => ({ ...current, checkOut: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Stepper
                label="Jumlah kamar"
                value={draft.roomCount}
                min={1}
                max={maxRoomCount}
                onChange={handleRoomCountChange}
              />
              <Stepper
                label="Jumlah tamu"
                value={draft.guests}
                min={1}
                max={maxGuests}
                onChange={val => setDraft(current => ({ ...current, guests: val }))}
              />
            </div>

            <div className="rounded-[24px] border border-blue-100 bg-blue-50/70 px-4 py-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-blue-800">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {stayNights > 0 ? `${stayNights} malam` : 'Pilih tanggal yang valid'}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {draft.guests} tamu • {draft.roomCount} kamar
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Ringkasan pilihan</p>
            <h4 className="mt-2 text-lg font-bold text-slate-900">{room.name}</h4>
            <p className="mt-1 text-sm capitalize text-slate-500">{room.type}</p>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Harga / malam / kamar</span>
                <span className="font-semibold text-slate-900">{formatRupiah(room.basePrice)}</span>
              </div>
              {draft.roomCount > 1 && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">{draft.roomCount} kamar</span>
                  <span className="font-semibold text-slate-900">{formatRupiah(room.basePrice * draft.roomCount)}/malam</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Kapasitas</span>
                <span className="font-semibold text-slate-900">Maks. {perRoomCapacity} tamu/kamar</span>
              </div>
              {stayNights > 0 && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                  <span className="text-slate-500 text-xs">{formatRupiah(room.basePrice)} × {stayNights} mlm × {draft.roomCount} kmr</span>
                  <span className="font-bold text-orange-600">{formatRupiah(room.basePrice * stayNights * draft.roomCount)}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={stayNights <= 0}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              Lanjutkan pemesanan
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HotelDetail() {
  // Route bisa /hotel/:id (legacy) atau /:category/:slug (SEO-friendly)
  const { id, slug } = useParams()
  const hotelKey = id ?? slug
  const navigate = useNavigate()
  const { token } = useAuthStore()

  const today = format(new Date(), 'yyyy-MM-dd')
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  const [dates, setDates] = useState({ checkIn: today, checkOut: tomorrow })
  const [guests, setGuests] = useState(2)
  const [roomCount, setRoomCount] = useState(1)
  const [selImg, setSelImg] = useState(0)
  const [bookingRoom, setBookingRoom] = useState(null)
  const [sidebarRoomId, setSidebarRoomId] = useState(null)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIdx, setGalleryIdx] = useState(0)

  // Scroll ke atas setiap kali masuk halaman detail / ganti hotel
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [hotelKey])

  const { data: hotel, isLoading } = useQuery({
    queryKey: ['hotel', hotelKey],
    queryFn: () => hotelApi.getById(hotelKey).then(r => r.data.data),
  })

  const resolvedId = hotel?.id

  const { data: reviewData } = useQuery({
    queryKey: ['hotel-reviews', resolvedId],
    queryFn: () => reviewApi.byHotel(resolvedId).then(r => r.data?.data),
    enabled: !!resolvedId,
  })

  const { data: campaigns = [] } = useQuery({
    queryKey: ['hotel-campaigns', resolvedId],
    queryFn: () => campaignApi.forHotel(resolvedId).then(r => r.data?.data || []),
    enabled: !!resolvedId,
  })

  const { data: availData } = useQuery({
    queryKey: ['avail', resolvedId, dates],
    queryFn: () => hotelApi.checkAvail(resolvedId, dates).then(r => r.data.data),
    enabled: !!resolvedId && !!dates.checkIn && !!dates.checkOut,
  })

  const nights = diffDays(dates.checkIn, dates.checkOut)

  const handleBook = (room) => {
    if (!token) return navigate('/login')
    setBookingRoom(room)
  }

  const handleBookingSubmit = ({ checkIn, checkOut, guests: nextGuests, roomCount }) => {
    setDates({ checkIn, checkOut })
    setGuests(nextGuests)
    navigate(
      `/checkout/${bookingRoom.id}?hotelId=${resolvedId}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${nextGuests}&roomCount=${roomCount}`
    )
    setBookingRoom(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#eef5ff_48%,#ffffff_100%)]">
        <div className="container py-8">
          <div className="skeleton mb-6 h-6 w-44 rounded" />
          <div className="skeleton h-[420px] rounded-[32px]" />
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <div className="skeleton h-52 rounded-[28px]" />
              <div className="skeleton h-64 rounded-[28px]" />
              <div className="skeleton h-64 rounded-[28px]" />
            </div>
            <div className="skeleton h-[420px] rounded-[28px]" />
          </div>
        </div>
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#eef5ff_48%,#ffffff_100%)]">
        <div className="container flex min-h-[70vh] items-center justify-center py-20 text-center">
          <div className="max-w-md rounded-[30px] border border-slate-200 bg-white px-8 py-10 shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
              <MapPin className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Penginapan tidak ditemukan</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Data penginapan yang Anda cari tidak tersedia atau sudah tidak aktif.
            </p>
            <button
              onClick={() => navigate('/search')}
              className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Kembali ke hasil pencarian
            </button>
          </div>
        </div>
      </div>
    )
  }

  const images = hotel.images?.length ? hotel.images : ['']
  // Sidebar: tampilkan max 4 thumbnail (semua image yang dipilih sampai index 3)
  const visibleThumbs = images.slice(0, 4)
  const remainingCount = Math.max(0, images.length - 4)

  const openGallery = (startIdx = 0) => {
    setGalleryIdx(startIdx)
    setGalleryOpen(true)
  }
  const roomTypeCount = availData?.length || hotel.rooms?.length || 0
  const averageRating = reviewData?.average_rating ? Number(reviewData.average_rating).toFixed(1) : null

  // Daftar kamar (utamakan availability data; fallback ke list hotel.rooms)
  const sidebarRoomList = (availData?.length ? availData : hotel.rooms || [])
  const availableRooms = sidebarRoomList.filter(r => r.available !== false)

  // Kamar terpilih di sidebar (default: yang termurah & tersedia, pakai harga promo kalau ada)
  const effectivePrice = (r) => Number(r.discountedPrice ?? r.basePrice)
  const selectedSidebarRoom =
    availableRooms.find(r => String(r.id) === String(sidebarRoomId)) ||
    availableRooms.slice().sort((a, b) => effectivePrice(a) - effectivePrice(b))[0] ||
    null

  const sidebarOriginalPrice = selectedSidebarRoom?.basePrice ? Number(selectedSidebarRoom.basePrice) : null
  const sidebarUnitPrice = selectedSidebarRoom ? effectivePrice(selectedSidebarRoom) : null
  const sidebarTotalPrice = sidebarUnitPrice && nights > 0 ? sidebarUnitPrice * nights * roomCount : null
  const sidebarHasDiscount = selectedSidebarRoom?.discountedPrice && selectedSidebarRoom.discountedPrice < selectedSidebarRoom.basePrice

  const prevImg = () => setSelImg(i => (i - 1 + images.length) % images.length)
  const nextImg = () => setSelImg(i => (i + 1) % images.length)

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#eef5ff_48%,#ffffff_100%)]">
      <div className="container py-8">
        <button
          onClick={() => navigate(-1)}
          className="group mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Kembali ke hasil pencarian
        </button>

        <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="relative min-h-[420px] bg-slate-950">
              {images[selImg] ? (
                <img
                  src={getImageUrl(images[selImg])}
                  alt={hotel.name}
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
                {campaigns.length ? (
                  <div className="mb-5 flex flex-wrap gap-2">
                    {campaigns.slice(0, 2).map(campaign => (
                      <span
                        key={campaign.id}
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-xs font-semibold text-white backdrop-blur"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {campaign.title}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Akomodasi terverifikasi
                    </span>
                    {hotel.starRating ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                        {Array.from({ length: hotel.starRating }, (_, index) => (
                          <Star key={index} className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                        ))}
                      </span>
                    ) : null}
                  </div>

                  <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight text-white md:text-[2.6rem]">
                    {hotel.name}
                  </h1>

                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-white/85">
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      {[hotel.address, hotel.city].filter(Boolean).join(', ')}
                    </span>
                    {averageRating ? (
                      <span className="inline-flex items-center gap-2">
                        <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                        {averageRating} dari {reviewData?.total || 0} ulasan
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <aside className="border-t border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 lg:border-l lg:border-t-0">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Galeri</p>
                  <p className="mt-1 text-sm text-slate-500">Lihat suasana kamar dan area properti.</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {images.length} foto
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {visibleThumbs.map((image, index) => (
                  <GalleryThumb
                    key={`${image}-${index}`}
                    active={selImg === index}
                    src={image ? getImageUrl(image) : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='}
                    onClick={() => setSelImg(index)}
                  />
                ))}
              </div>

              {images.length > 0 && images[0] && (
                <button
                  type="button"
                  onClick={() => openGallery(selImg)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition-all hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm"
                >
                  <ImageIcon className="h-4 w-4" />
                  Lihat Semua Foto
                  {remainingCount > 0 && (
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      +{remainingCount}
                    </span>
                  )}
                </button>
              )}
            </aside>
          </div>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: 'Lokasi',
              value: hotel.city || 'Belum tersedia',
              sub: hotel.province || null,
              icon: MapPin,
              tint: 'from-blue-50 to-blue-100/50 text-blue-600',
            },
            {
              label: 'Rating Tamu',
              value: averageRating ? `${averageRating} / 5` : 'Jumlah Ulasan',
              sub: reviewData?.total > 0 ? `${reviewData.total} ulasan` : 'Jadilah yang pertama mengulas',
              icon: Star,
              tint: 'from-amber-50 to-amber-100/50 text-amber-600',
            },
            {
              label: 'Pilihan Kamar',
              value: `${roomTypeCount} ${roomTypeCount > 1 ? 'tipe kamar' : 'tipe kamar'}`,
              sub: 'Tersedia untuk dipesan',
              icon: Users,
              tint: 'from-emerald-50 to-emerald-100/50 text-emerald-600',
            },
          ].map(item => {
            const Icon = item.icon
            return (
              <div key={item.label} className="group rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.tint} transition-transform group-hover:scale-105`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                    <p className="mt-1 text-base font-bold text-slate-900 truncate">{item.value}</p>
                    {item.sub && (
                      <p className="mt-0.5 text-xs text-slate-500 truncate">{item.sub}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-7">
            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tentang properti</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Menginap lebih nyaman, lebih meyakinkan</h2>
                </div>
                {hotel.starRating ? (
                  <div className="rounded-2xl bg-amber-50 px-4 py-3 text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-500">Kategori</p>
                    <p className="mt-1 text-sm font-bold text-amber-700">{hotel.starRating} bintang</p>
                  </div>
                ) : null}
              </div>

              <p className="mt-5 text-sm leading-8 text-slate-600">
                {hotel.description || 'Properti ini belum memiliki deskripsi, tetapi tetap dapat dipesan sesuai ketersediaan kamar dan tanggal yang Anda pilih.'}
              </p>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Lokasi</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Dekat dengan destinasi utama</h2>
                </div>
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                  {[hotel.city, hotel.province].filter(Boolean).join(', ')}
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200">
                <MapEmbed
                  query={[hotel.address, hotel.city, hotel.province, 'Indonesia'].filter(Boolean).join(', ')}
                  lat={hotel.latitude ? parseFloat(hotel.latitude) : undefined}
                  lng={hotel.longitude ? parseFloat(hotel.longitude) : undefined}
                  height={320}
                />
              </div>
            </section>

            {hotel.facilities?.length > 0 ? (
              <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Fasilitas</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Fitur yang paling dicari tamu</h2>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {hotel.facilities.map(facility => (
                    <FacilityBadge key={facility} facility={facility} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Pilihan kamar</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Temukan tipe kamar yang cocok</h2>
                </div>
                <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                  {roomTypeCount} opsi tersedia
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {availData?.map(room => (
                  <RoomCard key={room.id} room={room} nights={nights} onBook={handleBook} />
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ulasan tamu</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Pendapat tamu setelah menginap</h2>
                </div>
                {averageRating ? (
                  <div className="rounded-2xl bg-blue-50 px-4 py-3 text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">Skor rata-rata</p>
                    <p className="mt-1 text-sm font-bold text-blue-700">{averageRating} / 5</p>
                  </div>
                ) : null}
              </div>

              {reviewData?.reviews?.length ? (
                <div className="mt-5 space-y-4">
                  {reviewData.reviews.map(review => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[26px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                  <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-600">Belum ada ulasan untuk penginapan ini.</p>
                  <p className="mt-1 text-sm text-slate-500">Jadilah tamu pertama yang membagikan pengalaman menginap.</p>
                </div>
              )}

              {resolvedId && (
                <div className="mt-6">
                  <ReviewForm
                    targetType="hotel"
                    targetId={resolvedId}
                    invalidateKey={['hotel-reviews', resolvedId]}
                  />
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <div className="sticky top-24 rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="rounded-[24px] bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#f8fafc_100%)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Cek ketersediaan</p>
                    <h3 className="mt-2 text-xl font-bold text-slate-900">Rencanakan tanggal menginap</h3>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Check-in
                    </label>
                    <input
                      type="date"
                      value={dates.checkIn}
                      min={today}
                      onChange={e => setDates({ ...dates, checkIn: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Check-out
                    </label>
                    <input
                      type="date"
                      value={dates.checkOut}
                      min={dates.checkIn}
                      onChange={e => setDates({ ...dates, checkOut: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Jumlah kamar
                    </label>
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => setRoomCount(c => Math.max(1, c - 1))}
                        disabled={roomCount <= 1}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        −
                      </button>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-900">{roomCount}</p>
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">kamar</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRoomCount(c => c + 1)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-600 transition-colors hover:bg-slate-200"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Jumlah tamu
                    </label>
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => setGuests(g => Math.max(1, g - 1))}
                        disabled={guests <= 1}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        −
                      </button>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-900">{guests}</p>
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">tamu</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGuests(g => g + 1)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-600 transition-colors hover:bg-slate-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {nights > 0 ? (
                  <div className="mt-4 rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm text-blue-700">
                    <p className="font-semibold">{nights} malam</p>
                    <p className="mt-1 text-blue-600">{formatDate(dates.checkIn)} - {formatDate(dates.checkOut)}</p>
                  </div>
                ) : null}

                {/* Daftar kamar tersedia */}
                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Ketersediaan kamar
                  </label>

                  {sidebarRoomList.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500">
                      Belum ada data kamar.
                    </div>
                  ) : availableRooms.length === 0 ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-center text-xs text-red-600">
                      Tidak ada kamar tersedia untuk tanggal ini.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {sidebarRoomList.map(r => {
                        const isAvailable = r.available !== false
                        const isPicked = String(selectedSidebarRoom?.id) === String(r.id)
                        return (
                          <button
                            key={r.id}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => setSidebarRoomId(r.id)}
                            className={`w-full rounded-2xl border px-3.5 py-2.5 text-left transition-all ${
                              !isAvailable
                                ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                                : isPicked
                                  ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-200'
                                  : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/30'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{r.name}</p>
                                <p className="mt-0.5 truncate text-[11px] text-slate-500 capitalize">
                                  {r.type} · maks. {r.maxGuests} tamu
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                {r.discountedPrice && r.discountedPrice < r.basePrice ? (
                                  <>
                                    <p className="text-[10px] text-slate-400 line-through leading-none">{formatRupiah(r.basePrice)}</p>
                                    <p className="text-xs font-bold text-orange-600 leading-tight">{formatRupiah(r.discountedPrice)}</p>
                                  </>
                                ) : (
                                  <p className="text-xs font-bold text-orange-600">{formatRupiah(r.basePrice)}</p>
                                )}
                                <p className="text-[10px] text-slate-400">/ malam</p>
                              </div>
                            </div>
                            {!isAvailable && (
                              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-red-500">
                                Tidak tersedia
                              </p>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {sidebarTotalPrice && selectedSidebarRoom ? (
                  <div className="mt-3 rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-500">Total estimasi</p>
                    {sidebarHasDiscount && (
                      <p className="mt-1 text-xs text-slate-400 line-through">
                        {formatRupiah(sidebarOriginalPrice * nights * roomCount)}
                      </p>
                    )}
                    <p className={`${sidebarHasDiscount ? 'mt-0.5' : 'mt-1'} text-2xl font-black text-orange-600`}>
                      {formatRupiah(sidebarTotalPrice)}
                    </p>
                    <p className="mt-1 text-xs text-orange-700/80">
                      {formatRupiah(sidebarUnitPrice)} × {nights} mlm × {roomCount} kmr
                    </p>
                    {sidebarHasDiscount && selectedSidebarRoom?.appliedPromo && (
                      <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-orange-200 text-orange-700 rounded-full text-[10px] font-bold">
                        <Sparkles className="h-2.5 w-2.5" />
                        Promo {selectedSidebarRoom.appliedPromo.name}
                      </span>
                    )}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    if (!token) return navigate('/login')
                    if (!selectedSidebarRoom) return
                    setBookingRoom(selectedSidebarRoom)
                  }}
                  disabled={!selectedSidebarRoom || nights <= 0}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                >
                  Pesan Sekarang
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl border border-slate-200 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Alamat</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{[hotel.address, hotel.city].filter(Boolean).join(', ')}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Info cepat</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Rating</span>
                      <span className="font-semibold text-slate-900">{averageRating ? `${averageRating} / 5` : 'Belum ada'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Tipe kamar</span>
                      <span className="font-semibold text-slate-900">{roomTypeCount}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Promo aktif</span>
                      <span className="font-semibold text-slate-900">{campaigns.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <BookingModal
        open={!!bookingRoom}
        room={bookingRoom}
        hotelName={hotel.name}
        today={today}
        initialDates={dates}
        initialGuests={guests}
        initialRoomCount={roomCount}
        onClose={() => setBookingRoom(null)}
        onSubmit={handleBookingSubmit}
      />

      <GalleryLightbox
        open={galleryOpen}
        images={images.filter(Boolean)}
        startIdx={galleryIdx}
        hotelName={hotel.name}
        onClose={() => setGalleryOpen(false)}
      />
    </div>
  )
}
