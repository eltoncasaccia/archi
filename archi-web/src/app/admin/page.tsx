import { Suspense } from 'react'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { NotificationBell } from '@/components/admin/NotificationBell'

function relativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return `há ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `há ${hrs} h`
  return `há ${Math.floor(hrs / 24)} d`
}

function todayStart(): string {
  // Brazil is UTC-3 (no DST since 2019). Midnight SP = 03:00 UTC.
  const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  return `${dateStr}T03:00:00.000Z`
}

function greeting(): string {
  const h = parseInt(
    new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false }),
    10,
  )
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

// Async sub-component — only this suspends
async function DashboardData() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [pending, sentToday, totalSessions, pipelineErrors, proposals, notifications] =
    await Promise.all([
      supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
      supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('status', 'sent').gte('sent_at', todayStart()),
      supabase.from('sessions').select('id', { count: 'exact', head: true }),
      supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('status', 'pipeline_error'),
      supabase.from('proposals').select('id, client_name, client_email, status, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('notifications').select('id, type, message, read, created_at, session_id').eq('read', false).order('created_at', { ascending: false }).limit(3),
    ])

  const meta = user?.user_metadata as Record<string, string> | undefined
  const rawName = meta?.full_name ?? meta?.name ?? ''
  const firstName = rawName.split(/[\s._]/)[0]
  const displayName = firstName
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
    : (user?.email?.split('@')[0] ?? 'Admin')

  const cards = [
    { label: 'Aguardando revisão', value: pending.count ?? 0, tone: 'warn', delta: null },
    { label: 'Enviadas hoje', value: sentToday.count ?? 0, tone: 'ok', delta: null },
    { label: 'Total de sessões', value: totalSessions.count ?? 0, tone: null, delta: null },
    { label: 'Erros no pipeline', value: pipelineErrors.count ?? 0, tone: 'danger', delta: pipelineErrors.count ? 'investigar' : null },
  ]

  return (
    <div style={{ padding: '24px 40px 64px' }}>
      {/* Greeting line — streams in with data */}
      <div style={{ marginBottom: 32, fontSize: 16, color: 'var(--muted)' }}>
        {greeting()}, <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{displayName}</strong>.
      </div>

      {/* Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        border: '1px solid var(--rule)', background: 'var(--paper)',
      }}>
        {cards.map((c, i) => (
          <div key={i} style={{ padding: '24px', borderRight: i < 3 ? '1px solid var(--rule)' : 'none' }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>{c.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 44, fontWeight: 400, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                {c.value}
              </div>
              {c.tone && <span style={{ width: 8, height: 8, borderRadius: '50%', background: `var(--${c.tone})` }} />}
            </div>
            {c.delta && <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{c.delta}</div>}
          </div>
        ))}
      </div>

      {/* Secondary row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginTop: 32 }}>
        {/* Atividade recente */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em' }}>Propostas recentes</h2>
            <Link href="/admin/proposals" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'underline' }}>Ver todas →</Link>
          </div>
          <div className="oa-card">
            {proposals.data?.length === 0 && (
              <div style={{ padding: '24px 18px', fontSize: 14, color: 'var(--muted)' }}>Nenhuma proposta ainda.</div>
            )}
            {proposals.data?.map((row, i) => (
              <div key={row.id} style={{
                display: 'grid', gridTemplateColumns: '1.6fr 1fr 0.8fr 0.6fr',
                alignItems: 'center', padding: '14px 18px',
                borderTop: i === 0 ? 'none' : '1px solid var(--rule-2)', fontSize: 14,
              }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{row.client_name || '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{row.client_email || '—'}</div>
                </div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(row.created_at)}</div>
                <div><StatusBadge status={row.status} /></div>
                <div style={{ textAlign: 'right' }}>
                  <Link href={`/admin/proposals/${row.id}`} className="mono" style={{ fontSize: 12, color: 'var(--ink)', textDecoration: 'underline' }}>abrir</Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Notificações recentes */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em' }}>Notificações</h2>
            <Link href="/admin/notifications" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'underline' }}>Ver todas →</Link>
          </div>
          <div className="oa-card">
            {notifications.data?.length === 0 && (
              <div style={{ padding: '24px 18px', fontSize: 14, color: 'var(--muted)' }}>Nenhuma notificação não lida.</div>
            )}
            {notifications.data?.map((n, i) => {
              const isOk = n.type !== 'pipeline_error'
              return (
                <div key={n.id} style={{ display: 'flex', gap: 12, padding: '14px 18px', borderTop: i === 0 ? 'none' : '1px solid var(--rule-2)' }}>
                  <div style={{
                    width: 22, height: 22, marginTop: 1, borderRadius: 2, flexShrink: 0,
                    background: isOk ? 'var(--ok-soft)' : 'var(--danger-soft)',
                    color: isOk ? 'oklch(0.40 0.10 145)' : 'oklch(0.42 0.14 25)',
                    display: 'grid', placeItems: 'center',
                    fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600,
                  }}>
                    {isOk ? '✓' : '✕'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, lineHeight: 1.45 }}>{n.message}</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{relativeTime(n.created_at)}</div>
                  </div>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', marginTop: 8, flexShrink: 0 }} />
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  const bone = (w: string | number, h: number, extra?: React.CSSProperties) => (
    <div style={{ width: w, height: h, background: 'var(--paper-3)', borderRadius: 2, animation: 'oaPulse 1.4s ease-in-out infinite', ...extra }} />
  )
  return (
    <div style={{ padding: '24px 40px 64px' }}>
      {bone(180, 16, { marginBottom: 32 })}
      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid var(--rule)', background: 'var(--paper)' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ padding: '24px', borderRight: i < 3 ? '1px solid var(--rule)' : 'none' }}>
            {bone(100, 11, { marginBottom: 14 })}
            {bone(60, 48)}
          </div>
        ))}
      </div>
      {/* Lists */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginTop: 32 }}>
        {[...Array(2)].map((_, i) => (
          <div key={i}>
            {bone(120, 18, { marginBottom: 12 })}
            <div className="oa-card">
              {[...Array(5)].map((_, j) => (
                <div key={j} style={{ padding: '14px 18px', borderTop: j === 0 ? 'none' : '1px solid var(--rule-2)' }}>
                  {bone(`${70 + j * 5}%`, 13, { opacity: 1 - j * 0.12 })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const dateLabel = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div>
      {/* Static header — renders immediately */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        padding: '32px 40px 24px',
        borderBottom: '1px solid var(--rule)',
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Visão geral · {dateLabel}</div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em' }}>Painel</h1>
        </div>
        <NotificationBell />
      </div>

      {/* Dynamic data — streams in */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardData />
      </Suspense>
    </div>
  )
}
