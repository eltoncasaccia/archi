import { createSupabaseServerClient } from '@/lib/supabase-server'
import { AdminSidebar } from '@/components/admin/Sidebar'
import { getUnreadCount } from '@/lib/notifications-server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Unauthenticated: render children as-is (only login page reaches here due to middleware)
  if (!user) return <>{children}</>

  const [proposalsRes, unreadCount] = await Promise.all([
    supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
    getUnreadCount(),
  ])

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--paper)' }}>
      <AdminSidebar
        pendingCount={proposalsRes.count ?? 0}
        unreadCount={unreadCount}
        userEmail={user.email ?? ''}
      />
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}
