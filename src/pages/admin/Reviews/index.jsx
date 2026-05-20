import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewApi } from '@/services/reviewApi'
import { useToast } from '@/hooks/use-toast'
import {
  Star, Check, X, Search, Filter, MessageSquare,
  ChevronLeft, ChevronRight, Hotel, User, Clock,
  CheckCircle2, XCircle, AlertCircle, Building2,
} from 'lucide-react'
import { cn } from '@/utils'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

const STATUS_META = {
  pending  : { label: 'Menunggu',  cls: 'bg-amber-100 text-amber-700',   icon: Clock        },
  approved : { label: 'Disetujui', cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected : { label: 'Ditolak',   cls: 'bg-red-100 text-red-600',        icon: XCircle      },
}

function StarRow({ rating, size = 'sm' }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array(5).fill(0).map((_, i) => (
        <Star key={i}
          className={cn(
            size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4',
            i < rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
          )} />
      ))}
    </div>
  )
}

function RejectModal({ review, onClose, onConfirm, isPending }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Tolak Ulasan</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-slate-600">
            Ulasan dari <strong>{review.user?.name}</strong> untuk{' '}
            <strong>{review.target_name || review.hotel?.name || review.property?.title}</strong> akan ditolak.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Alasan penolakan <span className="font-normal text-slate-400">(opsional)</span>
            </label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="mis. Konten tidak sesuai, mengandung kata kasar..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
            />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Batal
          </button>
          <button onClick={() => onConfirm(reason)} disabled={isPending}
            className="px-5 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors">
            {isPending ? 'Menolak...' : 'Tolak Ulasan'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminReviews() {
  const { toast } = useToast()
  const qc        = useQueryClient()

  const [search,     setSearch]     = useState('')
  const [status,     setStatus]     = useState('pending')
  const [type,       setType]       = useState('')
  const [page,       setPage]       = useState(1)
  const [rejectTarget, setRejectTarget] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', { search, status, type, page }],
    queryFn : () => reviewApi.adminList({
      search,
      status: status || undefined,
      type: type || undefined,
      page,
    }).then(r => r.data?.data),
    keepPreviousData: true,
  })

  const approveMutation = useMutation({
    mutationFn: (id) => reviewApi.approve(id),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] })
      toast({ title: 'Ulasan disetujui dan akan tampil di detail hotel.' })
    },
    onError: () => toast({ title: 'Gagal menyetujui ulasan.', variant: 'destructive' }),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => reviewApi.reject(id, reason),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] })
      setRejectTarget(null)
      toast({ title: 'Ulasan ditolak.' })
    },
    onError: () => toast({ title: 'Gagal menolak ulasan.', variant: 'destructive' }),
  })

  const reviews    = data?.data || []
  const pagination = data ? { current: data.current_page, last: data.last_page, total: data.total } : null

  const counts = { pending: null, approved: null, rejected: null }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Moderasi</p>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">Review Tamu</h1>
          <p className="text-sm text-slate-500 mt-0.5">Setujui atau tolak ulasan sebelum ditampilkan di halaman hotel.</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Cari nama tamu, hotel/properti, atau isi ulasan..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
        </div>
        {/* Type filter */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
          {[
            { val: '',         label: 'Semua Target' },
            { val: 'hotel',    label: 'Penginapan' },
            { val: 'property', label: 'Properti' },
          ].map(({ val, label }) => (
            <button key={val}
              onClick={() => { setType(val); setPage(1) }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                type === val
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}>
              {label}
            </button>
          ))}
        </div>
        {/* Status tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
          {[
            { val: 'pending',  label: 'Menunggu' },
            { val: 'approved', label: 'Disetujui' },
            { val: 'rejected', label: 'Ditolak' },
            { val: '',         label: 'Semua' },
          ].map(({ val, label }) => (
            <button key={val}
              onClick={() => { setStatus(val); setPage(1) }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                status === val
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-20 text-center">
            <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Tidak ada ulasan ditemukan.</p>
            <p className="text-xs text-slate-400 mt-1">Coba ubah filter atau kata pencarian.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map(review => {
              const meta = STATUS_META[review.status] || STATUS_META.pending
              const StatusIcon = meta.icon
              const timeAgo = review.created_at
                ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: idLocale })
                : ''

              return (
                <div key={review.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col sm:flex-row gap-4">

                    {/* Avatar + info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                        {review.user?.name?.[0]?.toUpperCase() || 'T'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-slate-900">{review.user?.name || 'Tamu'}</span>
                          <span className="text-xs text-slate-400">{review.user?.email}</span>
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', meta.cls)}>
                            <StatusIcon className="w-3 h-3" /> {meta.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            {review.target_type === 'property' ? (
                              <Building2 className="w-3 h-3" />
                            ) : (
                              <Hotel className="w-3 h-3" />
                            )}
                            <span className="font-medium">{review.target_name || review.hotel?.name || review.property?.title}</span>
                            {(review.target_city || review.hotel?.city || review.property?.city) && (
                              <span className="text-slate-400">· {review.target_city || review.hotel?.city || review.property?.city}</span>
                            )}
                          </div>
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
                            review.target_type === 'property'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          )}>
                            {review.target_type === 'property' ? 'Properti' : 'Penginapan'}
                          </span>
                        </div>
                        <StarRow rating={review.rating} />
                        <p className="mt-2 text-sm text-slate-700 leading-relaxed">{review.comment}</p>
                        {review.rejected_reason && (
                          <div className="mt-2 flex items-start gap-1.5 text-xs text-red-500">
                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>Alasan: {review.rejected_reason}</span>
                          </div>
                        )}
                        <p className="mt-2 text-[11px] text-slate-400">{timeAgo}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    {review.status === 'pending' && (
                      <div className="flex sm:flex-col gap-2 shrink-0">
                        <button
                          onClick={() => approveMutation.mutate(review.id)}
                          disabled={approveMutation.isPending}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold hover:bg-emerald-100 disabled:opacity-50 transition-colors">
                          <Check className="w-3.5 h-3.5" /> Setujui
                        </button>
                        <button
                          onClick={() => setRejectTarget(review)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors">
                          <X className="w-3.5 h-3.5" /> Tolak
                        </button>
                      </div>
                    )}
                    {review.status === 'approved' && (
                      <button
                        onClick={() => setRejectTarget(review)}
                        className="flex items-center gap-1.5 px-4 py-2 h-fit bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors shrink-0">
                        <X className="w-3.5 h-3.5" /> Cabut
                      </button>
                    )}
                    {review.status === 'rejected' && (
                      <button
                        onClick={() => approveMutation.mutate(review.id)}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 h-fit bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold hover:bg-emerald-100 disabled:opacity-50 transition-colors shrink-0">
                        <Check className="w-3.5 h-3.5" /> Setujui
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.last > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Total {pagination.total} ulasan
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
              <span className="text-xs text-slate-600 px-2">
                {pagination.current} / {pagination.last}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.last, p + 1))}
                disabled={page === pagination.last}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          review={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={(reason) => rejectMutation.mutate({ id: rejectTarget.id, reason })}
          isPending={rejectMutation.isPending}
        />
      )}
    </div>
  )
}
