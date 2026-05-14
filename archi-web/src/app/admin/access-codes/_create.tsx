'use client'

import { useState } from 'react'
import { flushSync } from 'react-dom'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { Spinner } from '@/components/Spinner'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function getToken(): Promise<string | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

export function NewCodeButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function handleOpen() {
    setOpen(true)
    setGeneratedCode(null)
    setExpiresAt('')
    setCopied(false)
  }

  function handleClose() {
    setOpen(false)
    if (generatedCode) router.refresh()
  }

  async function handleGenerate() {
    if (loading) return
    flushSync(() => { setLoading(true) })
    try {
      const token = await getToken()
      const body: Record<string, unknown> = {}
      if (expiresAt) {
        // Convert pt-BR dd/mm/aaaa to ISO
        const parts = expiresAt.split('/')
        if (parts.length === 3) {
          const iso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T23:59:59Z`
          body.expires_at = iso
        }
      }
      if (!token) throw new Error('sem sessão')
      const res = await fetch(`${API_URL}/admin/access-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}))
        throw new Error(`HTTP ${res.status}: ${detail?.detail ?? ''}`)
      }
      const data = await res.json()
      setGeneratedCode(data.code)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      toast.error(`Falha ao gerar código. ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!generatedCode) return
    await navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button className="oa-btn accent sm" onClick={handleOpen}>
        + Gerar novo código
      </button>

      {open && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(21, 17, 13, 0.45)',
            display: 'grid', placeItems: 'center',
            zIndex: 100,
          }}
          onClick={handleClose}
        >
          <div
            className="oa-card"
            style={{
              width: 460, padding: '28px 28px 24px',
              background: 'var(--paper)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="eyebrow" style={{ marginBottom: 8 }}>Novo código</div>
            <h3 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 500, letterSpacing: '-0.01em' }}>
              {generatedCode ? 'Código gerado' : 'Gerar código de acesso'}
            </h3>

            {!generatedCode ? (
              <>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Data de expiração (opcional)</div>
                <input
                  className="oa-input"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                  placeholder="dd/mm/aaaa  ·  vazio = sem expiração"
                  style={{ fontFamily: 'var(--sans)' }}
                />
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                  Sem preenchimento, o código não expira até ser utilizado.
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end' }}>
                  <button className="oa-btn ghost" onClick={handleClose}>Cancelar</button>
                  <button
                    className="oa-btn accent"
                    onClick={handleGenerate}
                    disabled={loading}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    {loading && <Spinner size={14} color="rgba(255,255,255,0.9)" />}
                    {loading ? 'Gerando…' : 'Gerar'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  padding: '20px',
                  background: 'var(--ink)',
                  color: 'var(--paper)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 16,
                }}>
                  <div className="mono" style={{ fontSize: 22, letterSpacing: '0.08em', fontWeight: 500 }}>
                    {generatedCode}
                  </div>
                  <button
                    className="oa-btn ghost sm"
                    onClick={handleCopy}
                    style={{
                      color: 'var(--paper)',
                      borderColor: 'rgba(255,255,255,0.3)',
                      background: 'transparent',
                    }}
                  >
                    {copied ? 'Copiado ✓' : 'Copiar ⎘'}
                  </button>
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>
                  Envie este código para o cliente. Ele só pode ser usado uma vez.
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end' }}>
                  <button className="oa-btn" onClick={handleClose}>Concluir</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
