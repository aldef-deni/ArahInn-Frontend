import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { Send, MessageSquare, User, Calendar, HelpCircle } from 'lucide-react'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'Baru saja'
  if (m < 60)  return `${m} mnt lalu`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h} jam lalu`
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

export default function OwnerChat() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user }    = useAuthStore()
  const { toast }   = useToast()
  const qc          = useQueryClient()
  const [text, setText]         = useState('')
  const [activeRoom, setActive] = useState(searchParams.get('room') || null)
  const [tab, setTab]           = useState(searchParams.get('tab') || 'booking') // 'booking' | 'inquiry'
  const bottomRef   = useRef(null)

  // List chat rooms — booking tab (selalu di-fetch agar badge unread tetap update)
  const { data: bookingRooms, isLoading: loadingBooking } = useQuery({
    queryKey: ['owner-chat-rooms'],
    queryFn : () => chatApi.ownerRooms().then(r => r.data?.data || []),
    refetchInterval: 8000,
  })

  // List chat rooms — inquiry tab (selalu di-fetch agar badge unread tetap update)
  const { data: inquiryRooms, isLoading: loadingInquiry } = useQuery({
    queryKey: ['owner-chat-inquiries'],
    queryFn : () => chatApi.ownerInquiries().then(r => r.data?.data || []),
    refetchInterval: 8000,
  })

  const rooms       = tab === 'inquiry' ? inquiryRooms  : bookingRooms
  const loadingRooms= tab === 'inquiry' ? loadingInquiry: loadingBooking

  // Badge unread per tab
  const unreadBooking = bookingRooms?.reduce((s, r) => s + Number(r.unreadCount || 0), 0) || 0
  const unreadInquiry = inquiryRooms?.reduce((s, r) => s + Number(r.unreadCount || 0), 0) || 0

  // Messages for active room
  const { data: messages, isLoading: loadingMsgs } = useQuery({
    queryKey: ['owner-chat-messages', activeRoom],
    queryFn : () => chatApi.messages(activeRoom).then(r => r.data?.data || []),
    enabled : !!activeRoom,
    refetchInterval: 5000,
  })

  // Send message
  const sendMutation = useMutation({
    mutationFn: (msg) => chatApi.send(activeRoom, { message: msg }),
    onSuccess : () => {
      setText('')
      qc.invalidateQueries({ queryKey: ['owner-chat-messages', activeRoom] })
      qc.invalidateQueries({ queryKey: ['owner-chat-rooms'] })
      qc.invalidateQueries({ queryKey: ['owner-chat-inquiries'] })
    },
    onError: () => toast({ title: 'Gagal mengirim pesan.', variant: 'destructive' }),
  })

  const switchTab = (next) => {
    setTab(next)
    setActive(null)
    setSearchParams({ tab: next })
  }

  const handleSend = () => {
    const msg = text.trim()
    if (!msg || !activeRoom) return
    sendMutation.mutate(msg)
  }

  const selectRoom = (id) => {
    setActive(String(id))
    setSearchParams({ room: id })
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const activeRoomData = rooms?.find(r => String(r.id) === String(activeRoom))

  return (
    <div className="flex h-[calc(100vh-220px)] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Sidebar: room list */}
      <div className="w-[300px] shrink-0 border-r border-slate-100 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-100">
          <p className="font-semibold text-slate-900 text-sm">Pesan Tamu</p>
          <p className="text-xs text-slate-400 mt-0.5">{rooms?.length || 0} percakapan</p>
        </div>

        {/* Tab switcher: Booking | Inquiry */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => switchTab('booking')}
            className={`relative flex-1 px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'booking'
                ? 'text-orange-600 border-b-2 border-orange-500 bg-white'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Booking</span>
            {unreadBooking > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                {unreadBooking > 99 ? '99+' : unreadBooking}
              </span>
            )}
          </button>
          <button
            onClick={() => switchTab('inquiry')}
            className={`relative flex-1 px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'inquiry'
                ? 'text-orange-600 border-b-2 border-orange-500 bg-white'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Inquiry</span>
            {unreadInquiry > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                {unreadInquiry > 99 ? '99+' : unreadInquiry}
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingRooms
            ? Array(4).fill(0).map((_, i) => (
                <div key={i} className="px-4 py-3 border-b border-slate-50">
                  <div className="skeleton h-4 rounded w-3/4 mb-2" />
                  <div className="skeleton h-3 rounded w-1/2" />
                </div>
              ))
            : rooms?.length === 0
              ? (
                <div className="py-16 text-center px-6">
                  <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Belum ada pesan dari tamu.</p>
                </div>
              )
              : rooms?.map(room => {
                  const lastMsg  = room.messages?.[0]
                  const isActive = String(room.id) === String(activeRoom)
                  return (
                    <button key={room.id} onClick={() => selectRoom(room.id)}
                      className={`w-full text-left px-4 py-3.5 border-b border-slate-50 transition-colors ${
                        isActive ? 'bg-blue-50' : 'hover:bg-slate-50'
                      }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-600">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700' : 'text-slate-900'}`}>
                              {room.user?.name || 'Tamu'}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {tab === 'inquiry'
                                ? (room.hotel?.name || 'Tanya penginapan')
                                : (room.booking?.bookingCode || `Booking #${room.bookingId}`)}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          {room.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                              {room.unreadCount}
                            </span>
                          )}
                          {lastMsg && (
                            <p className="text-[10px] text-slate-400 mt-1">{timeAgo(lastMsg.createdAt)}</p>
                          )}
                        </div>
                      </div>
                      {lastMsg && (
                        <p className="text-xs text-slate-400 truncate mt-1.5 pl-11">
                          {lastMsg.message}
                        </p>
                      )}
                    </button>
                  )
                })
          }
        </div>
      </div>

      {/* Chat window */}
      {activeRoom ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{activeRoomData?.user?.name || 'Tamu'}</p>
              <p className="text-xs text-slate-400">
                {tab === 'inquiry'
                  ? (activeRoomData?.hotel?.name ? `Tanya: ${activeRoomData.hotel.name}` : activeRoomData?.user?.email)
                  : (activeRoomData?.booking?.bookingCode
                      ? `Booking ${activeRoomData.booking.bookingCode}`
                      : activeRoomData?.user?.email)}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {loadingMsgs
              ? Array(3).fill(0).map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? '' : 'justify-end'}`}>
                    <div className="skeleton h-10 rounded-2xl w-48" />
                  </div>
                ))
              : messages?.map(msg => {
                  const isMe = msg.sender?.id === user?.id
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                      }`}>
                        <p className="leading-relaxed break-words">{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                          {timeAgo(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })
            }
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-5 py-4 border-t border-slate-100">
            <div className="flex items-end gap-3">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Tulis pesan..."
                rows={1}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
              <button onClick={handleSend} disabled={!text.trim() || sendMutation.isPending}
                className="w-11 h-11 flex items-center justify-center rounded-2xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <MessageSquare className="w-14 h-14 text-slate-200 mx-auto" />
            <p className="text-slate-400 font-medium">Pilih percakapan</p>
            <p className="text-slate-300 text-sm">Klik nama tamu di sebelah kiri untuk membaca pesan.</p>
          </div>
        </div>
      )}
    </div>
  )
}
