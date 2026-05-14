import { Suspense } from 'react'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { NotificationBell } from '@/components/admin/NotificationBell'

const PAGE_SIZE = 20

const TABS = [
  { key: 'all',            label: 'Todas',           status: null },
  { key: 'pending_review', label: 'Aguardando rev.', status: 'pending_review' },
  { key: 'approved',       label: 'Aprovadas',       status: 'approved' },
  { key: 'sent',           label: 'Enviadas',        status: 'sent' },
  { key: 'rejected',       label: 'Rejeitadas',      status: 'rejected' },
]

function fmtBRL(value: number | null): string {
  if (value == null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function shortId(id: string): string { return id.slice(0, 8) }

function tabHref(status: string | null, page = 1, search?: string): string {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (page > 1) params.set('page', String(page))
  if (search) params.set('search', search)
  const qs = params.toString()
  return `/admin/proposals${qs ? `?${qs}` : ''}`
}

// Async sub-component — only this part suspends
async function ProposalsData({
  statusParam,
  page,
  search,
}: {
  statusParam: string | undefined
  page: number
  search: string | undefined
}) {
  const offset = (page - 1) * PAGE_SIZE
  const supabase = await createSupabaseServerClient()

  const searchFilter = search ? `client_name.ilike.%${search}%,client_email.ilike.%${search}%` : null

  const [allCount, pendingCount, approvedCount, sentCount, rejectedCount, rows] =
    await Promise.all([
      supabase.from('proposals').select('id', { count: 'exact', head: true }),
      supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
      supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
      supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      (() => {
        let q = supabase
          .from('proposals')
          .select('id, client_name, client_email, total_price, status, created_at')
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1)
        if (statusParam) q = q.eq('status', statusParam)
        if (searchFilter) q = q.or(searchFilter)
        return q
      })(),
    ])

  const counts: Record<string, number> = {
    all:            allCount.count ?? 0,
    pending_review: pendingCount.count ?? 0,
    approved:       approvedCount.count ?? 0,
    sent:           sentCount.count ?? 0,
    rejected:       rejectedCount.count ?? 0,
  }

  const totalRows = statusParam ? (counts[statusParam] ?? 0) : counts.all
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE))
  const activeTab = TABS.find(t => t.status === (statusParam ?? null)) ?? TABS[0]

  return (
    <div style={{ padding: '24px 40px 64px' }}>
      {/* Search bar */}
      <form method="GET" action="/admin/proposals" style={{ marginBottom: 16 }}>
        {statusParam && <input type="hidden" name="status" value={statusParam} />}
        <div style={{ position: 'relative', maxWidth: 320 }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 13, color: 'var(--muted)', pointerEvents: 'none',
          }}>⌕</span>
          <input
            name="search"
            defaultValue={search ?? ''}
            placeholder="Buscar por nome ou email…"
            className="oa-input"
            style={{ paddingLeft: 28, fontSize: 13, width: '100%' }}
          />
        </div>
      </form>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--rule)', marginBottom: 0 }}>
        {TABS.map((t) => {
          const isActive = t.key === activeTab.key
          const count = counts[t.status ?? 'all'] ?? counts.all
          return (
            <Link
              key={t.key}
              href={tabHref(t.status, 1, search)}
              style={{
                padding: '12px 16px',
                fontSize: 13, fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--ink)' : 'var(--muted)',
                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1,
                display: 'inline-flex', alignItems: 'center', gap: 8,
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              {t.label}
              <span className="mono" style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 2,
                background: isActive ? 'var(--accent-soft)' : 'var(--paper-2)',
                color: isActive ? 'var(--accent-ink)' : 'var(--muted)',
              }}>
                {count}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Table */}
      <div className="oa-card" style={{ borderTop: 0 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '0.5fr 1.6fr 1.4fr 0.9fr 1fr 0.9fr 0.5fr',
          padding: '12px 18px',
          borderBottom: '1px solid var(--rule)',
          background: 'var(--paper-2)',
        }}>
          {['ID', 'Cliente', 'Email', 'Data', 'Preço total', 'Status', ''].map((h, i) => (
            <div key={i} className="eyebrow">{h}</div>
          ))}
        </div>

        {rows.data?.length === 0 && (
          <div style={{ padding: '32px 18px', fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>
            Nenhuma proposta nesta categoria.
          </div>
        )}

        {rows.data?.map((p, i) => (
          <div key={p.id} style={{
            display: 'grid',
            gridTemplateColumns: '0.5fr 1.6fr 1.4fr 0.9fr 1fr 0.9fr 0.5fr',
            padding: '16px 18px',
            borderTop: i === 0 ? 'none' : '1px solid var(--rule-2)',
            alignItems: 'center', fontSize: 14,
          }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{shortId(p.id)}</div>
            <div style={{ fontWeight: 500 }}>{p.client_name || '—'}</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>{p.client_email || '—'}</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(p.created_at)}</div>
            <div className="mono" style={{
              fontSize: 14, fontVariantNumeric: 'tabular-nums',
              color: p.total_price == null ? 'var(--muted-2)' : 'var(--ink)',
            }}>{fmtBRL(p.total_price)}</div>
            <div><StatusBadge status={p.status} /></div>
            <div style={{ textAlign: 'right' }}>
              <Link
                href={`/admin/proposals/${p.id}`}
                className="oa-btn ghost sm"
                style={{ padding: '5px 10px', fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap', minWidth: 76, display: 'inline-block' }}
              >
                Revisar →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 18, fontSize: 12, color: 'var(--muted)',
        }}>
          <span className="mono">
            mostrando {offset + 1}–{Math.min(offset + PAGE_SIZE, totalRows)} de {totalRows}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {page > 1 && (
              <Link href={tabHref(statusParam ?? null, page - 1, search)} className="oa-btn ghost sm" style={{ padding: '4px 10px', textDecoration: 'none' }}>←</Link>
            )}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
              <Link key={n} href={tabHref(statusParam ?? null, n, search)} style={{
                padding: '4px 10px',
                border: '1px solid var(--rule)',
                background: n === page ? 'var(--ink)' : 'transparent',
                color: n === page ? 'var(--paper)' : 'var(--ink)',
                fontSize: 12, fontFamily: 'var(--mono)', borderRadius: 2,
                textDecoration: 'none', display: 'inline-block',
              }}>{n}</Link>
            ))}
            {page < totalPages && (
              <Link href={tabHref(statusParam ?? null, page + 1, search)} className="oa-btn ghost sm" style={{ padding: '4px 10px', textDecoration: 'none' }}>→</Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div style={{ padding: '24px 40px 64px' }}>
      {/* Tabs skeleton */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--rule)', paddingBottom: 1, marginBottom: 0 }}>
        {TABS.map((t) => (
          <div key={t.key} style={{
            padding: '12px 16px', display: 'inline-flex', alignItems: 'center', gap: 8,
            borderBottom: '2px solid transparent',
          }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{t.label}</span>
            <span style={{ width: 18, height: 14, background: 'var(--paper-3)', borderRadius: 2, animation: 'oaPulse 1.4s ease-in-out infinite' }} />
          </div>
        ))}
      </div>
      {/* Table header */}
      <div className="oa-card" style={{ borderTop: 0 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '0.5fr 1.6fr 1.4fr 0.9fr 1fr 0.9fr 0.5fr',
          padding: '12px 18px', borderBottom: '1px solid var(--rule)', background: 'var(--paper-2)',
        }}>
          {['ID', 'Cliente', 'Email', 'Data', 'Preço total', 'Status', ''].map((h, i) => (
            <div key={i} className="eyebrow">{h}</div>
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '0.5fr 1.6fr 1.4fr 0.9fr 1fr 0.9fr 0.5fr',
            padding: '16px 18px', borderTop: i === 0 ? 'none' : '1px solid var(--rule-2)',
            alignItems: 'center', gap: 8,
          }}>
            {[30, 100, 140, 70, 80, 60, 50].map((w, j) => (
              <div key={j} style={{ height: 13, width: w, background: 'var(--paper-3)', borderRadius: 2, animation: 'oaPulse 1.4s ease-in-out infinite', opacity: 1 - i * 0.1 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProposalsList({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; search?: string }>
}) {
  // searchParams is a promise — unwrap inside the async sub-component
  const paramsPromise = searchParams.then(p => ({
    statusParam: p.status,
    page: Math.max(1, parseInt(p.page ?? '1', 10)),
    search: p.search?.trim() || undefined,
  }))

  return (
    <div>
      {/* Static header — renders immediately */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        padding: '32px 40px 24px',
        borderBottom: '1px solid var(--rule)',
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Painel · Propostas</div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em' }}>Propostas</h1>
        </div>
        <NotificationBell />
      </div>

      {/* Dynamic data — streams in */}
      <Suspense fallback={<TableSkeleton />}>
        <ProposalsDataWrapper paramsPromise={paramsPromise} />
      </Suspense>
    </div>
  )
}

async function ProposalsDataWrapper({
  paramsPromise,
}: {
  paramsPromise: Promise<{ statusParam: string | undefined; page: number; search: string | undefined }>
}) {
  const { statusParam, page, search } = await paramsPromise
  return <ProposalsData statusParam={statusParam} page={page} search={search} />
}
