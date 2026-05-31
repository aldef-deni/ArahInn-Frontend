import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Send, Loader2, MessageSquare, User } from 'lucide-react'
import { chatApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { getImageUrl } from '@/utils'

/**
 * BookingChatModal — chat customer ↔ owner penginapan untuk konteks BOOKING aktif.
 * Pesan akan muncul di tab "Booking" pada panel chat owner.
 *
 * Props:
 *  - open       : boolean
 *  - bookingId  : id booking
 *  - hotelId    : id hotel terkait
 *  - hotelName  : nama hotel
 *  - bookingCode: kode booking untuk konteks header
 *  - onClose    : fn
 */
export default function BookingChatModal({ open, bookingId, hotelId, hotelName, bookingCode, onClose }) {
  const { t } = useTranslation()
  const { user }              = useAuthStore()
  const [room, setRoom]       = useState(null)
  const [messages, setMsgs]   = useState([])
  const [text, setText]       = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const scrollRef             = useRef(null)
  const pollRef               = useRef(null)

  // Init room saat dibuka
  useEffect(() => {
    if (!open || !bookingId || !hotelId) return
    let cancelled = false
    setLoading(true)
    chatApi.createRoom({ booking_id: bookingId, hotel_id: hotelId })
      .then(async (r) => {
        if (cancelled) return
        const roomData = r.data?.data
        setRoom(roomData)
        // Fetch messages for the room
        try {
          const mr = await chatApi.messages(roomData.id)
          if (!cancelled) setMsgs(mr.data?.data || [])
        } catch {}
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [open, bookingId, hotelId])

  // Polling
  useEffect(() => {
    if (!open || !room?.id) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await chatApi.messages(room.id)
        const next = res.data?.data || []
        setMsgs(prev => prev.length === next.length ? prev : next)
      } catch {}
    }, 4000)
    return () => clearInterval(pollRef.current)
  }, [open, room?.id])

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' })
  }, [messages.length])

  const send = async () => {
    const msg = text.trim()
    if (!msg || !room?.id || sending) return
    setSending(true)
    try {
      const res = await chatApi.send(room.id, { message: msg })
      setMsgs(prev => [...prev, res.data?.data])
      setText('')
    } catch {} finally { setSending(false) }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="w-full sm:w-[420px] h-[85vh] sm:h-[600px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-blue-100">{t('chatModal.chatBookingLabel')}</p>
              <p className="font-bold text-sm truncate">{hotelName || t('chatModal.defaultHotel')}</p>
              {bookingCode && (
                <p className="text-[10px] text-blue-100 font-mono mt-0.5">#{bookingCode}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-2.5">
              {/* Welcome */}
              <div className="flex gap-2 items-end">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-bl-md px-3.5 py-2.5 shadow-sm shadow-blue-200 max-w-[78%]">
                  <p className="text-sm">
                    {t('chatModal.welcomeBooking', { name: user?.name?.split(' ')[0] || '' })}
                  </p>
                </div>
              </div>

              {messages.map((m) => {
                const senderId = m.senderId ?? m.sender_id
                const mine = String(senderId) === String(user?.id)
                return (
                  <div key={m.id} className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${
                      mine ? 'bg-slate-200' : 'bg-blue-100'
                    }`}>
                      {mine
                        ? <User className="w-3.5 h-3.5 text-slate-600" />
                        : (m.sender?.avatar
                            ? <img src={getImageUrl(m.sender.avatar)} alt="" className="w-full h-full object-cover" />
                            : <MessageSquare className="w-3.5 h-3.5 text-blue-600" />)}
                    </div>
                    <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words ${
                      mine
                        ? 'bg-white text-slate-800 rounded-br-md shadow-sm border border-slate-100'
                        : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-bl-md shadow-sm shadow-blue-200'
                    }`}>
                      {m.message}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 bg-white p-3">
              <div className="flex items-end gap-2">
                <textarea
                  rows={1}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
                  }}
                  placeholder={t('chatModal.placeholderBooking')}
                  className="flex-1 resize-none border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 max-h-24"
                />
                <button
                  onClick={send}
                  disabled={!text.trim() || sending}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-opacity shrink-0"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
