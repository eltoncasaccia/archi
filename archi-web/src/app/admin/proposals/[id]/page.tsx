import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { ProposalDetail } from './_detail'
import { NotificationBell } from '@/components/admin/NotificationBell'

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: proposal } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .single()

  if (!proposal) notFound()

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', proposal.session_id)
    .single()

  const fallbackSession = {
    id: proposal.session_id,
    status: 'unknown',
    error_step: null,
    error_message: null,
    discovery_summary: null,
    pricing_summary: null,
    phases_plan: null,
    proposal_metadata: null,
    access_code: null,
    created_at: proposal.created_at,
  }

  return <ProposalDetail proposal={proposal} session={session ?? fallbackSession} notificationBell={<NotificationBell key="notification-bell" />} />
}
