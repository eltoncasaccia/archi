'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { flushSync } from 'react-dom'
import { validateCode } from '@/lib/api'
import { Spinner } from '@/components/Spinner'

function formatCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9-]/g, '')
}

const Logo = ({ dark = false }: { dark?: boolean }) => {
  const ink = dark ? 'var(--paper)' : 'var(--ink)'
  const paper = dark ? 'var(--ink)' : 'var(--paper)'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 20,
      letterSpacing: '-0.025em',
    }}>
      <svg width={28} height={28} viewBox="0 0 64 64" fill="none">
        <path
          d="M10 30 C10 18, 20 10, 32 10 C44 10, 54 18, 54 30 C54 42, 44 50, 32 50 C28 50, 24 49.2, 20.5 47.5 L 12 52 L 15 43 C 12 39.5, 10 35, 10 30 Z"
          fill={ink}
        />
        <circle cx="40" cy="26" r="5" fill="var(--accent)" />
        <circle cx="26" cy="30" r="2.6" fill={paper} />
      </svg>
      <span style={{ color: ink }}>
        Arch<span style={{ color: 'var(--accent)' }}>i</span>
      </span>
    </div>
  )
}

export default function AccessPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isDisabled = loading || code.length === 0

  async function submit() {
    if (loading || code.length === 0) return

    // flushSync garante que o browser repinta o botão "Verificando…"
    // ANTES do fetch começar — necessário porque React 18 batcha
    // setLoading(true) junto com o await e o browser nunca vê o estado
    flushSync(() => {
      setLoading(true)
      setError(null)
    })

    try {
      const data = await validateCode(code)
      if (data.valid) {
        router.push(`/interview/${data.session_id}`)
      } else {
        setError(data.error ?? 'Código inválido. Verifique e tente novamente.')
        setLoading(false)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  const hasError = error !== null

  return (
    <div style={{
      width: '100%', minHeight: '100vh',
      display: 'grid', gridTemplateColumns: '1fr 1fr',
    }}>
      {/* LEFT — painel de contexto */}
      <div style={{
        background: 'var(--ink)',
        color: 'var(--paper)',
        padding: '48px 56px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <Logo dark />

        <div>
          <div className="eyebrow" style={{ color: 'var(--muted-2)', marginBottom: 24 }}>
            Discovery → Proposta · Automatizado
          </div>
          <h2 style={{
            margin: 0, fontSize: 44, lineHeight: 1.05, fontWeight: 400,
            letterSpacing: '-0.025em', maxWidth: 460,
          }}>
            Conte sobre o seu projeto.<br />
            <span style={{ color: 'var(--muted-2)' }}>
              Em 15 minutos, devolvemos uma proposta sob medida.
            </span>
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { step: '01', title: 'Entrevista guiada por IA', sub: 'conversa estruturada de discovery' },
            { step: '02', title: 'Acesso por código exclusivo', sub: 'gerado pela equipe — uso único por cliente' },
            { step: '03', title: 'Proposta entregue por email', sub: 'sem reunião ou agendamento prévio' },
          ].map(({ step, title, sub }) => (
            <div key={step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
                color: 'var(--accent)', marginTop: 2, flexShrink: 0,
              }}>{step}</span>
              <div style={{ fontSize: 13 }}>
                <div style={{ color: 'var(--paper)', marginBottom: 2 }}>{title}</div>
                <div style={{ color: 'var(--muted-2)', fontFamily: 'var(--mono)', fontSize: 11 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — formulário */}
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 80px', background: 'var(--paper)',
      }}>
        <form onSubmit={(e) => { e.preventDefault(); submit() }} noValidate style={{ maxWidth: 380, width: '100%' }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Acesso · Cliente</div>
          <h1 style={{
            margin: '0 0 12px', fontSize: 32, fontWeight: 500,
            letterSpacing: '-0.02em', lineHeight: 1.15,
          }}>
            Bem-vindo.
          </h1>
          <p style={{ margin: '0 0 36px', color: 'var(--muted)', fontSize: 15, lineHeight: 1.55 }}>
            Digite o código de acesso enviado pelo responsável do projeto para começar a entrevista.
          </p>

          <label style={{ display: 'block' }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Código de acesso</div>
            <input
              className="oa-input"
              placeholder="Ex: ORC-2026-042"
              value={code}
              onChange={(e) => {
                setCode(formatCode(e.target.value.toUpperCase()))
                if (error) setError(null)
              }}
              disabled={loading}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              style={{
                fontSize: 18, letterSpacing: '0.1em',
                borderColor: hasError ? 'var(--danger)' : undefined,
              }}
            />
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
              Digite exatamente como recebeu, incluindo hífens
            </div>
          </label>

          {hasError && (
            <div style={{
              marginTop: 12, padding: '10px 12px',
              background: 'var(--danger-soft)',
              borderLeft: '2px solid var(--danger)',
              fontSize: 13, color: 'oklch(0.42 0.14 25)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`oa-btn accent${isDisabled ? ' disabled' : ''}`}
            disabled={isDisabled}
            style={{ width: '100%', marginTop: 24, padding: '14px 16px', fontSize: 15 }}
          >
            {loading ? <><Spinner color="rgba(255,255,255,0.9)" />Verificando…</> : <>Acessar <span style={{ fontSize: 16, lineHeight: 1 }}>→</span></>}
          </button>

          <div style={{
            marginTop: 56, paddingTop: 20,
            borderTop: '1px solid var(--rule)',
            fontSize: 12, color: 'var(--muted)',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>Acesso por código — sem cadastro ou senha</span>
            <span className="mono">v1.0.0</span>
          </div>
        </form>
      </div>
    </div>
  )
}
