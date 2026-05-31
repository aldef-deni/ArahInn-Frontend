import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageCircle, X, Send, Headphones, Loader2, User } from 'lucide-react'
import { chatApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'

/**
 * SupportChatWidget — floating chat button (bottom-right) untuk customer
 * Chat langsung dengan tim customer service Arahinn (tidak butuh booking).
 */
export default function SupportChatWidget() {
  const { t } = useTranslation()
  const { token, user } = useAuthStore()
  const [open, setOpen]         = useState(false)
  const [room, setRoom]         = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText]         = useState('')
  const [sending, setSending]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const scrollRef               = useRef(null)
  const pollRef                 = useRef(null)

  const isCustomer = !!user && (!user.role || user.role === 'user')

  const loadRoom = async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await chatApi.supportMyRoom()
      const r = res.data?.data
      setRoom(r)
      const msgRes = await chatApi.messages(r.id)
      setMessages(msgRes.data?.data || [])
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }

  // Open chat → load room + start poll
  useEffect(() => {
    if (!open || !isCustomer) return
    loadRoom()
    pollRef.current = setInterval(async () => {
      if (!room?.id) return
      try {
        const res = await chatApi.messages(room.id)
        const next = res.data?.data || []
        setMessages(prev => prev.length === next.length ? prev : next)
      } catch {}
    }, 4000)
    return () => clearInterval(pollRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, room?.id])

  // Auto-scroll to bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' })
  }, [messages.length])

  const send = async () => {
    const msg = text.trim()
    if (!msg || !room || sending) return
    setSending(true)
    try {
      const res = await chatApi.send(room.id, { message: msg })
      setMessages(prev => [...prev, res.data?.data])
      setText('')
    } catch {} finally { setSending(false) }
  }

  if (!isCustomer) return null

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full shadow-lg shadow-orange-500/40 transition-all hover:-translate-y-0.5"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-semibold text-sm">{t('supportChat.liveChat')}</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-2.5rem))] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Headphones className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{t('supportChat.title')}</p>
                <p className="text-[11px] text-blue-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  {t('supportChat.onlineStatus')}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          {!token ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
              <MessageCircle className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">{t('supportChat.loginPrompt')}</p>
              <p className="text-xs text-slate-500">{t('supportChat.loginPromptSub')}</p>
              <a href="/login" className="mt-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                {t('supportChat.signIn')}
              </a>
            </div>
          ) : loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-2.5">
                {/* Welcome message */}
                <div className="flex gap-2 items-end">
                  <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <Headphones className="w-3.5 h-3.5 text-orange-600" />
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-2xl rounded-bl-md px-3.5 py-2.5 shadow-sm shadow-orange-200 max-w-[78%]">
                    <p className="text-sm">
                      {t('supportChat.welcomeMessage', { name: user?.name?.split(' ')[0] || '' })}
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
                          : <Headphones className="w-3.5 h-3.5 text-orange-600" />}
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
                    placeholder={t('supportChat.placeholder')}
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
      )}
    </>
  )
}
