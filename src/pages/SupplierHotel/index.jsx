import { useState, useMemo } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Star, MapPin, Utensils, ShieldCheck, Ban, Info, Loader2, ChevronRight,
  AlertTriangle, CheckCircle2, XCircle, Users,
} from 'lucide-react'
import { supplierHotelApi } from '@/services/index'
import { formatRupiah } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import PriceChangeDialog from '@/components/hotel/PriceChangeDialog'
import NoHotelImage from '@/components/hotel/NoHotelImage'
import ResidencySelect from '@/components/hotel/ResidencySelect'
import { useResidencyStore } from '@/store/residencyStore'
import SupplierBookingStatus from '@/components/hotel/SupplierBookingStatus'
import GuestDetailsForm from '@/components/hotel/GuestDetailsForm'
import { decodeOccupancy, occupancyKeApi } from '@/utils/occupancy'

/**
 * Halaman hotel mitra (RateHawk) — branding tetap ArahInn.
 *
 * Alur yang dijalankan halaman ini:
 *   Hotelpage → pilih kamar → Prebook → (konfirmasi harga bila berubah)
 *   → isi data tamu → Create Booking → Start Booking → polling status.
 *
 * Semua permintaan lewat backend ArahInn; browser tidak pernah menyentuh
 * RateHawk secara langsung.
 */
