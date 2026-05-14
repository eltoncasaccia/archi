'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { flushSync } from 'react-dom'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { Spinner } from '@/components/Spinner'

const Logo = () => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 10,
    fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 20,
    letterSpacing: '-0.025em',
  }}>
    <svg width={28} height={28} viewBox="0 0 64 64" fill="none">
      <path
        d="M10 30 C10 18, 20 10, 32 10 C44 10, 54 18, 54 30 C54 42, 44 50, 32 50 C28 50, 24 49.2, 20.5 47.5 L 12 52 L 15 43 C 12 39.5, 10 35, 10 30 Z"
        fill="var(--ink)"
      />
      <circle cx="40" cy="26" r="5" fill="var(--accent)" />
      <circle cx="26" cy="30" r="2.6" fill="var(--paper)" />
    </svg>
    <span style={{ color: 'var(--ink)' }}>
      Arch<span style={{ color: 'var(--accent)' }}>i</span>
    </span>
  </div>
)

const STATUS_ITEMS = [
  { label: 'API Discovery', tone: 'ok', meta: 'Latência de resposta (p99) · 184ms' },
  { label: 'Agentes de Processamento', tone: 'ok', meta: '3 ativos' },
  { label: 'Processamento de Documentos', tone: 'ok', meta: 'fila · 0' },
  { label: 'Notificações do Sistema', tone: 'ok', meta: 'operacional' },
] as const

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }))
  }, [])

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (loading || !email || !password) return

    flushSync(() => { setLoading(true) })

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        toast.error('Email ou senha incorretos.')
        setLoading(false)
        return
      }

      router.push('/admin')
      router.refresh()
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  const isDisabled = loading || !email || !password

  return (
    <div style={{
      width: '100%', minHeight: '100vh',
      display: 'grid', gridTemplateColumns: '1.1fr 1fr',
    }}>
      {/* LEFT — formulário */}
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '40px 64px',
      }}>
        <Logo />

        <form onSubmit={handleSubmit} noValidate style={{ maxWidth: 380 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Painel Interno</div>
          <h1 style={{
            margin: '0 0 8px', fontSize: 30, fontWeight: 500,
            letterSpacing: '-0.02em',
          }}>
            Portal de Gestão
          </h1>
          <p style={{ margin: '0 0 32px', color: 'var(--muted)', fontSize: 14 }}>
            Acesso restrito a usuários autorizados
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <label style={{ display: 'block' }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Email</div>
              <input
                className="oa-input"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value) }}
                placeholder="admin@empresa.com.br"
                disabled={loading}
                autoFocus
                style={{ fontFamily: 'var(--sans)' }}
              />
            </label>

            <label style={{ display: 'block' }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Senha</div>
              <input
                className="oa-input"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value) }}
                placeholder="••••••••"
                disabled={loading}
                style={{ fontFamily: 'var(--sans)', letterSpacing: '0.1em' }}
              />
            </label>

            <button
              type="submit"
              className={`oa-btn${isDisabled ? ' disabled' : ''}`}
              disabled={isDisabled}
              style={{ width: '100%', padding: '13px', marginTop: 4 }}
            >
              {loading
                ? <><Spinner size={14} color="rgba(255,255,255,0.9)" />Entrando…</>
                : 'Entrar'}
            </button>
          </div>
        </form>

        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          Para novas credenciais, contate o administrador do sistema
        </div>
      </div>

      {/* RIGHT — status do sistema */}
      <div style={{
        background: 'var(--paper-2)',
        borderLeft: '1px solid var(--rule)',
        padding: '40px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <div className="eyebrow">
          Status do sistema · {dateStr}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {STATUS_ITEMS.map((s, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 0',
              borderTop: '1px solid var(--rule)',
              borderBottom: i === STATUS_ITEMS.length - 1 ? '1px solid var(--rule)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 14 }}>{s.label}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {s.meta}
                </div>
              </div>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: s.tone === 'ok' ? 'var(--ok)' : 'var(--warn)',
                boxShadow: `0 0 0 4px ${s.tone === 'ok' ? 'var(--ok-soft)' : 'var(--warn-soft)'}`,
              }} />
            </div>
          ))}
        </div>

        <div className="mono" style={{
          fontSize: 11, color: 'var(--muted)',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>build · 1.0.0</span>
          <span>Archi · Proposal</span>
        </div>
      </div>
    </div>
  )
}
