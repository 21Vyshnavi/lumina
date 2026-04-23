import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, Sparkles, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api, getStreamUrl } from '../services/api'
import type { Message, ChatSession } from '../types'
import clsx from 'clsx'
import toast from 'react-hot-toast'

interface StreamingMessage {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

export default function ChatPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<StreamingMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(sessionId)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages])

  useEffect(() => {
    setCurrentSessionId(sessionId)
    if (sessionId) {
      loadSession(sessionId)
    } else {
      setMessages([])
    }
  }, [sessionId])

  const loadSession = async (id: string) => {
    try {
      const { data }: { data: ChatSession } = await api.get(`/chat/sessions/${id}`)
      setMessages(data.messages?.map((m) => ({ role: m.role, content: m.content })) || [])
    } catch {
      toast.error('Failed to load session')
    }
  }

  const sendMessage = useCallback(async () => {
    const content = input.trim()
    if (!content || isStreaming) return

    setInput('')
    setIsStreaming(true)
    setMessages((prev) => [...prev, { role: 'user', content }])
    setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }])

    abortRef.current = new AbortController()

    try {
      const token = localStorage.getItem('lumina_token')
      const response = await fetch(getStreamUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, session_id: currentSessionId }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) throw new Error('Stream request failed')

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'session_id' && !currentSessionId) {
              setCurrentSessionId(event.session_id)
              navigate(`/chat/${event.session_id}`, { replace: true })
            } else if (event.type === 'chunk') {
              setMessages((prev) => {
                const next = [...prev]
                const last = next[next.length - 1]
                if (last?.role === 'assistant') {
                  next[next.length - 1] = { ...last, content: last.content + event.content }
                }
                return next
              })
            } else if (event.type === 'done') {
              setMessages((prev) => {
                const next = [...prev]
                const last = next[next.length - 1]
                if (last?.role === 'assistant') {
                  next[next.length - 1] = { ...last, streaming: false }
                }
                return next
              })
            } else if (event.type === 'error') {
              toast.error(event.message || 'AI error')
            }
          } catch {}
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        toast.error('Failed to send message')
        setMessages((prev) => prev.filter((m) => !m.streaming))
      }
    } finally {
      setIsStreaming(false)
    }
  }, [input, isStreaming, currentSessionId, navigate])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Empty state */}
      {isEmpty && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-brand-600/20 flex items-center justify-center">
            <Sparkles size={28} className="text-brand-400" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-white mb-1">Lumina AI</h1>
            <p className="text-gray-500 text-sm">Ask me anything. I'll help you think it through.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 max-w-md w-full px-4">
            {[
              'Explain quantum entanglement simply',
              'Review my code for bugs',
              'Summarize recent AI breakthroughs',
              'Help me write a cover letter',
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => { setInput(prompt); textareaRef.current?.focus() }}
                className="text-left text-xs text-gray-400 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-lg p-3 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {!isEmpty && (
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={clsx('flex gap-3 animate-slide-up', msg.role === 'user' && 'flex-row-reverse')}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={16} className="text-brand-400" />
                </div>
              )}
              <div
                className={clsx(
                  'max-w-2xl rounded-2xl px-4 py-3 text-sm',
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-sm'
                    : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-sm'
                )}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose-chat">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    {msg.streaming && (
                      <span className="inline-flex gap-1 ml-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-pulse-dot"
                            style={{ animationDelay: `${i * 0.16}s` }}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-800 bg-gray-950 p-4">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Lumina..."
            className="input-field resize-none max-h-32 overflow-y-auto leading-relaxed"
            style={{ height: 'auto', minHeight: '42px' }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 128) + 'px'
            }}
            disabled={isStreaming}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="btn-primary px-3 py-2.5 flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-center text-xs text-gray-700 mt-2">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  )
}
