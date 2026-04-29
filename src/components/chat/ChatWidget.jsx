import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { MessageCircle, X, Send, ChevronLeft } from 'lucide-react'
import { cn } from '@/utils'
import api from '@/services/api'

let echoInstance = null

async function getEcho(token) {
  if (echoInstance) return echoInstance
  const [{ default: Pusher }, { default: Echo }] = await Promise.all([
    import('pusher-js'),
    import('laravel-echo'),
  ])
  echoInstance = new Echo({
    broadcaster  : 'pusher',
    key          : import.meta.env.VITE_PUSHER_APP_KEY,
    cluster      : import.meta.env.VITE_PUSHER_APP_CLUSTER || 'ap1',
    forceTLS     : true,
    authEndpoint : `${import.meta.env.VITE_API_URL || '/api/v1'}/broadcasting/auth`,
    auth         : { headers: { Authorization: `Bearer ${token}` } },
  })
  return echoInstance
}

export default function ChatWidget() {
  const { token, user }         = useAuthStore()
  const [open, setOpen]         = useState(false)
  const [rooms, setRooms]       = useState([])
  const [activeRoom, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [unread, setUnread]     = useState(0)
  const [sending, setSending]   = useState(false)
  const bottomRef               = useRef(null)
  const channelRef              = useRef(null)

  useEffect(() => {
    if (open && token) {
      api.get('/chat/rooms').then(r => setRooms(r.data.data || [])).catch(() => {})
    }
  }, [open, token])

  useEffect(() => {
    if (!activeRoom || !token) return
    setMessages([])
    api.get(`/chat/rooms/${activeRoom.id}/messages`)
      .then(r => { setMessages(r.data.data || []); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100) })
    
    getEcho(token).then(echo => {
      channelRef.current?.stopListening?.('.new-message')
      channelRef.current = echo.private(`chat.${activeRoom.id}`)
      channelRef.current.listen('.new-message', (data) => {
        setMessages(prev => [...prev, data])
        if (!open) setUnread(n => n + 1)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
    })
    return () => { channelRef.current?.stopListening?.('.new-message') }
  }, [activeRoom?.id, token])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !activeRoom || sending) return
    const text = input.trim(); setInput(''); setSending(true)
    try {
      const res = await api.post(`/chat/rooms/${activeRoom.id}/messages`, { message: text })
      setMessages(prev => [...prev, res.data.data])
    } catch { setInput(text) }
    finally { setSending(false) }
  }

  if (!token) return null

  return (
    <>
      <button onClick={() => { setOpen(o => !o); setUnread(0) }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand text-white shadow-xl hover:bg-brand-700 transition-all flex items-center justify-center shadow-brand/30">
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{unread}</span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[480px] bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-slide-in-right">
          <div className="bg-brand px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {activeRoom && <button onClick={() => { setActive(null); setMessages([]) }} className="text-white/80 hover:text-white mr-1"><ChevronLeft className="w-4 h-4" /></button>}
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><MessageCircle className="w-4 h-4 text-white" /></div>
              <div>
                <p className="text-white font-semibold text-sm">{activeRoom ? 'Chat Reservasi' : 'Bantuan 24/7'}</p>
                <p className="text-blue-200 text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Online</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/20"><X className="w-4 h-4" /></button>
          </div>

          {!activeRoom ? (
            <div className="flex-1 overflow-y-auto custom-scroll">
              {rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <p className="text-4xl mb-3">💬</p>
                  <p className="font-semibold text-sm">Belum ada percakapan</p>
                  <p className="text-muted-foreground text-xs mt-1">Chat muncul setelah Anda booking hotel.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {rooms.map(room => (
                    <button key={room.id} onClick={() => setActive(room)} className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left">
                      <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-xl shrink-0">🏨</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{room.hotel?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{room.messages?.[0]?.message || 'Mulai percakapan...'}</p>
                      </div>
                      {room.unread_count > 0 && <span className="w-5 h-5 rounded-full bg-brand text-white text-xs flex items-center justify-center font-bold shrink-0">{room.unread_count}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
                {messages.length === 0 && <div className="text-center text-muted-foreground text-sm py-8"><p className="text-2xl mb-2">👋</p>Kirim pesan untuk memulai.</div>}
                {messages.map((msg, i) => {
                  const isMe = (msg.sender_id || msg.senderId) === user?.id
                  return (
                    <div key={i} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                      {!isMe && <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-xs font-bold text-brand-700 mr-2 shrink-0 mt-0.5">{msg.sender?.name?.[0]?.toUpperCase() || '?'}</div>}
                      <div className={cn('max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm', isMe ? 'bg-brand text-white rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm')}>
                        {!isMe && <p className="text-xs font-semibold mb-0.5 opacity-70">{msg.sender?.name}</p>}
                        <p className="leading-relaxed">{msg.message}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              <div className="p-3 border-t flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ketik pesan..."
                  className="flex-1 px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
                <button onClick={sendMessage} disabled={!input.trim() || sending}
                  className="p-2.5 bg-brand text-white rounded-xl hover:bg-brand-700 disabled:opacity-40 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