export default function SupplierHotel() {
  const { t }         = useTranslation()
  const { hid }       = useParams()
  const [params]      = useSearchParams()
  const navigate      = useNavigate()
  const { toast }     = useToast()
  const token         = useAuthStore(s => s.token)

  // Dibaca dari store yang sama dengan halaman pencarian. Kalau berbeda, tarif
  // yang dipilih customer di daftar hasil bisa lenyap saat prebook karena
  // supplier menganggapnya konteks pencarian lain.
  const residency = useResidencyStore((st) => st.residency)

  // Komposisi tamu per kamar, dibaca dari URL yang dibawa kartu hasil
  // pencarian. Bentuknya HARUS sama persis dengan yang dipakai saat mencari —
  // kalau berbeda, ETG menganggapnya konteks lain dan tarif yang dipilih tamu
  // lenyap saat prebook.
  const occupancy = useMemo(() => decodeOccupancy(params.get('occ')), [params])

  const criteria = useMemo(() => ({
    check_in : params.get('checkIn')  || '',
    check_out: params.get('checkOut') || '',
    rooms    : occupancy.length,
    adults   : occupancy[0]?.adults ?? 2,
    // Dikirim sebagai `guests` — itu nama yang divalidasi backend dan yang
    // diteruskan ke ETG apa adanya.
    guests   : occupancyKeApi(occupancy),
    residency,
  }), [params, residency, occupancy])

  const [selectedRate, setSelectedRate] = useState(null)
  const [priceChange, setPriceChange]   = useState(null)   // { previousAmount, newAmount, ... }
  const [prebookToken, setPrebookToken] = useState(null)
  const [confirmedRate, setConfirmedRate] = useState(null)
  const [partnerOrderId, setPartnerOrderId] = useState(null)
  const [heroError, setHeroError] = useState(false)

  const { data: hotel, isLoading, error } = useQuery({
    queryKey: ['supplier-hotel', hid, criteria],
    queryFn : () => supplierHotelApi.detail(hid, criteria).then(r => r.data?.data),
    enabled : !!hid && !!criteria.check_in && !!criteria.check_out,
    retry   : false,
    // Rate hotelpage TIDAK boleh disimpan lama — ETG melarang caching agresif.
    staleTime: 0,
    gcTime   : 0,
  })

  /* ── Prebook ──────────────────────────────────────────────────── */
  const prebook = useMutation({
    mutationFn: (rate) => supplierHotelApi.prebook({
      bookHash      : rate.bookHash,
      expectedAmount: rate.sellingAmount,
      // Tanggal menginap ikut dikirim dan disimpan bersama pesanan. Respons
      // prebook ETG tidak memuatnya, dan tanpa ini pesanan mitra muncul di
      // Riwayat Pesanan tanpa tanggal — tidak berarti apa-apa bagi tamu.
      checkIn       : criteria.check_in,
      checkOut      : criteria.check_out,
    }).then(r => r.data?.data),

    onSuccess: (data, rate) => {
      setPrebookToken(data.prebookToken)

      if (data.status === 'PRICE_CHANGED') {
        // Jangan pernah lanjut diam-diam — tampilkan selisihnya dan minta persetujuan.
        setPriceChange({ ...data.priceChange, rate: data.rate })
        return
      }

      setConfirmedRate(data.rate ?? rate)
    },

    onError: (err) => toast({
      title      : t('supplier.toastRoomUnavailableTitle'),
      description: err?.response?.data?.message ?? t('supplier.toastRoomUnavailableBody'),
      variant    : 'destructive',
    }),
  })

  const acceptNewPrice = () => {
    setConfirmedRate(priceChange.rate)
    setPriceChange(null)
  }

  const rejectNewPrice = () => {
    setPriceChange(null)
    setPrebookToken(null)
    setSelectedRate(null)
  }

  /* ── Booking ──────────────────────────────────────────────────── */
  const createBooking = useMutation({
    mutationFn: (guestPayload) => supplierHotelApi
      .createBooking({ prebookToken })
      .then(r => r.data?.data)
      .then(async (created) => {
        await supplierHotelApi.startBooking(created.partnerOrderId, guestPayload)
        return created
      }),

    onSuccess: (created) => setPartnerOrderId(created.partnerOrderId),

    onError: (err) => toast({
      title      : t('supplier.toastBookingFailedTitle'),
      description: err?.response?.data?.message ?? t('supplier.toastBookingFailedBody'),
      variant    : 'destructive',
    }),
  })

  const handleSelectRate = (rate) => {
    if (!token) {
      toast({ title: t('supplier.toastLoginTitle'), description: t('supplier.toastLoginBody') })
      navigate('/login')
      return
    }
    setSelectedRate(rate)
    prebook.mutate(rate)
  }

  /* ── Render ───────────────────────────────────────────────────── */

  if (!criteria.check_in || !criteria.check_out) {
    return <Notice icon={Info} title={t('supplier.pickDatesTitle')}
      body={t('supplier.pickDatesBody')} />
  }

  if (isLoading) return <SkeletonPage />

  if (error || !hotel) {
    return <Notice icon={XCircle} title={t('supplier.unavailableTitle')}
      body={error?.response?.data?.message ?? t('supplier.unavailableBody')} />
  }

  // Booking sudah berjalan → tampilkan layar status.
  if (partnerOrderId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <SupplierBookingStatus
          partnerOrderId={partnerOrderId}
          hotelName={hotel.name}
          // SENGAJA tidak mengalihkan ke /orders saat CONFIRMED.
          //
          // Pemesanan hotel mitra tidak membuat baris `bookings` ArahInn —
          // hanya `provider_bookings` — sehingga TIDAK pernah muncul di
          // Riwayat Pesanan. Pengalihan lama membuang tamu ke halaman yang
          // tidak memuat pemesanannya, dan dari sisi mereka terlihat seperti
          // pemesanan yang gagal atau hilang padahal sudah terkonfirmasi.
          // Layar status ini juga satu-satunya tempat pembatalan tersedia.
          onDone={() => {}}
        />
      </div>
    )
  }

  const foto      = hotel.images ?? []
  const utama     = foto[0]
  const sampingan = foto.slice(1, 3)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      {/* Galeri + identitas.
          Hotel mitra sering dikirim tanpa foto, atau hanya satu. Kalau tidak
          ada foto pendamping, galeri melebar penuh — grid tiga kolom dengan
          kolom kanan kosong membuat halaman terlihat gagal memuat. */}
      <div className={`grid grid-cols-1 gap-4 ${sampingan.length ? 'lg:grid-cols-3' : ''}`}>
        <div className={`rounded-2xl overflow-hidden bg-muted aspect-[16/10] ${sampingan.length ? 'lg:col-span-2' : ''}`}>
          {utama && !heroError
            ? <img src={utama} alt={hotel.name} onError={() => setHeroError(true)}
                   className="w-full h-full object-cover" />
            : <NoHotelImage />}
        </div>
        {sampingan.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            {sampingan.map((src, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-muted aspect-[16/10]">
                <img src={src} alt="" className="w-full h-full object-cover"
                     onError={(e) => { e.currentTarget.parentElement.style.display = 'none' }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{hotel.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="w-4 h-4 shrink-0" />
            {hotel.address || hotel.city}
          </p>
        </div>
        {hotel.starRating > 0 && (
          <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {hotel.starRating}
          </span>
        )}
      </div>

      {hotel.description && (
        <p className="mt-4 text-sm text-slate-600 leading-relaxed whitespace-pre-line line-clamp-6">
          {hotel.description}
        </p>
      )}

      {/* Informasi penting properti — dari metapolicy supplier */}
      <ImportantInfo info={hotel.importantInfo} checkInOut={hotel.checkInOut} />

      {/* Daftar kamar & rate */}
      {/* Pemilih kewarganegaraan diletakkan tepat di atas daftar kamar karena
          di sinilah pengaruhnya terlihat: mengganti negara mengubah tarif yang
          boleh ditampilkan, bukan sekadar menyaring hasil. */}
      <div className="mt-8 mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 className="text-lg font-extrabold text-slate-900">{t('supplier.roomChoices')}</h2>
        <ResidencySelect />
      </div>

      {confirmedRate ? (
        <GuestDetailsForm
          rate={confirmedRate}
          rooms={criteria.rooms}
          adults={criteria.adults}
          occupancy={occupancy}
          submitting={createBooking.isPending}
          onCancel={() => { setConfirmedRate(null); setPrebookToken(null); setSelectedRate(null) }}
          onSubmit={(payload) => createBooking.mutate(payload)}
        />
      ) : (
        <div className="space-y-3">
          {hotel.rates?.length ? hotel.rates.map((rate) => (
            <RateRow
              key={rate.bookHash}
              rate={rate}
              busy={prebook.isPending && selectedRate?.bookHash === rate.bookHash}
              disabled={prebook.isPending}
              onSelect={() => handleSelectRate(rate)}
            />
          )) : (
            <Notice icon={Info} title={t('supplier.noRoomsTitle')}
              body={t('supplier.noRoomsBody')} />
          )}
        </div>
      )}

      {/* Konfirmasi perubahan harga — pemesanan hanya lanjut bila customer setuju */}
      {priceChange && (
        <PriceChangeDialog
          change={priceChange}
          onAccept={acceptNewPrice}
          onReject={rejectNewPrice}
        />
      )}
    </div>
  )
}

/* ── Sub-komponen ──────────────────────────────────────────────── */

function RateRow({ rate, busy, disabled, onSelect }) {
  // Sub-komponen yang memakai t() WAJIB memanggil useTranslation sendiri;
  // mengandalkan `t` dari komponen induk hanya jalan di dev dan memunculkan
  // layar putih di produksi.
  const { t } = useTranslation()
  const cancel = rate.cancellation ?? {}
  const taxesAtHotel = rate.taxesAtHotel ?? []

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-brand/40 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800">{rate.roomName}</h3>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone={rate.meal?.hasBreakfast ? 'green' : 'slate'} icon={Utensils}>
              {rate.meal?.label ?? t('supplier.noMeal')}
            </Badge>

            {cancel.refundable ? (
              <Badge tone="green" icon={ShieldCheck}>
                {t('supplier.freeCancelUntil', { deadline: formatDeadline(cancel.freeCancellationBefore) })}
              </Badge>
            ) : (
              <Badge tone="slate" icon={Ban}>{t('supplier.nonRefundable')}</Badge>
            )}

            {rate.roomsAvailable > 0 && rate.roomsAvailable <= 3 && (
              <Badge tone="amber" icon={Users}>{t('supplier.roomsLeft', { count: rate.roomsAvailable })}</Badge>
            )}
          </div>

          {/* Pajak yang dibayar di properti — TIDAK ditambahkan ke harga di atas.
              Ditampilkan dalam mata uang ASLI properti; nilai Rupiah hanya
              perkiraan, karena pembayarannya dilakukan di tempat. */}
          {taxesAtHotel.length > 0 && (
            <p className="mt-2 text-[11px] text-slate-500">
              {t('supplier.plusTaxes', { list: taxesAtHotel.map(pajak => formatTax(pajak)).join(', ') })}
            </p>
          )}
        </div>

        <div className="sm:text-right shrink-0">
          <p className="text-xl font-extrabold text-brand leading-none">
            {formatRupiah(rate.sellingAmount)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {t('supplier.taxIncluded')}
          </p>
          <button
            type="button" onClick={onSelect} disabled={disabled}
            className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand text-white font-bold text-sm hover:brightness-110 active:scale-[0.98] disabled:opacity-60 transition-all"
          >
            {busy
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('supplier.checking')}</>
              : <>{t('supplier.select')} <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  )
}

function ImportantInfo({ info, checkInOut }) {
  const { t } = useTranslation()
  const struct = info?.struct
  const extra  = info?.extraInfo

  if (!struct && !extra && !checkInOut) return null

  return (
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <h3 className="flex items-center gap-2 font-bold text-amber-900 text-sm">
        <AlertTriangle className="w-4 h-4" /> {t('supplier.importantInfo')}
      </h3>

      {checkInOut && (checkInOut.checkInTime || checkInOut.checkOutTime) && (
        <p className="mt-2 text-xs text-amber-900/80">
          {t('supplier.checkInOut', { in: checkInOut.checkInTime ?? '-', out: checkInOut.checkOutTime ?? '-' })}
        </p>
      )}

      {extra && (
        <p className="mt-2 text-xs text-amber-900/80 leading-relaxed whitespace-pre-line">{extra}</p>
      )}

      {struct && typeof struct === 'object' && (
        <ul className="mt-2 space-y-1">
          {Object.entries(struct).slice(0, 6).map(([key, value]) => (
            <li key={key} className="text-xs text-amber-900/80">
              <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
              {summarizePolicy(value)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Badge({ tone = 'slate', icon: Icon, children }) {
  const tones = {
    green: 'text-emerald-700 bg-emerald-50',
    amber: 'text-amber-700 bg-amber-50',
    slate: 'text-slate-600 bg-slate-100',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md ${tones[tone]}`}>
      {Icon && <Icon className="w-3 h-3" />}{children}
    </span>
  )
}

function Notice({ icon: Icon, title, body }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <Icon className="w-10 h-10 mx-auto text-slate-300" />
      <h2 className="mt-4 font-bold text-lg text-slate-700">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  )
}

function SkeletonPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
      <div className="skeleton w-full aspect-[16/7] rounded-2xl" />
      <div className="skeleton h-7 w-1/2 rounded" />
      <div className="skeleton h-4 w-1/3 rounded" />
      <div className="space-y-3 pt-4">
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-28 w-full rounded-2xl" />)}
      </div>
    </div>
  )
}

/* ── Pembantu ──────────────────────────────────────────────────── */

/**
 * Pajak dari supplier memakai mata uang properti (mis. 17,70 USD).
 * Menampilkannya sebagai Rupiah tanpa konversi membuat "17,70 USD" terbaca
 * "Rp 18" — jadi mata uang aslinya selalu ditampilkan, dengan perkiraan Rupiah
 * sebagai keterangan tambahan.
 */
function formatTax(t) {
  const label = String(t.name ?? '').replace(/_/g, ' ')
  const asli  = `${t.currency ?? ''} ${Number(t.amount ?? 0).toLocaleString('id-ID', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`.trim()

  return t.amountIdr
    ? `${label} ${asli} (±${formatRupiah(t.amountIdr)})`
    : `${label} ${asli}`
}

function formatDeadline(iso) {
  if (!iso) return '-'
  try {
    // Backend mengirim UTC; tampilkan dalam zona waktu perangkat customer.
    return new Date(iso).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

function summarizePolicy(value) {
  if (value == null) return '-'
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) {
    return value.length
      ? value.map(v => (typeof v === 'object' ? Object.values(v).filter(Boolean).join(' ') : String(v))).join('; ')
      : 'Tidak ada'
  }
  return Object.values(value).filter(v => typeof v !== 'object').join(' ') || '-'
}
