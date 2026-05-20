import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewApi } from '@/services/reviewApi'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { Star, Send, LogIn, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/**
 * Reusable review submission form.
 *
 * Props:
 * - targetType: 'hotel' | 'property'
 * - targetId:   id dari hotel / property listing
 * - invalidateKey: array key untuk invalidate query list ulasan
 */
export default function ReviewForm({ targetType, targetId, invalidateKey }) {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const navigate  = useNavigate()
  const qc        = useQueryClient()

  const [rating, setRating]   = useState(0)
  const [hover, setHover]     = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const mutation = useMutation({
    mutationFn: () => reviewApi.store({
      [targetType === 'hotel' ? 'hotelId' : 'propertyId']: targetId,
      rating,
      comment: comment.trim(),
    }),
    onSuccess: () => {
      toast({ title: 'Ulasan terkirim. Menunggu persetujuan superadmin.' })
      setRating(0); setComment(''); setSubmitted(true)
      if (invalidateKey) qc.invalidateQueries({ queryKey: invalidateKey })
    },
    onError: (err) => {
      toast({
        title: 'Gagal mengirim ulasan',
        description: err?.response?.data?.message || 'Coba lagi nanti.',
        variant: 'destructive',
      })
    },
  })

  if (!token) {
    return (
      <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">Login terlebih dahulu untuk memberikan ulasan.</p>
        <button
          onClick={() => navigate('/login')}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <LogIn className="h-4 w-4" /> Masuk untuk Mengulas
        </button>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
        <p className="mt-3 text-sm font-semibold text-emerald-800">Terima kasih atas ulasan yang Anda berikan.</p>
        <p className="mt-1 text-xs text-emerald-700">Ulasan Anda sedang dalam peninjauan.</p>
        <p className="text-xs text-emerald-700">Akan ditayangkan setelah disetujui oleh Team ArahInn.</p>
      </div>
    )
  }

  const canSubmit = rating > 0 && comment.trim().length >= 10

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Tulis ulasan Anda</p>
      <p className="mt-2 text-sm text-slate-600">
        Bagikan pengalaman Anda. Ulasan akan ditinjau superadmin sebelum tayang.
      </p>

      <div className="mt-4">
        <label className="text-xs font-semibold text-slate-600 block mb-2">Rating</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              className="p-1 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Star
                className={`h-7 w-7 transition-colors ${
                  (hover || rating) >= n
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-slate-200 text-slate-200'
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm font-semibold text-slate-700">{rating} / 5</span>
          )}
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs font-semibold text-slate-600 block mb-2">Komentar</label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Ceritakan pengalaman Anda (min. 10 karakter)..."
          rows={4}
          maxLength={1000}
          className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 resize-none"
        />
        <p className="mt-1 text-xs text-slate-400 text-right">{comment.length}/1000</p>
      </div>

      <button
        onClick={() => mutation.mutate()}
        disabled={!canSubmit || mutation.isPending}
        className="mt-4 inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-orange-500 text-white rounded-2xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {mutation.isPending ? (
          <>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Mengirim...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Kirim Ulasan
          </>
        )}
      </button>
    </div>
  )
}
