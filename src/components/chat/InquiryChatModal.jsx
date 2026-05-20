import { useEffect, useRef, useState } from 'react'
import { X, Send, Loader2, Building2, User, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { chatApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'

/**
 * InquiryChatModal — modal chat customer ↔ owner penginapan (pra-booking).
 * Trigger dari tombol "Chat Penginapan" di HotelDetail.
 *
 * Props:
 *  - hotelId : id penginapan
 *  - hotelName: nama penginapan untuk header
 *  - open    : boolean
 *  - onClose : fn
 */
export default function InquiryChatModal({ hotelId, hotelName, open, onClose }) {
  const { token, user }       = useAuthStore()
  const navigate              = useNavigate()
  const [room, setRoom]       = useState(null)
  const [messages, setMsgs]   = useState([])
  const [text, setText]       = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const scrollRef             = useRef(null)
  const pollRef               = useRef(null)

  // Init room saat dibuka
  useEffect(() => {
    if (!open || !token || !hotelId) return
    let cancelled = false
    setLoading(true)
    chatApi.inquiryRoom(hotelId)
      .then(r => {
        if (cancelled) return
        const data = r.data?.data
        setRoom(data)
        setMsgs(data?.messages || [])
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [open, token, hotelId])

  // Polling pesan baru tiap 4 detik
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
        <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3.5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-orange-100">Chat Penginapan</p>
              <p className="font-bold text-sm truncate">{hotelName || 'Penginapan'}</p>
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
        {!token ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
            <Building2 className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">Login untuk chat dengan pihak penginapan</p>
            <p className="text-xs text-slate-500">Tanya seputar kamar, fasilitas, atau ketersediaan sebelum booking.</p>
            <button
              onClick={() => { onClose(); navigate('/login') }}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <LogIn className="w-4 h-4" /> Masuk
            </button>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-2.5">
              {/* Welcome */}
              <div className="flex gap-2 items-end">
                <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-2xl rounded-bl-md px-3.5 py-2.5 shadow-sm shadow-orange-200 max-w-[78%]">
                  <p className="text-sm">
                    Halo {user?.name?.split(' ')[0] || ''}! 👋 Silakan tanya seputar penginapan ini. Kami akan membantu memberikan informasi tentang penginapan ini.
                  </p>
                </div>
              </div>

              {messages.map((m) => {
                const senderId = m.senderId ?? m.sender_id
                const mine = String(senderId) === String(user?.id)
                return (
                  <div key={m.id} className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      mine ? 'bg-slate-200' : 'bg-orange-100'
                    }`}>
                      {mine
                        ? <User className="w-3.5 h-3.5 text-slate-600" />
                        : <Building2 className="w-3.5 h-3.5 text-orange-600" />}
                    </div>
                    <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words ${
                      mine
                        ? 'bg-white text-slate-800 rounded-br-md shadow-sm border border-slate-100'
                        : 'bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-bl-md shadow-sm shadow-orange-200'
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
                  placeholder="Tulis pertanyaan Anda..."
                  className="flex-1 resize-none border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 max-h-24"
                />
                <button
                  onClick={send}
                  disabled={!text.trim() || sending}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-opacity shrink-0"
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
