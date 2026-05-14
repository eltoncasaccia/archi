'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Spinner } from '@/components/Spinner'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function getToken(): Promise<string | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

export interface Notification {
  id: string
  type: string
  message: string
  read: boolean
  created_at: string
  session_id: string | null
}

type FilterKey = 'all' | 'unread' | 'success' | 'error'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'unread', label: 'Não lidas' },
  { key: 'success', label: 'Sucessos' },
  { key: 'error', label: 'Erros' },
]

function isError(type: string): boolean {
  return type === 'pipeline_error'
}

function relativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return `há ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `há ${hrs} h`
  if (hrs < 48) return `ontem · ${new Date(isoDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  return new Date(isoDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function dateGroup(isoDate: string): string {
  const d = new Date(isoDate)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yestStart = new Date(todayStart.getTime() - 86_400_000)
  const weekStart = new Date(todayStart.getTime() - 6 * 86_400_000)

  if (d >= todayStart) return 'Hoje'
  if (d >= yestStart) {
    return `Ontem · ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
  }
  if (d >= weekStart) return 'Esta semana'
  return 'Mais antigas'
}

export function NotificationsClient({
  initialNotifications,
  proposalMap,
}: {
  initialNotifications: Notification[]
  proposalMap: Record<string, string>
}) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const [markingId, setMarkingId] = useState<string | null>(null)

  const unreadCount = notifications.filter(n => !n.read).length
  const totalCount = notifications.length

  // Auto-mark all as read when the page is opened
  useEffect(() => {
    markAllRead()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filterCounts: Record<FilterKey, number> = {
    all: totalCount,
    unread: unreadCount,
    success: notifications.filter(n => !isError(n.type)).length,
    error: notifications.filter(n => isError(n.type)).length,
  }

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter === 'success') return !isError(n.type)
    if (filter === 'error') return isError(n.type)
    return true
  })

  // Group by date
  const groups: { label: string; items: Notification[] }[] = []
  for (const n of filtered) {
    const label = dateGroup(n.created_at)
    const existing = groups.find(g => g.label === label)
    if (existing) existing.items.push(n)
    else groups.push({ label, items: [n] })
  }

  async function markRead(id: string) {
    if (markingId === id) return
    setMarkingId(id)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/admin/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      }
    } finally {
      setMarkingId(null)
    }
  }

  async function markAllRead() {
    if (markingAllRead) return
    const unread = notifications.filter(n => !n.read)
    if (unread.length === 0) return
    setMarkingAllRead(true)
    try {
      const token = await getToken()
      await Promise.all(unread.map(n =>
        fetch(`${API_URL}/admin/notifications/${n.id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        })
      ))
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } finally {
      setMarkingAllRead(false)
    }
  }

  return (
    <div style={{ padding: '24px 40px 64px', maxWidth: 920 }}>
      {/* Filter tabs + action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--rule)' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {FILTERS.map(f => {
            const isActive = filter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '10px 14px', border: 0, background: 'transparent', cursor: 'pointer',
                  fontSize: 13, fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'var(--ink)' : 'var(--muted)',
                  borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -1,
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}
              >
                {f.label}
                <span className="mono" style={{
                  fontSize: 10, padding: '1px 6px',
                  background: isActive ? 'var(--accent-soft)' : 'var(--paper-2)',
                  color: isActive ? 'var(--accent-ink)' : 'var(--muted)',
                }}>{filterCounts[f.key]}</span>
              </button>
            )
          })}
        </div>

        <button
          className="oa-btn ghost sm"
          onClick={markAllRead}
          disabled={markingAllRead || unreadCount === 0}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 1, flexShrink: 0 }}
        >
          {markingAllRead && <Spinner size={12} />}
          {markingAllRead ? 'Marcando…' : 'Marcar todas como lidas'}
        </button>
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 14, color: 'var(--muted)' }}>
          Nenhuma notificação nesta categoria.
        </div>
      )}

      {groups.map((g, gi) => (
        <div key={gi} style={{ marginBottom: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>{g.label}</div>
          <div className="oa-card">
            {g.items.map((n, i) => {
              const isErr = isError(n.type)
              const proposalId = n.session_id ? proposalMap[n.session_id] : null
              const isMarkingThis = markingId === n.id
              return (
                <div
                  key={n.id}
                  onClick={() => { if (!n.read && !isMarkingThis) markRead(n.id) }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto auto',
                    gap: 14,
                    padding: '16px 18px',
                    borderTop: i === 0 ? 'none' : '1px solid var(--rule-2)',
                    alignItems: 'center',
                    cursor: n.read ? 'default' : 'pointer',
                    transition: 'background 0.1s',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 28, height: 28, borderRadius: 2, flexShrink: 0,
                    background: isErr ? 'var(--danger-soft)' : 'var(--ok-soft)',
                    color: isErr ? 'oklch(0.42 0.14 25)' : 'oklch(0.40 0.10 145)',
                    display: 'grid', placeItems: 'center',
                    fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600,
                  }}>
                    {isMarkingThis ? <Spinner size={12} /> : (isErr ? '✕' : '✓')}
                  </div>

                  {/* Message */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: n.read ? 400 : 500, lineHeight: 1.4 }}>
                      {n.message}
                    </div>
                    <div className="mono" style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>
                      {n.type}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {relativeTime(n.created_at)}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 4 }}>
                    {!n.read && (
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--accent)',
                      }} />
                    )}
                    {proposalId && (
                      <Link
                        href={`/admin/proposals/${proposalId}`}
                        className="mono"
                        onClick={e => e.stopPropagation()}
                        style={{ fontSize: 12, color: 'var(--ink)', textDecoration: 'underline', whiteSpace: 'nowrap' }}
                      >
                        ver proposta →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
