import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Loader2, CheckCircle2, XCircle, Clock, Ban } from 'lucide-react'
import { supplierHotelApi } from '@/services/index'
import { formatRupiah } from '@/services/api'

/**
 * Layar status pemesanan hotel mitra.
 *
 * Penting: respons "berhasil" dari tahap start booking BUKAN konfirmasi.
 * Status final hanya datang dari backend ArahInn (yang memanggil Check Booking
 * Process / menerima webhook). Browser polling ke BACKEND, tidak pernah ke
 * RateHawk.
 *
 * Pembatalan ADA DI SINI, bukan di Riwayat Pesanan. Alasannya: pemesanan hotel
 * mitra tidak membuat baris `bookings` ArahInn sama sekali — hanya
 * `provider_bookings` — sehingga tidak pernah muncul di halaman itu. Sampai
 * pemesanan mitra ikut terdaftar di sana, layar inilah satu-satunya tempat
 * tamu bisa membatalkan, dan mengarahkannya ke /orders justru membuatnya
 * terlihat seperti pemesanan yang hilang.
 */
export default function SupplierBookingStatus({ partnerOrderId, hotelName, onDone }) {
  const { t } = useTranslation()
  const [stopped, setStopped] = useState(false)
  const [mintaBatal, setMintaBatal] = useState(false)
  const [dibatalkan, setDibatalkan] = useState(false)
  const [galatBatal, setGalatBatal] = useState(null)

  const { data } = useQuery({
    queryKey: ['supplier-booking-status', partnerOrderId],
    queryFn : () => supplierHotelApi.status(partnerOrderId).then(r => r.data?.data),
    enabled : !!partnerOrderId && !stopped,
    // Jeda polling mengikuti yang ditentukan backend.
    refetchInterval: (query) => {
      const d = query.state.data
      if (!d || d.final) return false
      return Math.max(3, Number(d.pollInterval || 5)) * 1000
    },
    retry: false,
  })

  const status = data?.status ?? 'PROCESSING'

  useEffect(() => {
    if (data?.final) {
      setStopped(true)
      onDone?.(status)
    }
  }, [data?.final, status, onDone])

  // Pratinjau denda diambil HANYA saat tamu menekan "Batalkan", bukan saat
  // layar dibuka: ini panggilan ke supplier, dan tidak semua orang yang
  // melihat konfirmasi berniat membatalkan.
  const pratinjau = useQuery({
    queryKey: ['supplier-cancellation', partnerOrderId],
    queryFn : () => supplierHotelApi.cancellation(partnerOrderId).then(r => r.data?.data),
    enabled : mintaBatal && !dibatalkan,
    retry   : false,
  })

  const batalkan = useMutation({
    mutationFn: () => supplierHotelApi.cancel(partnerOrderId).then(r => r.data?.data),
    onSuccess : (hasil) => {
      // CANCEL_PENDING bukan "sudah batal". Mengatakannya batal di sini
      // berarti menebak jawaban yang belum diberikan supplier.
      if (hasil?.status === 'CANCEL_PENDING' || hasil?.state === 'CANCEL_PENDING') {
        setGalatBatal(t('supplier.cancelPending'))
        return
      }
      setDibatalkan(true)
    },
    onError: (err) => setGalatBatal(
      err?.response?.data?.message ?? t('supplier.cancelFailed'),
    ),
  })

  if (dibatalkan || status === 'CANCELLED') {
    return (
      <Panel
        tone="slate" icon={Ban}
        title={t('supplier.cancelledTitle')}
        body={t('supplier.cancelledBody', { hotel: hotelName })}
        footer={<TautanPesanan t={t} />}
      />
    )
  }

  if (status === 'CONFIRMED') {
    const denda = Number(pratinjau.data?.penaltyAmount ?? 0)

    return (
      <Panel
        tone="green" icon={CheckCircle2}
        title={t('supplier.statusConfirmedTitle')}
        body={t('supplier.statusConfirmedBody', { hotel: hotelName })}
        footer={
          <div className="mt-6">
            {galatBatal && (
              <p className="mb-3 text-[12px] text-red-500">{galatBatal}</p>
            )}

            {!mintaBatal ? (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => { setGalatBatal(null); setMintaBatal(true) }}
                  className="text-[12px] font-semibold text-red-500 hover:text-red-600 underline underline-offset-2"
                >
                  {t('supplier.cancelBookingCta')}
                </button>
                <TautanPesanan t={t} />
              </div>
            ) : pratinjau.isLoading ? (
              <p className="text-[12px] text-slate-400">{t('supplier.cancelChecking')}</p>
            ) : (
              <div className="max-w-sm mx-auto">
                <p className="text-[12px] text-slate-600">
                  {denda > 0
                    ? t('supplier.cancelPenaltyNote', { amount: formatRupiah(denda) })
                    : t('supplier.cancelFreeNote')}
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    onClick={() => batalkan.mutate()}
                    disabled={batalkan.isPending}
                    className="px-4 py-2 rounded-xl bg-red-500 text-white text-[12px] font-bold disabled:opacity-50"
                  >
                    {batalkan.isPending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : t('supplier.cancelConfirm')}
                  </button>
                  <button
                    onClick={() => setMintaBatal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-[12px] font-semibold text-slate-600"
                  >
                    {t('supplier.cancelBack')}
                  </button>
                </div>
              </div>
            )}
          </div>
        }
      />
    )
  }

  if (status === 'FAILED') {
    return (
      <Panel
        tone="red" icon={XCircle}
        title={t('supplier.statusFailedTitle')}
        // Pesan dari backend sudah ramah-customer; tidak ada detail teknis supplier.
        body={data?.message || t('supplier.statusFailedBody')}
      />
    )
  }

  return (
    <Panel
      tone="blue" icon={Loader2} spin
      title={t('supplier.statusProcessingTitle')}
      body={t('supplier.statusProcessingBody', { hotel: hotelName })}
      footer={
        // Setelah batas 180 detik terlewat, pesannya BERUBAH. Pemintal yang
        // sama persis di detik ke-10 dan ke-400 membuat tamu menyimpulkan
        // sendiri bahwa pemesanannya gagal — padahal tidak, dan menutup
        // halaman pun tidak menggugurkannya.
        <p className="mt-4 inline-flex items-start gap-1.5 text-[11px] text-slate-400 max-w-sm mx-auto text-left">
          <Clock className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span>
            {data?.beyondDeadline
              ? t('supplier.statusSlowHint')
              : t('supplier.statusProcessingHint')}
          </span>
        </p>
      }
    />
  )
}

function TautanPesanan({ t }) {
  return (
    <Link to="/orders" className="text-[11px] text-slate-400 hover:text-slate-600 underline underline-offset-2">
      {t('supplier.viewOrders')}
    </Link>
  )
}

function Panel({ tone, icon: Icon, spin, title, body, footer }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-600',
    red  : 'bg-red-50 text-red-600',
    blue : 'bg-blue-50 text-blue-600',
    slate: 'bg-slate-100 text-slate-500',
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
      <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${tones[tone]}`}>
        <Icon className={`w-8 h-8 ${spin ? 'animate-spin' : ''}`} />
      </div>
      <h2 className="mt-5 text-lg font-extrabold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-md mx-auto">{body}</p>
      {footer}
    </div>
  )
}
