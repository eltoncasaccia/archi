'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const EXPANDED_W = 240
const COLLAPSED_W = 56

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin', countKey: null },
  { key: 'proposals', label: 'Propostas', href: '/admin/proposals', countKey: 'pending' },
  { key: 'codes', label: 'Códigos de acesso', href: '/admin/access-codes', countKey: null },
  { key: 'notifications', label: 'Notificações', href: '/admin/notifications', countKey: 'unread' },
] as const

interface Props {
  pendingCount: number
  unreadCount: number
  userEmail: string
}

function SignOutIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function HamburgerIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round">
      <path d="M1.5 3.5h12M1.5 7.5h12M1.5 11.5h12" />
    </svg>
  )
}

function LogoMark() {
  return (
    <svg width={20} height={20} viewBox="0 0 64 64" fill="none">
      <path
        d="M10 30 C10 18, 20 10, 32 10 C44 10, 54 18, 54 30 C54 42, 44 50, 32 50 C28 50, 24 49.2, 20.5 47.5 L 12 52 L 15 43 C 12 39.5, 10 35, 10 30 Z"
        fill="var(--ink)"
      />
      <circle cx="40" cy="26" r="5" fill="var(--accent)" />
      <circle cx="26" cy="30" r="2.6" fill="var(--paper)" />
    </svg>
  )
}

export function AdminSidebar({ pendingCount: initialPending, unreadCount: initialUnread, userEmail }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(initialPending)
  const [unreadCount, setUnreadCount] = useState(initialUnread)
  const [toast, setToast] = useState<string | null>(null)
  const prevUnread = useRef(initialUnread)

  useEffect(() => {
    const supabase = createClient()

    const fetchCounts = async () => {
      const [notifRes, propRes] = await Promise.all([
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('read', false),
        supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
      ])
      const newUnread = notifRes.count ?? 0
      const newPending = propRes.count ?? 0

      if (newUnread > prevUnread.current) {
        setToast('Nova proposta pronta para revisão!')
        setTimeout(() => setToast(null), 6000)
      }
      prevUnread.current = newUnread
      setUnreadCount(newUnread)
      setPendingCount(newPending)
    }

    const channel = supabase
      .channel('admin-live-counts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, fetchCounts)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'proposals' }, fetchCounts)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  function getCount(countKey: string | null): number {
    if (countKey === 'pending') return pendingCount
    if (countKey === 'unread') return unreadCount
    return 0
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const displayName = userEmail.split('@')[0]

  return (
    <>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 200,
          background: 'var(--ink)', color: 'var(--paper)',
          padding: '14px 20px', borderRadius: 2,
          fontSize: 13, fontFamily: 'var(--sans)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          display: 'flex', alignItems: 'center', gap: 12,
          maxWidth: 320,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: 'var(--ok)',
          }} />
          <span style={{ flex: 1 }}>{toast}</span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'transparent', border: 0, color: 'var(--muted)',
              cursor: 'pointer', padding: 0, fontSize: 16, lineHeight: 1,
              flexShrink: 0,
            }}
          >×</button>
        </div>
      )}
    <aside style={{
      width: collapsed ? COLLAPSED_W : EXPANDED_W,
      flexShrink: 0,
      background: 'var(--paper)',
      borderRight: '1px solid var(--rule)',
      display: 'flex',
      flexDirection: 'column',
      padding: '28px 0',
      transition: 'width 0.2s ease',
      overflow: 'visible',
      position: 'relative',
      zIndex: 20,
    }}>

      {/* Logo + hamburger */}
      <div style={{
        padding: '0 16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        overflow: 'hidden',
        gap: 8,
      }}>
        {!collapsed && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 18,
            letterSpacing: '-0.02em', color: 'var(--ink)',
            whiteSpace: 'nowrap',
          }}>
            <LogoMark />
            <span>Archi</span>
          </div>
        )}
        <button
          onClick={() => { setCollapsed(c => !c); setHovered(null) }}
          style={{
            border: 0, background: 'transparent', cursor: 'pointer',
            padding: 4, color: 'var(--muted)', borderRadius: 2,
            display: 'grid', placeItems: 'center', flexShrink: 0,
            lineHeight: 0,
          }}
          title={collapsed ? 'Expandir menu' : 'Retrair menu'}
        >
          <HamburgerIcon />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: collapsed ? '0 8px' : '0 12px', flex: 1 }}>
        {!collapsed && (
          <div className="eyebrow" style={{ padding: '0 12px 10px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            Painel
          </div>
        )}

        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          const count = getCount(item.countKey)
          return (
            <div
              key={item.key}
              style={{ position: 'relative', marginBottom: 2 }}
              onMouseEnter={() => collapsed && setHovered(item.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <Link
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'space-between',
                  padding: '9px 12px',
                  background: active ? 'var(--ink)' : 'transparent',
                  color: active ? 'var(--paper)' : 'var(--ink-2)',
                  fontSize: 14,
                  fontWeight: active ? 500 : 400,
                  borderRadius: 2,
                  textDecoration: 'none',
                  transition: 'background 0.1s',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {collapsed ? (
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 12,
                    fontWeight: 600, letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}>
                    {item.label[0]}
                  </span>
                ) : (
                  <>
                    <span>{item.label}</span>
                    {count > 0 && (
                      <span className="mono" style={{
                        fontSize: 11, padding: '1px 6px',
                        background: active ? 'var(--paper)' : 'var(--accent)',
                        color: active ? 'var(--ink)' : 'white',
                        borderRadius: 2,
                      }}>
                        {count}
                      </span>
                    )}
                  </>
                )}
              </Link>

              {/* Floating label on hover when collapsed */}
              {collapsed && hovered === item.key && (
                <div style={{
                  position: 'absolute',
                  left: '100%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  marginLeft: 8,
                  background: 'var(--ink)',
                  color: 'var(--paper)',
                  padding: '7px 12px',
                  borderRadius: 2,
                  fontSize: 13,
                  fontWeight: active ? 500 : 400,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 100,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}>
                  {item.label}
                  {count > 0 && (
                    <span className="mono" style={{
                      fontSize: 11, padding: '1px 6px',
                      background: 'var(--accent)',
                      color: 'white',
                      borderRadius: 2,
                    }}>
                      {count}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User section */}
      <div style={{
        padding: collapsed ? '16px 8px 0' : '16px 24px 0',
        borderTop: '1px solid var(--rule)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: collapsed ? 0 : 14,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 2,
            background: 'var(--paper-3)',
            display: 'grid', placeItems: 'center',
            fontSize: 12, fontWeight: 600, fontFamily: 'var(--mono)',
            color: 'var(--ink)',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}>
            {displayName.slice(0, 2)}
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>admin</div>
            </div>
          )}
        </div>
        {collapsed ? (
          <button
            onClick={handleSignOut}
            title="Sair"
            style={{
              border: 0, background: 'transparent', cursor: 'pointer',
              width: '100%', padding: '8px 0', marginTop: 8,
              display: 'grid', placeItems: 'center',
              color: 'var(--muted)', borderRadius: 2,
            }}
          >
            <SignOutIcon />
          </button>
        ) : (
          <button className="oa-btn ghost sm" style={{ width: '100%' }} onClick={handleSignOut}>
            Sair
          </button>
        )}
      </div>
    </aside>
    </>
  )
}
