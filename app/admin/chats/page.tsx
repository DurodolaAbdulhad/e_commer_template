'use client'

import { useEffect, useState, useRef } from 'react'
import { MessageCircle, Send, User, Bot, UserCheck, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { useAdmin } from '@/hooks/useAdmin'

const ACCENT = '#e84c3d'

interface Conversation {
  id: string
  platform: 'whatsapp' | 'instagram'
  platform_user_id: string
  mode: 'ai' | 'human'
  customer_name: string | null
  last_message_at: string
  last_message?: string
}

interface Message {
  id: string
  role: 'customer' | 'agent' | 'human'
  content: string
  created_at: string
}

export default function ChatsPage() {
  const { token } = useAdmin()
  const [convs, setConvs]         = useState<Conversation[]>([])
  const [activeId, setActiveId]   = useState<string | null>(null)
  const [messages, setMessages]   = useState<Message[]>([])
  const [draft, setDraft]         = useState('')
  const [sending, setSending]     = useState(false)
  const [loading, setLoading]     = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function loadConversations() {
    try {
      const res = await fetch('/api/admin/chats', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setConvs(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  async function loadMessages(id: string) {
    try {
      const res = await fetch(`/api/admin/chats/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setMessages(await res.json())
    } catch { /* ignore */ }
  }

  useEffect(() => { loadConversations() }, [])

  useEffect(() => {
    if (!activeId) return
    loadMessages(activeId)
    const iv = setInterval(() => loadMessages(activeId), 8000)
    return () => clearInterval(iv)
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!draft.trim() || !activeId || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/chats/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationId: activeId, text: draft.trim() }),
      })
      if (!res.ok) throw new Error('Send failed')
      setDraft('')
      await loadMessages(activeId)
      await loadConversations()
    } catch (e: any) {
      toast.error(e.message || 'Failed to send')
    } finally { setSending(false) }
  }

  async function toggleMode(id: string, current: 'ai' | 'human') {
    const next = current === 'ai' ? 'human' : 'ai'
    try {
      await fetch(`/api/admin/chats/${id}/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode: next }),
      })
      setConvs(c => c.map(x => x.id === id ? { ...x, mode: next } : x))
      toast.success(next === 'human' ? 'Took over — AI is paused' : 'Returned to AI agent')
    } catch { toast.error('Failed to switch mode') }
  }

  const active = convs.find(c => c.id === activeId)

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Conversation list */}
      <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-sm font-bold text-gray-800">DM Chats</h1>
          <button onClick={loadConversations} className="text-gray-400 hover:text-gray-600 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-xs text-gray-400 px-4 py-6 text-center">Loading…</p>
          ) : convs.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-6 text-center">No conversations yet</p>
          ) : convs.map(c => (
            <button key={c.id} onClick={() => setActiveId(c.id)}
              className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
              style={{ backgroundColor: activeId === c.id ? '#fef2f2' : undefined }}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  c.platform === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                }`}>{c.platform === 'whatsapp' ? 'WA' : 'IG'}</span>
                <span className="text-xs font-medium text-gray-700 truncate flex-1">
                  {c.customer_name ?? c.platform_user_id.slice(-8)}
                </span>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.mode === 'ai' ? 'bg-blue-400' : 'bg-orange-400'}`} title={c.mode === 'ai' ? 'AI' : 'Human'} />
              </div>
              {c.last_message && (
                <p className="text-[10px] text-gray-400 truncate">{c.last_message}</p>
              )}
              <p className="text-[9px] text-gray-300 mt-0.5">
                {formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true })}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat thread */}
      <div className="flex-1 flex flex-col">
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
            <MessageCircle size={40} />
            <p className="text-sm mt-2">Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <p className="text-sm font-semibold text-gray-700">
                  {active.customer_name ?? active.platform_user_id}
                </p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  active.platform === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                }`}>{active.platform}</span>
              </div>
              <button
                onClick={() => toggleMode(active.id, active.mode)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors"
                style={active.mode === 'human'
                  ? { borderColor: '#f97316', color: '#f97316', backgroundColor: '#fff7ed' }
                  : { borderColor: ACCENT,   color: ACCENT,   backgroundColor: '#fff' }}>
                {active.mode === 'human' ? <><Bot size={12} /> Return to AI</> : <><UserCheck size={12} /> Take Over</>}
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'customer' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    m.role === 'customer'
                      ? 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      : m.role === 'human'
                        ? 'bg-orange-500 text-white rounded-br-sm'
                        : 'bg-blue-500 text-white rounded-br-sm'
                  }`}>
                    {m.role !== 'customer' && (
                      <p className="text-[9px] opacity-70 mb-0.5">{m.role === 'human' ? 'You' : 'AI Agent'}</p>
                    )}
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {active.mode === 'human' && (
              <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type a message…"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-400"
                />
                <button onClick={handleSend} disabled={sending || !draft.trim()}
                  className="px-3 py-2 rounded-xl text-white disabled:opacity-50"
                  style={{ backgroundColor: ACCENT }}>
                  <Send size={14} />
                </button>
              </div>
            )}
            {active.mode === 'ai' && (
              <div className="px-4 py-2 border-t border-gray-100">
                <p className="text-[10px] text-blue-500 text-center">AI is handling this conversation — click "Take Over" to reply manually</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
