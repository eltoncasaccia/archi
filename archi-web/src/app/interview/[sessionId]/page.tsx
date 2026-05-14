'use client'

import { useState, useEffect, useRef, useCallback, use } from 'react'
import { streamMessage, approveSession, logoutSession, getSessionResume, uploadDocument, SessionExpiredError } from '@/lib/api'
import { Spinner } from '@/components/Spinner'

const APPROVAL_RE = /\[DISCOVERY_APROVADO\][\s\S]*?\[\/DISCOVERY_APROVADO\]/

const POST_APPROVAL_STATUSES = new Set([
  'pipeline_pending', 'pipeline_running', 'discovery_generated',
  'pricing_generated', 'phases_generated', 'proposal_generated',
  'pending_review', 'proposal_sent',
])
const IDLE_MS = 30 * 60 * 1000       // 30 min → session expires
const WARNING_MS = 29 * 60 * 1000    // 29 min → show 60s countdown warning

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isApproval?: boolean
  isDocument?: boolean
  filename?: string
}

// ─── Primitives ──────────────────────────────────────────────

const Logo = () => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 18,
    letterSpacing: '-0.02em', color: 'var(--ink)',
  }}>
    <svg width={20} height={20} viewBox="0 0 22 22" fill="none">
      <path
        d="M3 11 C 3 6, 7 3, 11 3 C 15 3, 19 6, 19 11 C 19 16, 15 19, 11 19 C 9 19, 7 18, 6 17 L 3 18 L 4.5 15 C 3.5 14, 3 12.5, 3 11 Z"
        fill="var(--ink)"
      />
      <circle cx="13.5" cy="9.5" r="1.2" fill="var(--paper)" />
    </svg>
    <span>Archi</span>
  </div>
)

const Avatar = ({ role }: { role: 'user' | 'assistant' }) => (
  <div style={{
    width: 32, height: 32, flexShrink: 0, borderRadius: 2,
    background: role === 'assistant' ? 'var(--ink)' : 'var(--paper-3)',
    color: role === 'assistant' ? 'var(--paper)' : 'var(--ink)',
    display: 'grid', placeItems: 'center',
    fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500,
  }}>
    {role === 'assistant' ? 'Archi' : 'VC'}
  </div>
)

const Dot = ({ delay }: { delay: number }) => (
  <span style={{
    width: 5, height: 5, borderRadius: '50%',
    background: 'var(--muted)',
    animation: `oaDot 1.2s ${delay}ms infinite ease-in-out`,
    display: 'inline-block', margin: '0 1px',
  }} />
)

function renderText(text: string) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith('**') ? <strong key={j}>{p.slice(2, -2)}</strong> : p
    )
    return (
      <div key={i} style={{ marginTop: i > 0 ? (line.trim().startsWith('•') ? 4 : 10) : 0 }}>
        {parts}
      </div>
    )
  })
}

// ─── Bubble ──────────────────────────────────────────────────

function Bubble({ msg }: { msg: Message }) {
  const isAgent = msg.role === 'assistant'
  const displayText = msg.content.replace(APPROVAL_RE, '').trim()

  return (
    <div style={{
      display: 'flex', gap: 12,
      flexDirection: isAgent ? 'row' : 'row-reverse',
      alignItems: 'flex-end',
    }}>
      <Avatar role={msg.role} />
      <div style={{ maxWidth: '78%' }}>
        <div style={{
          padding: msg.isApproval ? '16px 18px' : '10px 14px',
          background: isAgent ? 'var(--paper-2)' : 'var(--ink)',
          color: isAgent ? 'var(--ink)' : 'var(--paper)',
          border: isAgent ? '1px solid var(--rule)' : '1px solid var(--ink)',
          borderRadius: 2,
          borderTopLeftRadius: isAgent ? 0 : 2,
          borderTopRightRadius: isAgent ? 2 : 0,
          fontSize: 14.5, lineHeight: 1.55,
          letterSpacing: '-0.005em',
        }}>
          {msg.isApproval && (
            <div className="eyebrow" style={{ color: 'var(--muted)', marginBottom: 10 }}>
              Resumo do Discovery
            </div>
          )}
          {msg.isDocument ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>📄</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{msg.filename}</span>
              <span style={{ fontSize: 11, opacity: 0.7 }}>· enviado</span>
            </div>
          ) : renderText(displayText)}
        </div>
      </div>
    </div>
  )
}

// ─── Expired overlay ─────────────────────────────────────────

