'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, X, Send, Loader2, ShoppingBag } from 'lucide-react'
import { client } from '@/config/client'

type Message = { role: 'user' | 'assistant'; content: string }

const ACCENT = client.colors.primary

export default function AiAssistant() {
  const [enabled, setEnabled]   = useState(false)
  const [open,    setOpen]      = useState(false)
  const [input,   setInput]     = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading,  setLoading]  = useState(false)
  const [checked,  setChecked]  = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/ai/status')
      .then(r => r.json())
      .then(d => { setEnabled(!!d.enabled); setChecked(true) })
      .catch(() => setChecked(true))
  }, [])

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role:    'assistant',
        content: `Hi! 👋 I'm your shopping assistant for ${client.name}. Ask me anything — products, prices, delivery, returns!`,
      }])
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const updated: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(updated)
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: updated }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: data.reply ?? "Sorry, I couldn't respond right now. Please try again.",
      }])
    } catch {
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: "Something went wrong. Please try again.",
      }])
    } finally {
      setLoading(false)
    }
  }

  if (!checked || !enabled) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">

      {/* Chat panel */}
      {open && (
        <div className="w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ height: '480px', maxHeight: 'calc(100vh - 100px)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 text-white shrink-0"
            style={{ background: ACCENT }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <Bot size={15} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold leading-none">Shopping Assistant</p>
                <p className="text-[10px] opacity-70 mt-0.5">{client.name}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="opacity-70 hover:opacity-100">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 shrink-0 mt-0.5"
                    style={{ backgroundColor: `${ACCENT}20` }}>
                    <Bot size={12} style={{ color: ACCENT }} />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'text-white rounded-br-sm'
                      : 'bg-white text-gray-700 shadow-sm rounded-bl-sm border border-gray-100'
                  }`}
                  style={msg.role === 'user' ? { backgroundColor: ACCENT } : {}}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 shrink-0"
                  style={{ backgroundColor: `${ACCENT}20` }}>
                  <Bot size={12} style={{ color: ACCENT }} />
                </div>
                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                  <span className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested prompts — shown until first user message */}
          {messages.filter(m => m.role === 'user').length === 0 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2 bg-gray-50 shrink-0">
              {['What\'s on sale?', 'Delivery info', 'Return policy'].map(q => (
                <button key={q} onClick={() => { setInput(q); setTimeout(handleSend, 0) }}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-gray-400 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-100 bg-white flex gap-2 shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Ask me anything…"
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-50 hover:opacity-90 transition-opacity shrink-0"
              style={{ backgroundColor: ACCENT }}
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform"
        style={{ backgroundColor: ACCENT }}
        aria-label="Open shopping assistant"
      >
        {open ? <X size={22} /> : <ShoppingBag size={22} />}
      </button>
    </div>
  )
}
