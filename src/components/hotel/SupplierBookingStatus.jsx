import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { supplierHotelApi } from '@/services/index'

/**
 * Layar status pemesanan hotel mitra.
 *
 * Penting: respons "berhasil" dari tahap start booking BUKAN konfirmasi.
 * Status final hanya datang dari backend ArahInn (yang memanggil Check Booking
 * Process / menerima webhook). Browser polling ke BACKEND, tidak pernah ke
 * RateHawk.
 */
export default function SupplierBookingStatus({ partnerOrderId, hotelName, onDone }) {
  const { t } = useTranslation()
  const [stopped, setStopped] = useState(false)

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

  if (status === 'CONFIRMED') {
    return (
      <Panel
        tone="green" icon={CheckCircle2}
        title={t('supplier.statusConfirmedTitle')}
        body={t('supplier.statusConfirmedBody', { hotel: hotelName })}
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
        <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          {t('supplier.statusProcessingHint')}
        </p>
      }
    />
  )
}

function Panel({ tone, icon: Icon, spin, title, body, footer }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-600',
    red  : 'bg-red-50 text-red-600',
    blue : 'bg-blue-50 text-blue-600',
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