function ExpiredOverlay({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(var(--paper-rgb, 255,255,255), 0.96)',
      backdropFilter: 'blur(4px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{
        fontFamily: 'var(--sans)', textAlign: 'center',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Sessão encerrada
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          Sua sessão expirou por inatividade.
        </div>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>
          Para iniciar uma nova conversa, use um código de acesso.
        </div>
      </div>
      <button className="oa-btn accent" onClick={onGoHome} style={{ marginTop: 8 }}>
        Voltar ao início
      </button>
    </div>
  )
}

// ─── Idle warning banner ──────────────────────────────────────

function IdleWarning({ secondsLeft, onContinue }: { secondsLeft: number; onContinue: () => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 40, display: 'flex', alignItems: 'center', gap: 16,
      background: 'var(--ink)', color: 'var(--paper)',
      padding: '12px 20px', borderRadius: 2,
      fontFamily: 'var(--sans)', fontSize: 13,
      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
    }}>
      <span>Sessão expira em <strong>{secondsLeft}s</strong> por inatividade.</span>
      <button
        onClick={onContinue}
        style={{
          background: 'var(--paper)', color: 'var(--ink)',
          border: 'none', borderRadius: 2,
          padding: '6px 14px', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'var(--sans)',
        }}
      >
        Continuar
      </button>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────

