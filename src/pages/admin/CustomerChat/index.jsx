import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { chatApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { getImageUrl } from '@/utils'
import {
  MessageCircle, Send, Search, Loader2, Mail, Clock, Headphones,
} from 'lucide-react'

function timeAgo(date) {
  if (!date) return ''
  const d = new Date(date)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam`
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function Avatar({ name, avatar, size = 40, fallbackGradient = 'from-blue-500 to-indigo-600' }) {
  const initial = name?.[0]?.toUpperCase() || '?'
  const url = avatar ? getImageUrl(avatar) : null
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0 border border-slate-100"
        onError={(e) => { e.currentTarget.style.display = 'none' }}
      />
    )
  }
  return (
    <div
      className={`rounded-full bg-gradient-to-br ${fallbackGradient} text-white font-bold flex items-center justify-center shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  )
}

export default function AdminCustomerChat() {
  const me = useAuthStore(s => s.user)
  const [search, setSearch]     = useState('')
  const [activeRoom, setActive] = useState(null)
  const [text, setText]         = useState('')
  const [sending, setSending]   = useState(false)
  const [messages, setMessages] = useState([])
  const [loadingMsg, setLoadingMsg] = useState(false)
  const scrollRef = useRef(null)
  const pollRef   = useRef(null)

  // Rooms list
  const { data: rooms = [], isLoading, refetch: refetchRooms } = useQuery({
    queryKey: ['admin-support-rooms', search],
    queryFn : () => chatApi.supportAdminList({ search: search || undefined, limit: 50 }).then(r => r.data?.data || []),
    refetchInterval: 8000,
  })

  // Load messages when active room changes
  const loadMessages = async (roomId) => {
    if (!roomId) return
    setLoadingMsg(true)
    try {
      const res = await chatApi.messages(roomId)
      setMessages(res.data?.data || [])
    } catch {} finally { setLoadingMsg(false) }
  }

  useEffect(() => {
    if (!activeRoom) return
    loadMessages(activeRoom.id)
    pollRef.current = setInterval(async () => {
      try {
        const res = await chatApi.messages(activeRoom.id)
        const next = res.data?.data || []
        setMessages(prev => prev.length === next.length ? prev : next)
      } catch {}
    }, 4000)
    return () => clearInterval(pollRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom?.id])

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' })
  }, [messages.length])

  const send = async () => {
    const msg = text.trim()
    if (!msg || !activeRoom || sending) return
    setSending(true)
    try {
      const res = await chatApi.send(activeRoom.id, { message: msg })
      setMessages(prev => [...prev, res.data?.data])
      setText('')
      refetchRooms()
    } catch {} finally { setSending(false) }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] overflow-hidden">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Headphones className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customer Live Chat</h1>
          <p className="text-sm text-slate-500">Pesan dari pelanggan website Arahinn.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 overflow-hidden">
        {/* ── Rooms list ── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                placeholder="Cari nama / email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin mx-auto" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Belum ada percakapan.</p>
              </div>
            ) : (
              rooms.map(r => {
                const last  = r.messages?.[0]
                const unread = r.unreadCount ?? r.unread_count ?? 0
                const isActive = activeRoom?.id === r.id
                return (
                  <button
                    key={r.id}
                    onClick={() => setActive(r)}
                    className={`w-full flex items-start gap-3 px-4 py-3 border-b border-slate-50 text-left transition-colors ${
                      isActive ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <Avatar name={r.user?.name} avatar={r.user?.avatar} size={42} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 truncate text-sm">{r.user?.name || 'Pengguna'}</p>
                        {last && (
                          <span className="text-[10px] text-slate-400 shrink-0 ml-auto flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {timeAgo(last.createdAt || last.created_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{r.user?.email}</span>
                      </p>
                      {last && (
                        <p className="text-xs text-slate-500 truncate mt-1">{last.message}</p>
                      )}
                    </div>
                    {unread > 0 && (
                      <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shrink-0 mt-1">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── Chat panel ── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          {!activeRoom ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-8">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-slate-300" />
              </div>
              <p className="font-semibold text-slate-700">Pilih percakapan</p>
              <p className="text-sm text-slate-400 max-w-xs">Klik salah satu pelanggan di sebelah kiri untuk mulai membalas pesan.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="border-b border-slate-100 p-4 flex items-center gap-3">
                <Avatar name={activeRoom.user?.name} avatar={activeRoom.user?.avatar} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{activeRoom.user?.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{activeRoom.user?.email}</span>
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-2.5">
                {loadingMsg ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center text-center gap-2 py-12">
                    <MessageCircle className="w-8 h-8 text-slate-200" />
                    <p className="text-sm text-slate-400">Belum ada pesan dari customer ini.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const senderId = m.senderId ?? m.sender_id
                    const fromMe = String(senderId) === String(me?.id)
                    return (
                      <div key={m.id} className={`flex items-end gap-2 ${fromMe ? 'flex-row-reverse' : ''}`}>
                        {fromMe
                          ? <Avatar name={me?.name} avatar={me?.avatar} size={32}
                              fallbackGradient="from-orange-500 to-amber-500" />
                          : <Avatar name={activeRoom.user?.name} avatar={activeRoom.user?.avatar} size={32} />}
                        <div className={`max-w-[70%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words ${
                          fromMe
                            ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-br-md shadow-sm shadow-orange-200'
                            : 'bg-white text-slate-800 rounded-bl-md shadow-sm border border-slate-100'
                        }`}>
                          {m.message}
                          <div className={`text-[10px] mt-1 ${fromMe ? 'text-orange-50' : 'text-slate-400'}`}>
                            {timeAgo(m.createdAt || m.created_at)}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Input */}
              <div className="border-t border-slate-100 p-3 bg-white">
                <div className="flex items-end gap-2">
                  <textarea
                    rows={1}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
                    }}
                    placeholder="Tulis balasan untuk customer..."
                    className="flex-1 resize-none border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 max-h-24"
                  />
                  <button
                    onClick={send}
                    disabled={!text.trim() || sending}
                    className="px-4 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 transition-opacity shrink-0"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Kirim</>}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
