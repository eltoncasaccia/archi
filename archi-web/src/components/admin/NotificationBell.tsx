'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

function BellIcon() {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

export function NotificationBell() {
  const [unread, setUnread] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const supabase = createClient()
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('read', false)
      setUnread(count ?? 0)
      setIsLoading(false)
    }

    fetchUnreadCount()

    // Subscribe to realtime changes
    const supabase = createClient()
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
      }, () => {
        fetchUnreadCount()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (isLoading) {
    return (
      <Link
        href="/admin/notifications"
        style={{
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          width: 28,
          height: 28,
          borderRadius: 2,
          color: 'var(--ink-2)',
          textDecoration: 'none',
          flexShrink: 0,
          alignSelf: 'flex-start',
          marginTop: 1,
        }}
        title="Notificações"
      >
        <BellIcon />
      </Link>
    )
  }

  return (
    <Link
      href="/admin/notifications"
      style={{
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        width: 28,
        height: 28,
        borderRadius: 2,
        color: 'var(--ink-2)',
        textDecoration: 'none',
        flexShrink: 0,
        alignSelf: 'flex-start',
        marginTop: 1,
      }}
      title="Notificações"
    >
      <BellIcon />
      {unread > 0 && (
        <span style={{
          position: 'absolute',
          top: -6,
          right: -6,
          minWidth: 15,
          height: 15,
          padding: '0 3px',
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
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  )
}
