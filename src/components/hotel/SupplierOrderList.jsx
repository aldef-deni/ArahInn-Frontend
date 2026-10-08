import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Building2, Loader2 } from 'lucide-react'
import { supplierHotelApi } from '@/services/index'
import { formatRupiah } from '@/services/api'

/**
 * Pemesanan hotel mitra di Riwayat Pesanan.
 *
 * Dipisah dari daftar pesanan ArahInn karena sumbernya memang berbeda:
 * pemesanan mitra TIDAK membuat baris `bookings` sama sekali, hanya
 * `provider_bookings`. Sebelum ini tamu yang menutup halaman konfirmasi
 * kehilangan jejak pemesanannya sepenuhnya — tidak ada tempat untuk melihat
 * statusnya, apalagi membatalkannya.
 */
export default function SupplierOrderList() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [mintaBatal, setMintaBatal] = useState(null) // partner_order_id
  const [galat, setGalat] = useState(null)

  const { data: pesanan = [], isLoading } = useQuery({
    queryKey: ['supplier-my-bookings'],
    queryFn : () => supplierHotelApi.myBookings().then(r => r.data?.data ?? []),
    retry   : false,
  })

  // Pratinjau denda hanya untuk pesanan yang sedang dikonfirmasi pembatalannya
  // — satu panggilan ke supplier per pesanan, jangan untuk seluruh daftar.
  const pratinjau = useQuery({
    queryKey: ['supplier-cancellation', mintaBatal],
    queryFn : () => supplierHotelApi.cancellation(mintaBatal).then(r => r.data?.data),
    enabled : !!mintaBatal,
    retry   : false,
  })

  const batalkan = useMutation({
    mutationFn: (id) => supplierHotelApi.cancel(id).then(r => r.data?.data),
    onSuccess : (hasil) => {
      setMintaBatal(null)
      // CANCEL_PENDING bukan "sudah batal" — supplier belum menjawab.
      if (hasil?.status === 'CANCEL_PENDING') setGalat(t('supplier.cancelPending'))
      qc.invalidateQueries({ queryKey: ['supplier-my-bookings'] })
    },
    onError: (err) => setGalat(err?.response?.data?.message ?? t('supplier.cancelFailed')),
  })

  if (isLoading || pesanan.length === 0) return null

  return (
    <section className="mb-6">
      <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 mb-3">
        <Building2 className="w-4 h-4 text-brand" />
        {t('supplier.ordersTitle')}
      </h2>

      {galat && <p className="mb-3 text-[12px] text-red-500">{galat}</p>}

      <div className="space-y-3">
        {pesanan.map(p => {
          const malam = hitungMalam(p.checkIn, p.checkOut)
          const sedangKonfirmasi = mintaBatal === p.partnerOrderId
          const denda = Number(pratinjau.data?.penaltyAmount ?? 0)

          return (
            <div key={p.partnerOrderId} className="bg-white border rounded-xl sm:rounded-2xl overflow-hidden shadow-card">
              <div className="px-4 sm:px-5 py-2 flex items-center justify-between gap-2 border-b border-slate-100">
                <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${warnaStatus(p.status)}`}>
                  {t(`supplier.st${p.status}`, p.status)}
                </span>
                <span className="text-muted-foreground font-mono text-[10px] sm:text-xs truncate">
                  {String(p.partnerOrderId).slice(0, 8)}
                </span>
              </div>

              <div className="p-4 sm:p-5">
                <p className="font-bold text-sm text-slate-900">{p.hotelName || p.providerHotelId}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {p.checkIn && p.checkOut
                    ? `${p.checkIn} – ${p.checkOut}${malam ? ` · ${t('supplier.ordersNights', { count: malam })}` : ''}`
                    : '—'}
                </p>
                {p.message && <p className="mt-2 text-xs text-red-500">{p.message}</p>}

                <div className="mt-3 flex items-end justify-between gap-3">
                  <span className="text-sm font-extrabold text-slate-900">
                    {p.amount != null ? formatRupiah(Number(p.amount)) : '—'}
                  </span>

                  {p.cancellable && !sedangKonfirmasi && (
                    <button
                      onClick={() => { setGalat(null); setMintaBatal(p.partnerOrderId) }}
                      className="text-[12px] font-semibold text-red-500 hover:text-red-600 underline underline-offset-2"
                    >
                      {t('supplier.cancelBookingCta')}
                    </button>
                  )}
                </div>

                {sedangKonfirmasi && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    {pratinjau.isLoading ? (
                      <p className="text-[12px] text-slate-400">{t('supplier.cancelChecking')}</p>
                    ) : (
                      <>
                        <p className="text-[12px] text-slate-600">
                          {denda > 0
                            ? t('supplier.cancelPenaltyNote', { amount: formatRupiah(denda) })
                            : t('supplier.cancelFreeNote')}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => batalkan.mutate(p.partnerOrderId)}
                            disabled={batalkan.isPending}
                            className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[12px] font-bold disabled:opacity-50"
                          >
                            {batalkan.isPending
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : t('supplier.cancelConfirm')}
                          </button>
                          <button
                            onClick={() => setMintaBatal(null)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600"
                          >
                            {t('supplier.cancelBack')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function hitungMalam(masuk, keluar) {
  if (!masuk || !keluar) return 0
  const ms = new Date(keluar) - new Date(masuk)
  return ms > 0 ? Math.round(ms / 86400000) : 0
}

function warnaStatus(status) {
  switch (status) {
    case 'CONFIRMED':      return 'bg-emerald-50 text-emerald-600'
    case 'CANCELLED':      return 'bg-slate-100 text-slate-500'
    case 'FAILED':
    case 'CANCEL_FAILED':  return 'bg-red-50 text-red-600'
    default:               return 'bg-blue-50 text-blue-600'
  }
}
