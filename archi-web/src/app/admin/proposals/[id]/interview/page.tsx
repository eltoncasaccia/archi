import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const APPROVAL_RE = /\[DISCOVERY_APROVADO\][\s\S]*?\[\/DISCOVERY_APROVADO\]/

function renderText(text: string) {
  const display = text.replace(APPROVAL_RE, '').trim()
  return display.split('\n').map((line, i) => (
    <div key={i} style={{ marginTop: i > 0 ? (line.trim().startsWith('•') ? 4 : 10) : 0 }}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
        p.startsWith('**') ? <strong key={j}>{p.slice(2, -2)}</strong> : p
      )}
    </div>
  ))
}

function Bubble({ role, content }: { role: string; content: string }) {
  const isAgent = role === 'assistant'
  return (
    <div style={{
      display: 'flex', gap: 12,
      flexDirection: isAgent ? 'row' : 'row-reverse',
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: 32, height: 32, flexShrink: 0, borderRadius: 2,
        background: isAgent ? 'var(--ink)' : 'var(--paper-3)',
        color: isAgent ? 'var(--paper)' : 'var(--ink)',
        display: 'grid', placeItems: 'center',
        fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500,
      }}>
        {isAgent ? 'Archi' : 'VC'}
      </div>
      <div style={{
        maxWidth: '72%',
        padding: '12px 16px',
        background: isAgent ? 'var(--paper-2)' : 'var(--ink)',
        color: isAgent ? 'var(--ink)' : 'var(--paper)',
        border: isAgent ? '1px solid var(--rule)' : 'none',
        fontSize: 14, lineHeight: 1.6,
      }}>
        {renderText(content)}
      </div>
    </div>
  )
}

export default async function AdminInterviewPage({
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

  const { data: messages } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('session_id', proposal.session_id)
    .order('created_at', { ascending: true })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      {/* Header */}
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
          <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>Entrevista</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Visualização somente leitura</div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>
              Entrevista · {proposal.client_name ?? 'Cliente'}
            </h1>
          </div>
          <div style={{
            padding: '6px 12px',
            background: 'var(--paper-2)',
            border: '1px solid var(--rule)',
            fontSize: 12, color: 'var(--muted)',
            fontFamily: 'var(--mono)',
          }}>
            {messages?.length ?? 0} mensagens
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '32px 24px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {!messages?.length && (
          <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted)', paddingTop: 48 }}>
            Nenhuma mensagem registrada para esta sessão.
          </div>
        )}
        {messages?.map(msg => (
          <Bubble key={msg.id} role={msg.role} content={msg.content} />
        ))}
      </div>
    </div>
  )
}
