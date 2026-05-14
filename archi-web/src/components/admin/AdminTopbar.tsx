'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function BellIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

interface Props {
  unreadCount: number
}

export function AdminTopbar({ unreadCount }: Props) {
  const pathname = usePathname()
  const isOnNotifications = pathname === '/admin/notifications'

  return (
    <div style={{
      height: 44,
      borderBottom: '1px solid var(--rule)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 40px',
      background: 'var(--paper)',
      flexShrink: 0,
    }}>
      <Link
        href="/admin/notifications"
        style={{
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          width: 32,
          height: 32,
          borderRadius: 2,
          color: isOnNotifications ? 'var(--ink)' : 'var(--ink-2)',
          background: isOnNotifications ? 'var(--paper-2)' : 'transparent',
          textDecoration: 'none',
        }}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 2,
            right: 2,
            minWidth: 16,
            height: 16,
            padding: '0 4px',
            background: 'var(--accent)',
            color: 'white',
            borderRadius: 2,
            fontSize: 10,
            fontFamily: 'var(--mono)',
            fontWeight: 600,
            display: 'grid',
            placeItems: 'center',
            lineHeight: 1,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
    </div>
  )
}
