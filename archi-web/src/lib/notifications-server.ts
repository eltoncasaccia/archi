import { cache } from 'react'
import { createSupabaseServerClient } from './supabase-server'

export const getUnreadCount = cache(async () => {
  const supabase = await createSupabaseServerClient()
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('read', false)
  return count ?? 0
})
