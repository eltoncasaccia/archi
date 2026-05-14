import { Suspense } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NewCodeButton } from './_create'
import { NotificationBell } from '@/components/admin/NotificationBell'

type CodeStatus = 'available' | 'in_progress' | 'used' | 'expired'

interface AccessCode {
  id: string
  code: string
  session_id: string | null
  used_at: string | null
  expires_at: string | null
  created_at: string
}

interface AccessCodeRow extends AccessCode {
  status: CodeStatus
  client_name: string | null
}

function computeStatus(row: AccessCode): CodeStatus {
  if (row.used_at) return 'used'
  if (row.session_id) return 'in_progress'
  if (row.expires_at && new Date(row.expires_at) < new Date()) return 'expired'
  return 'available'
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function CodeBadge({ status }: { status: CodeStatus }) {
  const map: Record<CodeStatus, { tone: string; label: string }> = {
    available: { tone: 'ok', label: 'Disponível' },
    in_progress: { tone: 'warn', label: 'Em andamento' },
    used: { tone: 'muted', label: 'Utilizado' },
    expired: { tone: 'danger', label: 'Expirado' },
  }
  const s = map[status] ?? { tone: 'muted', label: status }
  return <span className={`oa-badge ${s.tone}`}>{s.label}</span>
}

async function AccessCodesData() {
  const supabase = await createSupabaseServerClient()
  const { data: codes } = await supabase
    .from('access_codes')
    .select('*')
    .order('created_at', { ascending: false })

  const rawRows = (codes ?? []) as AccessCode[]

  // Join client_name from sessions for used codes
  const usedSessionIds = rawRows.filter(r => r.session_id).map(r => r.session_id as string)
  let sessionMap: Record<string, string | null> = {}
  if (usedSessionIds.length > 0) {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, client_name')
      .in('id', usedSessionIds)
    if (sessions) {
      for (const s of sessions) sessionMap[s.id] = s.client_name ?? null
    }
  }

  const rows: AccessCodeRow[] = rawRows.map(r => ({
    ...r,
    status: computeStatus(r),
    client_name: r.session_id ? (sessionMap[r.session_id] ?? null) : null,
  }))

  const counts = {
    available: rows.filter(r => r.status === 'available').length,
    in_progress: rows.filter(r => r.status === 'in_progress').length,
    used: rows.filter(r => r.status === 'used').length,
    expired: rows.filter(r => r.status === 'expired').length,
  }

  return (
    <div style={{ padding: '24px 40px 64px' }}>
      {/* Summary strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        border: '1px solid var(--rule)', marginBottom: 24,
        background: 'var(--paper)',
      }}>
        {([
          { label: 'Disponíveis', value: counts.available, tone: 'ok' },
          { label: 'Em andamento', value: counts.in_progress, tone: 'warn' },
          { label: 'Utilizados', value: counts.used, tone: null },
          { label: 'Expirados', value: counts.expired, tone: 'danger' },
        ] as const).map((c, i) => (
          <div key={i} style={{
            padding: '20px 24px',
            borderRight: i < 3 ? '1px solid var(--rule)' : 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          }}>
            <div className="eyebrow">{c.label}</div>
            <div className="mono" style={{
              fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
              color: c.tone ? `var(--${c.tone})` : 'var(--ink)',
            }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="oa-card">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 0.9fr 1fr 1fr 1fr 1.4fr',
          padding: '12px 18px',
          borderBottom: '1px solid var(--rule)',
          background: 'var(--paper-2)',
        }}>
          {['Código', 'Status', 'Criado em', 'Utilizado em', 'Expira em', 'Cliente'].map((h, i) => (
            <div key={i} className="eyebrow">{h}</div>
          ))}
        </div>

        {rows.length === 0 && (
          <div style={{ padding: '32px 18px', fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>
            Nenhum código gerado ainda.
          </div>
        )}

        {rows.map((row, i) => (
          <div key={row.id} style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 0.9fr 1fr 1fr 1fr 1.4fr',
            padding: '14px 18px',
            borderTop: i === 0 ? 'none' : '1px solid var(--rule-2)',
            alignItems: 'center', fontSize: 13,
          }}>
            <div className="mono" style={{
              fontSize: 14, letterSpacing: '0.04em',
              color: row.status === 'expired' ? 'var(--muted-2)' : 'var(--ink)',
              textDecoration: row.status === 'expired' ? 'line-through' : 'none',
            }}>{row.code}</div>
            <div><CodeBadge status={row.status} /></div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(row.created_at)}</div>
            <div className="mono" style={{ fontSize: 12, color: row.used_at ? 'var(--ink-2)' : 'var(--muted-2)' }}>
              {fmtDate(row.used_at)}
            </div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(row.expires_at)}</div>
            <div style={{ fontSize: 13, color: row.client_name ? 'var(--ink-2)' : 'var(--muted-2)' }}>
              {row.client_name ?? '—'}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
        Códigos não podem ser deletados — apenas visualizados, para auditoria.
      </div>
    </div>
  )
}

export default function AccessCodesPage() {
  return (
    <div>
      {/* Static header — renders immediately */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        padding: '32px 40px 24px',
        borderBottom: '1px solid var(--rule)',
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Painel · Acesso</div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em' }}>Códigos de acesso</h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'flex-start' }}>
          <div style={{ alignSelf: 'flex-end' }}>
            <NotificationBell />
          </div>
          <NewCodeButton />
        </div>
      </div>

      {/* Dynamic data — streams in */}
      <Suspense fallback={
        <div style={{ padding: '24px 40px 64px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid var(--rule)', marginBottom: 24, background: 'var(--paper)' }}>
            {['Disponíveis', 'Utilizados', 'Expirados'].map((l, i) => (
              <div key={i} style={{ padding: '20px 24px', borderRight: i < 2 ? '1px solid var(--rule)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div className="eyebrow">{l}</div>
                <div style={{ width: 32, height: 28, background: 'var(--paper-3)', borderRadius: 2, animation: 'oaPulse 1.4s ease-in-out infinite' }} />
              </div>
            ))}
          </div>
          <div className="oa-card">
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr 1fr 1fr 1fr 1.4fr', padding: '12px 18px', borderBottom: '1px solid var(--rule)', background: 'var(--paper-2)' }}>
              {['Código', 'Status', 'Criado em', 'Utilizado em', 'Expira em', 'Cliente'].map((h, i) => (
                <div key={i} className="eyebrow">{h}</div>
              ))}
            </div>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1.4fr 0.9fr 1fr 1fr 1fr 1.4fr',
                gap: 8, padding: '14px 18px',
                borderTop: i === 0 ? 'none' : '1px solid var(--rule-2)',
                alignItems: 'center',
              }}>
                {[80, 60, 70, 70, 70, 90].map((w, j) => (
                  <div key={j} style={{ height: 13, width: w, background: 'var(--paper-3)', borderRadius: 2, animation: 'oaPulse 1.4s ease-in-out infinite', opacity: 1 - i * 0.12 }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      }>
        <AccessCodesData />
      </Suspense>
    </div>
  )
}
