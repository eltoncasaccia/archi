import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { PipelineTabs } from './_pipeline'

export default async function AdminPipelinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: proposal } = await supabase
    .from('proposals')
    .select('id, session_id, client_name')
    .eq('id', id)
    .single()

  if (!proposal) notFound()

  const { data: session } = await supabase
    .from('sessions')
    .select('discovery_summary, pricing_summary, phases_plan, proposal_metadata')
    .eq('id', proposal.session_id)
    .single()

  const content = {
    discovery: session?.discovery_summary ?? '(não gerado)',
    pricing: session?.pricing_summary ?? '(não gerado)',
    phases: session?.phases_plan ?? '(não gerado)',
    meta: session?.proposal_metadata ?? '(não gerado)',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <div style={{
        padding: '20px 40px',
        borderBottom: '1px solid var(--rule)',
        background: 'var(--paper)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Link
            href={`/admin/proposals/${id}`}
            className="mono"
            style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}
          >
            ← Proposta
          </Link>
          <span style={{ color: 'var(--muted-2)' }}>-</span>
          <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>Pipeline</span>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Visualização somente leitura</div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>
            Conteúdo gerado pelo pipeline · {proposal.client_name ?? 'Cliente'}
          </h1>
        </div>
      </div>

      <div style={{ padding: '32px 40px 80px' }}>
        <PipelineTabs content={content} />
      </div>
    </div>
  )
}
