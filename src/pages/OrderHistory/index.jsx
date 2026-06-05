import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { bookingApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah, formatDateShort, statusBadgeClass, statusLabel, getImageUrl } from '@/utils'
import { ShoppingBag, Calendar, ChevronRight, XCircle, ChevronLeft, Hotel, Receipt, Ticket } from 'lucide-react'
import PpobTransactionList from '@/pages/Ppob/PpobTransactionList'
import TravelBookingList from '@/pages/Travel/TravelBookingList'

export default function OrderHistory() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc       = useQueryClient()
  const { toast } = useToast()

  const TABS = [
    { value: '',          label: t('orderHistory.statusAll') },
    { value: 'pending',   label: t('orderHistory.statusPending') },
    { value: 'issued',    label: t('orderHistory.statusIssued') },
    { value: 'canceled',  label: t('orderHistory.statusCanceled') },
  ]

  const MAIN_TABS = [
    { value: 'akomodasi', label: t('orderHistory.tabAkomodasi'), Icon: Hotel },
    { value: 'travel',    label: t('orderHistory.tabTravel'),    Icon: Ticket },
    { value: 'ppob',      label: t('orderHistory.tabPpob'),      Icon: Receipt },
  ]
  const [searchParams, setSearchParams] = useSearchParams()
  const jenisParam = searchParams.get('jenis')
  const initialMain = jenisParam === 'ppob' ? 'ppob' : jenisParam === 'travel' ? 'travel' : 'akomodasi'
  const [activeMain, setActiveMain] = useState(initialMain)
  const [activeTab, setActiveTab] = useState('')
  const [page, setPage] = useState(1)

  const handleMainTab = (v) => {
    setActiveMain(v)
    if (v === 'akomodasi') searchParams.delete('jenis')
    else searchParams.set('jenis', v)
    setSearchParams(searchParams, { replace: true })
  }

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', activeTab, page],
    queryFn : () => bookingApi.myOrders({ status: activeTab || undefined, page, limit: 8 }).then(r => r.data),
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => bookingApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-orders'] })
      toast({ title: t('orderHistory.cancelSuccess') })
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: ['my-orders'] })
      const msg = e?.response?.data?.message || t('orderHistory.cancelFailedDefault')
      toast({ title: t('orderHistory.cancelFailed'), description: msg, variant: 'destructive' })
    },
  })

  return (
    <div className="container py-4 sm:py-6 lg:py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
          <ShoppingBag className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-brand-700" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-bold leading-tight">{t('orderHistory.title')}</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">{t('orderHistory.subtitle')}</p>
        </div>
      </div>

      {/* ── Main tabs: Akomodasi | PPOB (underline style) ───────────── */}
      <div className="relative border-b border-slate-200 mb-4 sm:mb-6">
        <div className="flex gap-1 sm:gap-2">
          {MAIN_TABS.map(tab => {
            const TabIcon = tab.Icon
            const active = activeMain === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => handleMainTab(tab.value)}
                className={`relative flex items-center gap-2 px-4 sm:px-5 py-3 text-sm font-semibold transition-colors ${
                  active ? 'text-brand' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <TabIcon className={`w-4 h-4 transition-transform ${active ? 'scale-110' : ''}`} />
                {tab.label}
                {active && (
                  <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Travel tab (pesawat / kereta / pelni) ────────── */}
      {activeMain === 'travel' && (
        <TravelBookingList />
      )}

      {/* ── PPOB tab ─────────────────────────────────────── */}
      {activeMain === 'ppob' && (
        <PpobTransactionList limit={30} />
      )}

      {/* ── Akomodasi tab (existing content) ─────────────── */}
      {activeMain === 'akomodasi' && (<>
      {/* Tabs — horizontal scroll on mobile */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1 scrollbar-thin">
        {TABS.map(tab => (
          <button key={tab.value} onClick={() => { setActiveTab(tab.value); setPage(1) }}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all border active:scale-95 ${
              activeTab === tab.value
                ? 'bg-brand text-white border-brand'
                : 'hover:bg-muted border-transparent'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-3 sm:space-y-4">
        {isLoading
          ? Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-card">
                <div className="skeleton h-5 w-2/3 rounded mb-3" />
                <div className="skeleton h-4 w-1/2 rounded mb-2" />
                <div className="skeleton h-4 w-1/3 rounded" />
              </div>
            ))
          : data?.data?.length
            ? data.data.map(order => (
                <div key={order.id} className="bg-white border rounded-xl sm:rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
                  {/* Status bar */}
                  <div className="px-4 sm:px-5 py-2 text-xs font-semibold flex items-center justify-between gap-2 border-b border-slate-100">
                    <span className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${statusBadgeClass(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                    <span className="text-muted-foreground font-mono text-[10px] sm:text-xs truncate">{order.bookingCode}</span>
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                          {order.hotel?.images?.[0]
                            ? <img src={getImageUrl(order.hotel.images[0])} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-2xl">🏨</div>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm sm:text-base line-clamp-1">{order.hotel?.name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{order.room?.name}</p>
                          <div className="flex items-center gap-1 sm:gap-1.5 mt-1 sm:mt-1.5 text-[11px] sm:text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                            <span className="truncate">{formatDateShort(order.checkIn)} – {formatDateShort(order.checkOut)} · {order.totalNights} {t('orderHistory.nights')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="price-tag text-sm sm:text-base">{formatRupiah(order.totalPrice)}</p>
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{order.guests} {t('orderHistory.guests')}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                      <button onClick={() => navigate(`/orders/${order.bookingCode || order.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 border rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-muted active:scale-95 transition-all">
                        {t('orderHistory.detail')} <ChevronRight className="w-4 h-4" />
                      </button>
                      {order.status === 'pending' && (
                        <>
                          <button onClick={() => navigate(`/payment/${order.id}`)}
                            className="flex-1 py-2 bg-brand text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold hover:bg-brand-700 active:scale-95 transition-all">
                            {t('orderHistory.payNow')}
                          </button>
                          <button onClick={() => cancelMutation.mutate(order.id)}
                            disabled={cancelMutation.isPending}
                            className="px-3 py-2 border border-red-200 text-red-600 rounded-lg sm:rounded-xl text-sm hover:bg-red-50 active:scale-95 transition-all shrink-0">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            : (
              <div className="text-center py-12 sm:py-16 px-4">
                <p className="text-5xl mb-3 sm:mb-4">📭</p>
                <p className="font-semibold text-base sm:text-lg">{t('orderHistory.emptyTitle')}</p>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1 mb-5 sm:mb-6">{t('orderHistory.emptySubtitle')}</p>
                <button onClick={() => navigate('/search')}
                  className="px-5 sm:px-6 py-2.5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand-700 active:scale-95 transition-all">
                  {t('orderHistory.findHotel')}
                </button>
              </div>
            )}
      </div>

      {/* Pagination — smart compact */}
      {data?.pagination?.totalPages > 1 && (
        <OrderPagination
          current={page}
          total={data.pagination.totalPages}
          onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        />
      )}
      </>)}
    </div>
  )
}

function OrderPagination({ current, total, onChange }) {
  const win = 1
  const pages = new Set([1, total, current])
  for (let i = current - win; i <= current + win; i++) {
    if (i > 1 && i < total) pages.add(i)
  }
  const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b)
  const items = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) items.push('…')
    items.push(p)
    prev = p
  }

  return (
    <div className="flex justify-center items-center gap-1 sm:gap-2 mt-6 sm:mt-8">
      <button onClick={() => onChange(Math.max(1, current - 1))}
        disabled={current === 1}
        className="w-9 h-9 rounded-lg flex items-center justify-center border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {items.map((it, i) => (
        it === '…' ? (
          <span key={`e${i}`} className="w-6 sm:w-9 text-center text-slate-400 text-sm">…</span>
        ) : (
          <button key={it} onClick={() => onChange(it)}
            className={`w-9 h-9 rounded-lg text-xs sm:text-sm font-medium transition-all border active:scale-95 ${
              current === it ? 'bg-brand text-white border-brand' : 'hover:bg-muted'
            }`}>
            {it}
          </button>
        )
      ))}
      <button onClick={() => onChange(Math.min(total, current + 1))}
        disabled={current === total}
        className="w-9 h-9 rounded-lg flex items-center justify-center border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
