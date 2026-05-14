import { Suspense } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NotificationsClient } from './_notifications'
import type { Notification } from './_notifications'

async function NotificationsData() {
  const supabase = await createSupabaseServerClient()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })

  const rows = (notifications ?? []) as Notification[]

  const sessionIds = [...new Set(rows.map(n => n.session_id).filter(Boolean))] as string[]

  let proposalMap: Record<string, string> = {}
  if (sessionIds.length > 0) {
    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, session_id')
      .in('session_id', sessionIds)

    if (proposals) {
      for (const p of proposals) {
        proposalMap[p.session_id] = p.id
      }
    }
  }

  return <NotificationsClient initialNotifications={rows} proposalMap={proposalMap} />
}

function NotificationsSkeleton() {
  const bone = (w: string | number, h: number, op = 1) => (
    <div style={{ width: w, height: h, background: 'var(--paper-3)', borderRadius: 2, animation: 'oaPulse 1.4s ease-in-out infinite', opacity: op }} />
  )
  return (
    <div style={{ padding: '24px 40px 64px', maxWidth: 920 }}>
      {/* Filter tabs row + button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--rule)' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['Todas', 'Não lidas', 'Sucessos', 'Erros'].map((l, i) => (
            <div key={i} style={{ padding: '10px 14px', fontSize: 13, color: i === 0 ? 'var(--ink)' : 'var(--muted)', borderBottom: i === 0 ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {l}
              <div style={{ width: 18, height: 14, background: 'var(--paper-3)', borderRadius: 2, animation: 'oaPulse 1.4s ease-in-out infinite' }} />
            </div>
          ))}
        </div>
        {bone(160, 28)}
      </div>
      {/* Rows */}
      <div className="oa-card">
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr auto auto',
            gap: 14, padding: '16px 18px',
            borderTop: i === 0 ? 'none' : '1px solid var(--rule-2)',
            alignItems: 'center',
          }}>
            {bone(28, 28)}
            <div>{bone(`${55 + i * 8}%`, 13, 1 - i * 0.1)}</div>
            {bone(60, 11)}
            {bone(20, 20, 0.5)}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <div>
      {/* Static header — renderiza imediatamente */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        padding: '32px 40px 24px',
        borderBottom: '1px solid var(--rule)',
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Painel · Alertas</div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em' }}>Notificações</h1>
        </div>
      </div>

      {/* Dados — stream in */}
      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationsData />
      </Suspense>
    </div>
  )
}