export default function InterviewPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)

  const [messages, setMessages] = useState<Message[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [input, setInput] = useState('')
  const [approved, setApproved] = useState(false)
  const [approving, setApproving] = useState(false)
  const [inputDisabled, setInputDisabled] = useState(false)
  const [showApproval, setShowApproval] = useState(false)
  const [initiated, setInitiated] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [idleWarning, setIdleWarning] = useState(false)
  const [warningCountdown, setWarningCountdown] = useState(60)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [docError, setDocError] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const sendingRef = useRef(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const shortId = sessionId.slice(0, 8)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText, streaming])

  // ── Idle timer ──────────────────────────────────────────────

  const expireSession = useCallback(async () => {
    setIdleWarning(false)
    setSessionExpired(true)
    setInputDisabled(true)
    await logoutSession(sessionId)
  }, [sessionId])

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    setIdleWarning(false)

    warningTimerRef.current = setTimeout(() => {
      setIdleWarning(true)
      setWarningCountdown(60)
      countdownRef.current = setInterval(() => {
        setWarningCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, WARNING_MS)

    idleTimerRef.current = setTimeout(expireSession, IDLE_MS)
  }, [expireSession])

  // Start idle timer on mount; clear on unmount
  useEffect(() => {
    resetIdleTimer()
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [resetIdleTimer])

  // ── Session expired handler ─────────────────────────────────

  const handleExpired = useCallback(() => {
    setSessionExpired(true)
    setInputDisabled(true)
    setIdleWarning(false)
  }, [])

  // ── Streaming ───────────────────────────────────────────────

  const handleStream = useCallback(async (content: string, isInitial = false) => {
    if (sendingRef.current) return
    sendingRef.current = true

    if (!isInitial) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'user', content,
      }])
    }

    setStreaming(true)
    setStreamingText('')
    let accumulated = ''

    try {
      const { fullText, limitReached } = await streamMessage(sessionId, content, (delta) => {
        accumulated += delta
        setStreamingText(accumulated)
      })

      const isApproval = APPROVAL_RE.test(fullText)
      const safeContent = fullText.trim() || 'Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?'
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant', content: safeContent, isApproval,
      }])
      setStreamingText('')
      setStreaming(false)
      if (isApproval) setShowApproval(true)
      if (limitReached) setInputDisabled(true)
      resetIdleTimer()
    } catch (err) {
      setStreamingText('')
      setStreaming(false)
      if (err instanceof SessionExpiredError) {
        handleExpired()
      } else {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(), role: 'assistant',
          content: 'Ocorreu um erro de conexão. Tente novamente.',
        }])
      }
    }

    sendingRef.current = false
  }, [sessionId, resetIdleTimer, handleExpired])

  // Load existing history on mount (re-entry flow)
  useEffect(() => {
    let cancelled = false
    getSessionResume(sessionId)
      .then(resume => {
        if (cancelled) return
        if (resume.messages.length > 0) {
          setMessages(resume.messages.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            isApproval: m.role === 'assistant' && APPROVAL_RE.test(m.content),
          })))
          if (resume.has_pending_approval) setShowApproval(true)
          if (POST_APPROVAL_STATUSES.has(resume.status)) {
            setApproved(true)
            setInputDisabled(true)
          }
          if (resume.status === 'pipeline_error') setInputDisabled(true)
        }
      })
      .catch(() => { /* fall through to greeting */ })
      .finally(() => { if (!cancelled) setHistoryLoaded(true) })
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-trigger initial greeting only when there is no history
  useEffect(() => {
    if (!historyLoaded) return
    if (messages.length > 0) { setInitiated(true); return }
    if (initiated) return
    setInitiated(true)
    handleStream('Olá', true)
  }, [historyLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ─────────────────────────────────────────────────

  async function handleSend() {
    const text = input.trim()
    if (!text || streaming || inputDisabled) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    resetIdleTimer()
    await handleStream(text)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  async function handleApprove() {
    if (approving) return
    setApproving(true)
    setShowApproval(false)
    setInputDisabled(true)

    try {
      await approveSession(sessionId)
      setApproved(true)
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: 'Perfeito! Seu levantamento foi registrado. A proposta será preparada e enviada para o seu email em breve.',
      }])
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        handleExpired()
      } else {
        setInputDisabled(false)
        setShowApproval(true)
        setApproving(false)
      }
    }
  }

  async function handleLogout() {
    await logoutSession(sessionId)
    window.location.href = '/'
  }

  async function handleFile(file: File) {
    if (inputDisabled || streaming || uploadingDoc) return
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.docx')) {
      setDocError('Formato não suportado. Envie um PDF ou DOCX.')
      return
    }
    setDocError(null)
    setUploadingDoc(true)
    try {
      const { filename, extracted_text } = await uploadDocument(sessionId, file)
      const fullContent = `[Documento anexado: ${filename}]\n\n${extracted_text}`
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'user', content: fullContent,
        isDocument: true, filename,
      }])
      resetIdleTimer()
      await handleStream(fullContent, true)
    } catch (e) {
      if (e instanceof SessionExpiredError) {
        handleExpired()
      } else {
        setDocError(e instanceof Error ? e.message : 'Erro ao processar o documento.')
      }
    } finally {
      setUploadingDoc(false)
    }
  }

  const lastApprovalIdx = showApproval
    ? messages.findLastIndex(m => m.isApproval)
    : -1

  return (
    <div
      style={{
        width: '100%', height: '100vh',
        display: 'flex', flexDirection: 'column',
        background: 'var(--paper)',
        position: 'relative',
      }}
      onDragEnter={(e) => {
        e.preventDefault()
        dragCounter.current++
        if (!inputDisabled && !approved) setIsDragging(true)
      }}
      onDragLeave={() => {
        dragCounter.current--
        if (dragCounter.current === 0) setIsDragging(false)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        dragCounter.current = 0
        setIsDragging(false)
        const files = Array.from(e.dataTransfer.files)
        if (files.length === 0) return
        ;(async () => { for (const f of files) await handleFile(f) })()
      }}
    >
      {sessionExpired && <ExpiredOverlay onGoHome={() => { window.location.href = '/' }} />}
      {idleWarning && !sessionExpired && (
        <IdleWarning secondsLeft={warningCountdown} onContinue={resetIdleTimer} />
      )}

      {/* HEADER */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 28px',
        borderBottom: '1px solid var(--rule)',
        background: 'var(--paper)',
        flexShrink: 0,
      }}>
        <Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: streaming ? 'var(--warn)' : 'var(--ok)',
              boxShadow: streaming
                ? '0 0 0 3px var(--warn-soft)'
                : '0 0 0 3px var(--ok-soft)',
            }} />
            <span>{streaming ? 'Digitando…' : 'Conectado'}</span>
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted-2)' }}>
            sess · {shortId}
          </div>
          {!approved && !sessionExpired && (
            <button
              onClick={handleLogout}
              style={{
                background: 'transparent', border: '1px solid var(--rule)',
                borderRadius: 2, padding: '5px 12px',
                fontSize: 12, color: 'var(--muted)', cursor: 'pointer',
                fontFamily: 'var(--sans)', letterSpacing: '-0.01em',
              }}
            >
              Sair
            </button>
          )}
        </div>
      </header>

      {/* CHAT BODY */}
      <main style={{
        flex: 1, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}>
        {isDragging && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.04)',
            border: '2px dashed var(--ink)',
            borderRadius: 8, zIndex: 20,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            pointerEvents: 'none',
          }}>
            <span style={{ fontSize: 32 }}>📄</span>
            <span style={{ fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>
              Solte o arquivo aqui
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>PDF ou DOCX</span>
          </div>
        )}
        <div style={{
          flex: 1, width: '100%', maxWidth: 720,
          padding: '32px 24px 16px',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          {messages.map((msg, i) => (
            <div key={msg.id}>
              <Bubble msg={msg} />
              {i === lastApprovalIdx && (
                <div style={{ marginLeft: 44, marginTop: 12, display: 'flex', gap: 10 }}>
                  <button
                    className={`oa-btn accent${approving ? ' disabled' : ''}`}
                    onClick={handleApprove}
                    disabled={approving}
                  >
                    {approving
                      ? <><Spinner color="rgba(255,255,255,0.9)" />Registrando…</>
                      : <>Confirmar e gerar proposta <span style={{ fontSize: 14 }}>→</span></>}
                  </button>
                  <button
                    className="oa-btn ghost"
                    onClick={() => {
                      setShowApproval(false)
                      setInput('Quero ajustar algo: ')
                      textareaRef.current?.focus()
                    }}
                  >
                    Quero ajustar algo
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Streaming bubble */}
          {streaming && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <Avatar role="assistant" />
              <div style={{
                padding: '10px 14px',
                background: 'var(--paper-2)',
                border: '1px solid var(--rule)',
                borderRadius: 2, borderTopLeftRadius: 0,
                fontSize: 14.5, lineHeight: 1.55,
                letterSpacing: '-0.005em',
                maxWidth: '78%',
              }}>
                {streamingText
                  ? renderText(streamingText.replace(APPROVAL_RE, '').trim())
                  : (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <Dot delay={0} /><Dot delay={150} /><Dot delay={300} />
                      <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>digitando</span>
                    </div>
                  )}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* COMPOSER */}
        <div style={{
          width: '100%', maxWidth: 720,
          padding: '12px 24px 28px',
          flexShrink: 0,
        }}>
          {approved ? (
            <div style={{
              textAlign: 'center', padding: '16px',
              color: 'var(--muted)', fontSize: 13,
              borderTop: '1px solid var(--rule)',
            }}>
              Levantamento concluído · Proposta em preparação
            </div>
          ) : (
            <>
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 10,
                background: 'var(--paper)',
                border: '1px solid var(--rule)',
                borderRadius: 2, padding: 8,
                opacity: inputDisabled ? 0.5 : 1,
              }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={inputDisabled || streaming || uploadingDoc}
                  title="Anexar documento (PDF ou DOCX)"
                  style={{
                    background: 'transparent', border: 0, cursor: 'pointer',
                    padding: '10px 8px', flexShrink: 0, fontSize: 18, lineHeight: 1,
                    opacity: inputDisabled || streaming || uploadingDoc ? 0.4 : 0.6,
                    transition: 'opacity 0.15s',
                  }}
                >
                  📎
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? [])
                    e.target.value = ''
                    if (files.length === 0) return
                    ;(async () => { for (const f of files) await handleFile(f) })()
                  }}
                />
                <textarea
                  ref={textareaRef}
                  placeholder={
                    inputDisabled ? 'Sessão encerrada'
                    : uploadingDoc ? 'Lendo documento…'
                    : 'Escreva sua resposta…'
                  }
                  value={input}
                  onChange={autoResize}
                  onKeyDown={handleKeyDown}
                  disabled={inputDisabled || streaming || uploadingDoc}
                  rows={1}
                  style={{
                    flex: 1, resize: 'none', border: 0, outline: 0,
                    background: 'transparent', padding: '10px 12px',
                    fontSize: 15, color: 'var(--ink)', fontFamily: 'var(--sans)',
                    lineHeight: 1.5, maxHeight: 160, overflowY: 'auto',
                  }}
                />
                <button
                  className={`oa-btn accent sm${!input.trim() || streaming || inputDisabled || uploadingDoc ? ' disabled' : ''}`}
                  onClick={handleSend}
                  disabled={!input.trim() || streaming || inputDisabled || uploadingDoc}
                  style={{ padding: '10px 14px', flexShrink: 0 }}
                >
                  {streaming || uploadingDoc
                    ? <Spinner color="rgba(255,255,255,0.9)" size={13} />
                    : <>Enviar <span style={{ fontSize: 13 }}>↵</span></>}
                </button>
              </div>
              {docError && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--error, #c0392b)', paddingLeft: 4 }}>
                  {docError}
                </div>
              )}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginTop: 8, fontSize: 11, color: 'var(--muted-2)',
              }}>
                <span>Enter para enviar · Shift+Enter para nova linha · 📎 para anexar PDF/DOCX</span>
                <span className="mono">criptografado</span>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
