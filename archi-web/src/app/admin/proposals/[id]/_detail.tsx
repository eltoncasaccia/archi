'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { flushSync } from 'react-dom'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { Spinner } from '@/components/Spinner'
import { StatusBadge } from '@/components/admin/StatusBadge'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

interface Proposal {
  id: string
  session_id: string
  client_name: string | null
  client_email: string | null
  total_price: number | null
  total_days: number | null
  validity_days: number | null
  admin_notes: string | null
  analyst_name: string | null
  status: string
  docx_url: string | null
  pdf_url: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
  // Desfecho comercial — o que o cliente respondeu depois do envio.
  // Não confundir com `status`, que é o fluxo interno até enviar.
  outcome: Outcome
  closed_value: number | null
  actual_hours: number | null
  outcome_notes: string | null
  outcome_at: string | null
}

type Outcome = 'pending' | 'negotiating' | 'won' | 'lost'

const OUTCOME_OPTIONS: { value: Outcome; label: string; color: string }[] = [
  { value: 'pending', label: 'Sem resposta', color: 'var(--muted-2)' },
  { value: 'negotiating', label: 'Em negociação', color: 'var(--warn)' },
  { value: 'won', label: 'Fechou', color: 'var(--ok)' },
  { value: 'lost', label: 'Perdeu', color: 'var(--danger)' },
]

interface Session {
  id: string
  status: string
  error_step: string | null
  error_message: string | null
  discovery_summary: string | null
  pricing_summary: string | null
  phases_plan: string | null
  proposal_metadata: string | null
  access_code: string | null
  created_at: string
}

type StepState = 'done' | 'error' | 'current' | 'pending'
interface Step { label: string; state: StepState }

const PIPELINE_STEP_DEFS = [
  { label: 'Discovery gerado', field: 'discovery_summary', errorKey: 'agent-discovery-generator' },
  { label: 'Pricing gerado', field: 'pricing_summary', errorKey: 'agent-pricing' },
  { label: 'Phases gerado', field: 'phases_plan', errorKey: 'agent-phases' },
  { label: 'Proposta gerada', field: 'proposal_metadata', errorKey: 'agent-proposal-generator' },
]

function resolveSteps(session: Session, proposalStatus: string): Step[] {
  const isPipelineError = session.status === 'pipeline_error'
  const errorKey = session.error_step

  let foundError = false
  const steps: Step[] = PIPELINE_STEP_DEFS.map(s => {
    if (foundError) return { label: s.label, state: 'pending' }
    if (isPipelineError && errorKey === s.errorKey) {
      foundError = true
      return { label: s.label, state: 'error' }
    }
    if ((session as unknown as Record<string, unknown>)[s.field] != null) return { label: s.label, state: 'done' }
    if (isPipelineError) { foundError = true; return { label: s.label, state: 'error' } }
    return { label: s.label, state: 'current' }
  })

  let reviewState: StepState = 'pending'
  if (proposalStatus === 'pending_review') reviewState = 'current'
  else if (['approved', 'sent', 'rejected'].includes(proposalStatus)) reviewState = 'done'
  steps.push({ label: 'Aguardando revisão', state: reviewState })

  return steps
}

async function getToken(): Promise<string | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function parseBRLInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10) / 100
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function brlToNumber(formatted: string): number | null {
  const clean = formatted.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(clean)
  return isNaN(n) ? null : n
}

function shortId(id: string): string { return id.slice(0, 8) }

function slugify(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const PAGE_W = 460
const PAGE_TOTAL = 650

function findUnfilledFields(text: string): string[] {
  const matches = text.match(/\[[^\]]+\]/g) ?? []
  return [...new Set(matches)]
}

function stripMetadata(raw: string | null): string {
  if (!raw) return ''
  return raw.replace(/\[PROPOSAL_METADATA\][\s\S]*?\[\/PROPOSAL_METADATA\]/gi, '').trim()
}

function substituteVars(text: string, clientName: string, analystName: string, price: string, days: string, validityDays?: string): string {
  return text
    .replace(/\{\{NOME_CLIENTE\}\}/g, clientName || '—')
    .replace(/\{\{NOME_ANALISTA\}\}/g, analystName || '—')
    .replace(/\{\{PRECO_TOTAL\}\}/g, price ? `R$ ${price}` : '—')
    .replace(/\{\{PRAZO_DIAS\}\}/g, days ? `${days} dias úteis` : '—')
    .replace(/\[___\]/g, validityDays || '30')
}

function renderMdInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]]+\])/g)
  if (parts.length === 1) return text
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
        if (p.startsWith('*') && p.endsWith('*')) return <em key={i}>{p.slice(1, -1)}</em>
        if (p.startsWith('[') && p.endsWith(']')) return (
          <mark key={i} style={{ background: '#FEF08A', borderRadius: 2, padding: '0 2px', fontWeight: 500 }}>{p}</mark>
        )
        return <React.Fragment key={i}>{p}</React.Fragment>
      })}
    </>
  )
}

function renderMdBlock(body: string): React.ReactNode {
  type MdLine =
    | { type: 'heading'; level: number; text: string }
    | { type: 'bullet'; text: string }
    | { type: 'ordered'; text: string }
    | { type: 'para'; text: string }
    | { type: 'empty' }

  const parsed: MdLine[] = body.split('\n').map(line => {
    const t = line.trim()
    if (!t) return { type: 'empty' as const }
    const hm = t.match(/^(#{1,4})\s+(.+)$/)
    if (hm) return { type: 'heading' as const, level: hm[1].length, text: hm[2] }
    const bm = t.match(/^[-•*]\s+(.+)$/)
    if (bm) return { type: 'bullet' as const, text: bm[1] }
    const om = t.match(/^\d+[.)]\s+(.+)$/)
    if (om) return { type: 'ordered' as const, text: om[1] }
    return { type: 'para' as const, text: t }
  })

  const nodes: React.ReactNode[] = []
  let i = 0
  while (i < parsed.length) {
    const line = parsed[i]
    if (line.type === 'empty') { i++; continue }
    if (line.type === 'heading') {
      nodes.push(
        <h4 key={i} style={{ fontSize: line.level <= 2 ? 13 : 11, fontWeight: 600, margin: '10px 0 4px', color: '#1a1a1a' }}>
          {renderMdInline(line.text)}
        </h4>
      )
      i++; continue
    }
    if (line.type === 'bullet') {
      const items: string[] = []
      while (i < parsed.length && parsed[i].type === 'bullet') {
        items.push((parsed[i] as { type: 'bullet'; text: string }).text)
        i++
      }
      nodes.push(
        <ul key={`ul${i}`} style={{ paddingLeft: 16, margin: '4px 0 8px', listStyleType: 'disc' }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize: 10.5, lineHeight: 1.6, color: '#333', marginBottom: 2 }}>
              {renderMdInline(item)}
            </li>
          ))}
        </ul>
      )
      continue
    }
    if (line.type === 'ordered') {
      const items: string[] = []
      while (i < parsed.length && parsed[i].type === 'ordered') {
        items.push((parsed[i] as { type: 'ordered'; text: string }).text)
        i++
      }
      nodes.push(
        <ol key={`ol${i}`} style={{ paddingLeft: 18, margin: '4px 0 8px' }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize: 10.5, lineHeight: 1.6, color: '#333', marginBottom: 2 }}>
              {renderMdInline(item)}
            </li>
          ))}
        </ol>
      )
      continue
    }
    if (line.type === 'para') {
      nodes.push(
        <p key={i} style={{ fontSize: 10.5, lineHeight: 1.65, color: '#333', margin: '0 0 8px' }}>
          {renderMdInline(line.text)}
        </p>
      )
      i++; continue
    }
    i++
  }
  return <>{nodes}</>
}

const SERIF = "Georgia, 'Times New Roman', serif"
const INK = '#1a1a1a'
const PAPER = '#F9F7F2'

function CoverCard({ clientName, price, days, phaseCount, proposalDate }: {
  clientName: string | null
  price: string
  days: string
  phaseCount: number
  proposalDate: string
}) {
  const LOGO_ACCENT = 'oklch(0.62 0.16 45)'
  return (
    <div style={{ width: 460, height: 650, position: 'relative', overflow: 'hidden', background: PAPER, fontFamily: 'var(--sans)', color: INK }}>
      <div style={{ padding: '28px 36px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 20 }}>
          <svg width={20} height={20} viewBox="0 0 64 64" fill="none">
            <path d="M10 30 C10 18, 20 10, 32 10 C44 10, 54 18, 54 30 C54 42, 44 50, 32 50 C28 50, 24 49.2, 20.5 47.5 L 12 52 L 15 43 C 12 39.5, 10 35, 10 30 Z" fill={INK} />
            <circle cx="40" cy="26" r="5" fill={LOGO_ACCENT} />
            <circle cx="26" cy="30" r="2.6" fill={PAPER} />
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '-0.01em' }}>Archi</span>
        </div>
        <div style={{ fontSize: 8, fontFamily: 'var(--mono)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888', marginBottom: 28 }}>
          Proposta Comercial · {new Date(proposalDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '').toUpperCase()}
        </div>
        <h1 style={{ margin: '0 0 16px', fontSize: 30, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.03em', fontFamily: SERIF, color: INK }}>
          {clientName ? `Proposta para ${clientName}.` : 'Proposta Técnica.'}
        </h1>
        <p style={{ margin: 0, fontSize: 11, lineHeight: 1.6, color: '#555', maxWidth: 340 }}>
          {clientName
            ? `Proposta comercial elaborada com escopo, prazo e investimento para ${clientName}.`
            : 'Proposta técnica com escopo, prazo e investimento detalhados.'}
        </p>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: INK, padding: '22px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 7, fontFamily: 'var(--mono)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.45)', marginBottom: 5 }}>Preparado para</div>
          <div style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>{clientName || '—'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 7, fontFamily: 'var(--mono)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.45)', marginBottom: 5 }}>Investimento</div>
          <div style={{ fontSize: 17, color: 'white', fontWeight: 700, fontFamily: 'var(--mono)' }}>R$ {price || '—'}</div>
          <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
            {days || '—'} dias úteis{phaseCount > 0 ? ` · ${phaseCount} fases` : ''}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProposalBody({ text }: { text: string }) {
  return (
    <div style={{ width: PAGE_W, background: PAPER, padding: '28px 36px', fontFamily: 'var(--sans)', color: INK }}>
      {renderMdBlock(text)}
    </div>
  )
}

function SignaturePage({ clientName, analystName }: {
  clientName: string | null; analystName: string | null
}) {
  return (
    <div style={{ width: PAGE_W, height: PAGE_TOTAL, background: PAPER, fontFamily: 'var(--sans)', color: INK, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '28px 36px', flex: 1 }}>
        <div style={{ fontSize: 8.5, fontFamily: 'var(--mono)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#888', marginBottom: 28 }}>
          Assinaturas
        </div>
        <p style={{ fontSize: 10.5, color: '#555', marginBottom: 40, lineHeight: 1.6 }}>
          Ao assinar abaixo, as partes declaram estar de acordo com o escopo, prazo e investimento descritos nesta proposta.
        </p>
        <div style={{ marginBottom: 48 }}>
          <div style={{ height: 0.5, background: '#d0cdc7', marginBottom: 6, width: 160 }} />
          <div style={{ fontSize: 9, color: '#888', fontFamily: 'var(--mono)' }}>Data</div>
        </div>
        <div style={{ display: 'flex', gap: 36 }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: 0.5, background: '#1a1a1a', marginBottom: 6 }} />
            <div style={{ fontSize: 10.5, fontWeight: 500 }}>{clientName || '—'}</div>
            <div style={{ fontSize: 8.5, color: '#888', fontFamily: 'var(--mono)', marginTop: 2 }}>Contratante</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ height: 0.5, background: '#1a1a1a', marginBottom: 6 }} />
            <div style={{ fontSize: 10.5, fontWeight: 500 }}>{analystName || '—'}</div>
            <div style={{ fontSize: 8.5, color: '#888', fontFamily: 'var(--mono)', marginTop: 2 }}>Contratado</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProposalPreview({
  clientName, clientEmail, price, days, validityDays, analystName, notes,
  onClientNameChange, onClientEmailChange, onPriceChange, onDaysChange, onValidityDaysChange, onAnalystNameChange, onNotesChange,
  proposalMetadata, savedAt, saving,
  docxUrl, pdfUrl, generatingDocx, generatingPdf, onGenerateDocs, proposalDate,
}: {
  clientName: string
  clientEmail: string
  price: string
  days: string
  validityDays: string
  analystName: string
  notes: string
  onClientNameChange: (v: string) => void
  onClientEmailChange: (v: string) => void
  onPriceChange: (v: string) => void
  onDaysChange: (v: string) => void
  onValidityDaysChange: (v: string) => void
  onAnalystNameChange: (v: string) => void
  onNotesChange: (v: string) => void
  proposalMetadata: string | null
  savedAt: Date | null
  saving: boolean
  docxUrl: string | null
  pdfUrl: string | null
  generatingDocx: boolean
  generatingPdf: boolean
  onGenerateDocs: (fmt: 'docx' | 'pdf') => void
  proposalDate: string
}) {
  const cleanText = useMemo(
    () => substituteVars(stripMetadata(proposalMetadata), clientName, analystName, price, days, validityDays),
    [proposalMetadata, clientName, analystName, price, days, validityDays]
  )
  const unfilledFields = useMemo(() => findUnfilledFields(cleanText), [cleanText])

  const inputStyle: React.CSSProperties = { fontSize: 12, padding: '4px 8px' }

  return (
    <section >
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div className="eyebrow">Preview</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(['pdf', 'docx'] as const).map(fmt => {
            const url = fmt === 'docx' ? docxUrl : pdfUrl
            const generating = fmt === 'docx' ? generatingDocx : generatingPdf
            if (generating) return (
              <button key={fmt} className="oa-btn ghost sm" disabled
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                <Spinner size={10} />
                Gerando…
              </button>
            )
            return (
              <button key={fmt} className="oa-btn ghost sm"
                onClick={() => onGenerateDocs(fmt)}
                style={{ fontSize: 11, letterSpacing: '0.04em' }}>
                {url ? `↓ ${fmt.toUpperCase()}` : fmt.toUpperCase()}
              </button>
            )
          })}
        </div>
      </div>

      {!proposalMetadata ? (
        <div style={{ border: '1px solid var(--rule)', background: 'var(--paper-2)', padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: 13, marginBottom: 8 }}>Proposta ainda não gerada</div>
          <div style={{ fontSize: 11 }}>O pipeline precisa ser concluído para o preview ficar disponível.</div>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--rule)', background: 'var(--paper-2)', display: 'grid', gridTemplateColumns: '200px 1fr' }}>

          {/* LEFT SIDEBAR — edit fields */}
          <div style={{
            borderRight: '1px solid var(--rule)',
            padding: '20px 15px',
            display: 'flex', flexDirection: 'column', gap: 12,
            overflowY: 'auto', maxHeight: 820,
          }}>
            <div className="eyebrow" style={{ fontSize: 10, marginBottom: 2 }}>Dados da proposta</div>

            {/* Nome */}
            <div>
              <div className="eyebrow" style={{ marginBottom: 4, fontSize: 9 }}>Nome do cliente</div>
              <input className="oa-input" type="text" value={clientName} onChange={e => onClientNameChange(e.target.value)} placeholder="Nome completo" style={inputStyle} />
            </div>

            {/* Email */}
            <div>
              <div className="eyebrow" style={{ marginBottom: 4, fontSize: 9 }}>Email</div>
              <input className="oa-input" type="email" value={clientEmail} onChange={e => onClientEmailChange(e.target.value)} placeholder="email@exemplo.com" style={inputStyle} />
            </div>

            {/* Preço */}
            <div>
              <div className="eyebrow" style={{ marginBottom: 4, fontSize: 9 }}>Preço total (R$)</div>
              <input className="oa-input" type="text" inputMode="numeric" value={price} onChange={e => onPriceChange(parseBRLInput(e.target.value))} placeholder="0,00" style={{ ...inputStyle, fontSize: 15, fontWeight: 500, fontFamily: 'var(--mono)' }} />
            </div>

            {/* Prazo */}
            <div>
              <div className="eyebrow" style={{ marginBottom: 4, fontSize: 9 }}>Prazo (dias úteis)</div>
              <input className="oa-input" type="number" min="0" value={days} onChange={e => onDaysChange(e.target.value)} placeholder="0" style={{ ...inputStyle, fontSize: 15, fontWeight: 500, fontFamily: 'var(--mono)' }} />
            </div>

            {/* Validade */}
            <div>
              <div className="eyebrow" style={{ marginBottom: 4, fontSize: 9 }}>Validade da proposta (dias)</div>
              <input className="oa-input" type="number" min="1" value={validityDays} onChange={e => onValidityDaysChange(e.target.value)} placeholder="30" style={{ ...inputStyle, fontSize: 15, fontWeight: 500, fontFamily: 'var(--mono)' }} />
            </div>

            {/* Analista */}
            <div>
              <div className="eyebrow" style={{ marginBottom: 4, fontSize: 9 }}>Analista responsável</div>
              <input className="oa-input" type="text" value={analystName} onChange={e => onAnalystNameChange(e.target.value)} placeholder="Nome do analista" style={inputStyle} />
            </div>

            {/* Auto-save status */}
            <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 10 }}>
              {saving ? (
                <span className="mono" style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Spinner size={9} /> salvando…
                </span>
              ) : savedAt ? (
                <span className="mono" style={{ fontSize: 10, color: 'var(--ok)' }}>
                  ● salvo · {savedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : null}
            </div>

            {/* Notes */}
            <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 12 }}>
              <div className="eyebrow" style={{ marginBottom: 4, fontSize: 9 }}>Notas internas</div>
              <textarea className="oa-input" rows={4} value={notes} onChange={e => onNotesChange(e.target.value)}
                style={{ fontFamily: 'var(--sans)', fontSize: 11.5, lineHeight: 1.5, resize: 'vertical', width: '100%' }} />
            </div>
          </div>

          {/* RIGHT CANVAS — scrollable document */}
          <div style={{ padding: '16px 15px', overflowY: 'auto', maxHeight: 763 }}>
            {/* Document stack: Capa → Conteúdo → Assinaturas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.14)' }}>
                <CoverCard clientName={clientName || null} price={price} days={days} phaseCount={0} proposalDate={proposalDate} />
              </div>
              <div style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.14)' }}>
                <ProposalBody text={cleanText} />
              </div>
              <div style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.14)' }}>
                <SignaturePage clientName={clientName || null} analystName={analystName || null} />
              </div>
            </div>
          </div>

        </div>
      )}
    </section>
  )
}

export function ProposalDetail({ proposal: initialProposal, session, notificationBell }: { proposal: Proposal; session: Session; notificationBell?: React.ReactNode }) {
  const [proposal, setProposal] = useState(initialProposal)

  const [price, setPrice] = useState(
    proposal.total_price != null
      ? proposal.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : ''
  )
  const [days, setDays] = useState(proposal.total_days != null ? String(proposal.total_days) : '')
  const [validityDays, setValidityDays] = useState(proposal.validity_days != null ? String(proposal.validity_days) : '30')
  const [notes, setNotes] = useState(proposal.admin_notes ?? '')
  const [clientName, setClientName] = useState(proposal.client_name ?? '')
  const [clientEmail, setClientEmail] = useState(proposal.client_email ?? '')
  const [analystName, setAnalystName] = useState(proposal.analyst_name ?? '')

  // Desfecho fica fora do auto-save de propósito: registrar resultado é uma
  // decisão, não rascunho. E o backend recusa closed_value sem outcome='won',
  // então um save parcial no meio da digitação daria erro na cara do analista.
  const [outcome, setOutcome] = useState<Outcome>(proposal.outcome ?? 'pending')
  const [closedValue, setClosedValue] = useState(
    proposal.closed_value != null
      ? proposal.closed_value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : ''
  )
  const [actualHours, setActualHours] = useState(proposal.actual_hours != null ? String(proposal.actual_hours) : '')
  const [outcomeNotes, setOutcomeNotes] = useState(proposal.outcome_notes ?? '')
  const [savingOutcome, setSavingOutcome] = useState(false)

  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [generatingDocx, setGeneratingDocx] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [sending, setSending] = useState(false)
  const [preparingPdf, setPreparingPdf] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [retrying, setRetrying] = useState(false)

  const steps = resolveSteps(session, proposal.status)
  const isPipelineError = session.status === 'pipeline_error'
  const isSent = proposal.status === 'sent'
  const isRejected = proposal.status === 'rejected'

  // Auto-save on debounce — skips initial mount
  const isFirstRender = useRef(true)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => { handleSave() }, 800)
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [clientName, clientEmail, price, days, validityDays, analystName, notes])

  async function handleSave() {
    if (saving) return
    flushSync(() => { setSaving(true) })
    try {
      const token = await getToken()
      const body: Record<string, unknown> = {}
      const priceNum = brlToNumber(price)
      const daysNum = parseInt(days, 10)
      if (priceNum != null && priceNum > 0) body.total_price = priceNum
      if (!isNaN(daysNum) && daysNum > 0) body.total_days = daysNum
      const validityNum = parseInt(validityDays, 10)
      if (!isNaN(validityNum) && validityNum > 0) body.validity_days = validityNum
      body.admin_notes = notes || null
      body.client_name = clientName.trim() || null
      body.client_email = clientEmail.trim() || null
      body.analyst_name = analystName.trim() || null

      const res = await fetch(`${API_URL}/admin/proposals/${proposal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setProposal(data.proposal)
      setSavedAt(new Date())
    } catch {
      toast.error('Falha ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveOutcome() {
    if (savingOutcome) return
    flushSync(() => { setSavingOutcome(true) })
    try {
      const token = await getToken()
      const body: Record<string, unknown> = { outcome }

      // O backend rejeita valor fechado sem outcome='won' (e o banco também,
      // via CHECK). Só envia quando faz sentido.
      if (outcome === 'won') {
        const valueNum = brlToNumber(closedValue)
        if (valueNum != null && valueNum > 0) body.closed_value = valueNum
      }
      const hoursNum = parseInt(actualHours, 10)
      if (!isNaN(hoursNum) && hoursNum > 0) body.actual_hours = hoursNum
      body.outcome_notes = outcomeNotes.trim() || null

      const res = await fetch(`${API_URL}/admin/proposals/${proposal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setProposal(data.proposal)
      toast.success('Desfecho registrado.')
    } catch {
      toast.error('Falha ao registrar o desfecho. Tente novamente.')
    } finally {
      setSavingOutcome(false)
    }
  }

  async function handleGenerateDocs(fmt: 'docx' | 'pdf') {
    const isGenerating = fmt === 'docx' ? generatingDocx : generatingPdf
    if (isGenerating) return
    flushSync(() => {
      if (fmt === 'docx') setGeneratingDocx(true)
      else setGeneratingPdf(true)
    })
    try {
      const token = await getToken()
      const priceNum = brlToNumber(price)
      const daysNum = parseInt(days, 10)
      const overrides: Record<string, unknown> = {}
      if (clientName.trim()) overrides.client_name = clientName.trim()
      if (clientEmail.trim()) overrides.client_email = clientEmail.trim()
      if (analystName.trim()) overrides.analyst_name = analystName.trim()
      if (priceNum != null && priceNum > 0) overrides.total_price = priceNum
      if (!isNaN(daysNum) && daysNum > 0) overrides.total_days = daysNum
      const res = await fetch(`${API_URL}/admin/proposals/${proposal.id}/generate-docs?format=${fmt}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(overrides),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const url: string | undefined = fmt === 'docx' ? data.docx_url : data.pdf_url
      if (fmt === 'docx') setProposal(prev => ({ ...prev, docx_url: data.docx_url }))
      else setProposal(prev => ({ ...prev, pdf_url: data.pdf_url }))
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    } catch (err) {
      toast.error(`Falha ao gerar ${fmt.toUpperCase()}.`)
      console.error(err)
    } finally {
      if (fmt === 'docx') setGeneratingDocx(false)
      else setGeneratingPdf(false)
    }
  }

  async function handleSendClick() {
    if (preparingPdf || sending) return
    if (proposal.pdf_url) {
      setShowSendModal(true)
      return
    }
    flushSync(() => { setPreparingPdf(true) })
    try {
      const token = await getToken()
      const priceNum = brlToNumber(price)
      const daysNum = parseInt(days, 10)
      const overrides: Record<string, unknown> = {}
      if (clientName.trim()) overrides.client_name = clientName.trim()
      if (clientEmail.trim()) overrides.client_email = clientEmail.trim()
      if (analystName.trim()) overrides.analyst_name = analystName.trim()
      if (priceNum != null && priceNum > 0) overrides.total_price = priceNum
      if (!isNaN(daysNum) && daysNum > 0) overrides.total_days = daysNum
      const res = await fetch(`${API_URL}/admin/proposals/${proposal.id}/generate-docs?format=pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(overrides),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setProposal(prev => ({ ...prev, pdf_url: data.pdf_url }))
      setShowSendModal(true)
    } catch {
      toast.error('Falha ao preparar PDF para envio. Tente novamente.')
    } finally {
      setPreparingPdf(false)
    }
  }

  async function handleSend() {
    if (sending) return
    setShowSendModal(false)
    flushSync(() => { setSending(true) })
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/admin/proposals/${proposal.id}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setProposal(prev => ({ ...prev, status: 'sent', sent_at: new Date().toISOString() }))
      toast.success('Proposta enviada com sucesso!')
    } catch {
      toast.error('Falha ao enviar proposta.')
    } finally {
      setSending(false)
    }
  }

  async function handleRetry() {
    if (retrying) return
    flushSync(() => { setRetrying(true) })
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/admin/pipeline/${session.id}/retry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      window.location.reload()
    } catch {
      toast.error('Falha ao reprocessar pipeline.')
      setRetrying(false)
    }
  }

  const timeline: { label: string; kind: 'ok' | 'info' | 'error' }[] = []
  if (session.access_code) timeline.push({ label: `Código ${session.access_code} usado`, kind: 'info' })
  timeline.push({ label: `Entrevista iniciada · ${fmtDate(session.created_at)}`, kind: 'info' })
  if (session.discovery_summary) timeline.push({ label: 'Cliente aprovou discovery', kind: 'info' })
  if (isPipelineError) timeline.push({ label: `Erro no pipeline · etapa: ${session.error_step ?? 'desconhecida'}`, kind: 'error' })
  if (session.proposal_metadata) timeline.push({ label: 'Pipeline concluído', kind: 'ok' })
  if (proposal.sent_at) timeline.push({ label: `Proposta enviada · ${fmtDate(proposal.sent_at)}`, kind: 'ok' })

  return (
    <div>
      {/* HEADER */}
      <div style={{
        padding: '32px 40px 24px',
        borderBottom: '1px solid var(--rule)',
        background: 'var(--paper)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, justifyContent: 'space-between' }}>
          <div>
            <Link href="/admin/proposals" className="mono" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>
              ← Propostas
            </Link>
            <span style={{ color: 'var(--muted-2)' }}>-</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{shortId(proposal.id)}</span>
          </div>
          <div style={{ display: 'flex', gap: 30, alignItems: 'center', flexShrink: 0 }}>
            {notificationBell}
            <StatusBadge status={proposal.status} />
            <Link
              href={`/admin/proposals/${proposal.id}/interview`}
              target="_blank"
              className="oa-btn ghost sm"
              style={{ textDecoration: 'none', padding: '2px 10px', fontSize: 11, letterSpacing: '0.04em' }}
            >
              Ver entrevista ↗
            </Link>
            <Link
              href={`/admin/proposals/${proposal.id}/pipeline`}
              target="_blank"
              className="oa-btn ghost sm"
              style={{ textDecoration: 'none', padding: '2px 10px', fontSize: 11, letterSpacing: '0.04em' }}
            >
              Ver pipeline ↗
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="eyebrow" >Proposta · {proposal.client_name ?? '—'}<span className="mono"> · {shortId(session.id)}</span></div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 13, color: 'var(--muted)' }}>
            <span className="mono">{proposal.client_email ?? '—'}</span>
            <span className="mono"> · {fmtDate(proposal.created_at)}</span>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr' }}>
        {/* LEFT */}
        <div style={{ padding: '10px 15px 64px', borderRight: '1px solid var(--rule)' }}>

          {/* SECTION 03 — Preview + edit fields sidebar */}
          <ProposalPreview
            clientName={clientName}
            clientEmail={clientEmail}
            price={price}
            days={days}
            validityDays={validityDays}
            analystName={analystName}
            notes={notes}
            onClientNameChange={setClientName}
            onClientEmailChange={setClientEmail}
            onPriceChange={setPrice}
            onDaysChange={setDays}
            onValidityDaysChange={setValidityDays}
            onAnalystNameChange={setAnalystName}
            onNotesChange={setNotes}
            proposalMetadata={session.proposal_metadata}
            savedAt={savedAt}
            saving={saving}
            docxUrl={proposal.docx_url}
            pdfUrl={proposal.pdf_url}
            generatingDocx={generatingDocx}
            generatingPdf={generatingPdf}
            onGenerateDocs={handleGenerateDocs}
            proposalDate={proposal.created_at}
          />

        </div>

        {/* RIGHT */}
        <div style={{
          padding: '10px 15px 64px',
          background: 'var(--paper-2)',
          display: 'flex', flexDirection: 'column', gap: 28,
        }}>
          {/* SECTION 1 — Pipeline */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 2 }}>Pipeline</div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>Status do processamento</h3>
              </div>
              {isPipelineError && (
                <button
                  className="oa-btn ghost sm"
                  onClick={handleRetry}
                  disabled={retrying}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {retrying && <Spinner size={12} />}
                  {retrying ? 'Reprocessando…' : 'Reprocessar pipeline'}
                </button>
              )}
            </div>
            <div className="oa-card" style={{ padding: '20px 24px' }}>
              {steps.map((s, i) => {
                const isLast = i === steps.length - 1
                const sym = s.state === 'done' ? '✓' : s.state === 'error' ? '✕' : '•'
                const color =
                  s.state === 'done' ? 'var(--ok)' :
                    s.state === 'error' ? 'var(--danger)' :
                      s.state === 'current' ? 'var(--accent)' : 'var(--muted-2)'
                const bg =
                  s.state === 'current' ? 'var(--accent)' :
                    s.state === 'done' ? 'var(--ok-soft)' :
                      s.state === 'error' ? 'var(--danger-soft)' : 'var(--paper-2)'
                return (
                  <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 22 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 2, flexShrink: 0,
                        background: bg,
                        color: s.state === 'current' ? 'white' : color,
                        display: 'grid', placeItems: 'center',
                        fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600,
                      }}>{sym}</div>
                      {!isLast && <div style={{ flex: 1, width: 1, background: 'var(--rule)', margin: '2px 0' }} />}
                    </div>
                    <div style={{ flex: 1, paddingBottom: isLast ? 0 : 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{
                        fontSize: 14, fontWeight: s.state === 'current' ? 500 : 400,
                        color: s.state === 'pending' ? 'var(--muted-2)' : 'var(--ink)',
                      }}>{s.label}</div>
                      {s.state === 'error' && session.error_message && (
                        <div style={{ fontSize: 12, color: 'oklch(0.42 0.14 25)', fontFamily: 'var(--mono)', lineHeight: 1.4 }}>
                          {session.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Aside 2 — Send */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 2 }}>Aprovação</div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>Envio ao cliente</h3>
            </div>
            <div style={{
              padding: '14px 16px',
              background: 'var(--paper)',
              border: '1px solid var(--rule)',
              fontSize: 13,
            }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Destinatário</div>
              <div className="mono" style={{ fontSize: 13 }}>{proposal.client_email ?? '—'}</div>
              <div className="eyebrow" style={{ marginBottom: 6, marginTop: 12 }}>Anexo</div>
              <div className="mono" style={{ fontSize: 13 }}>
                {`proposta-${slugify(proposal.client_name ?? 'cliente')}.pdf`}
              </div>
            </div>

            {isSent ? (
              <div style={{
                padding: '12px 14px', background: 'var(--ok-soft)',
                borderLeft: '2px solid var(--ok)', fontSize: 13, color: 'oklch(0.40 0.10 145)',
              }}>
                ✓ Enviada em {proposal.sent_at ? fmtDate(proposal.sent_at) : '—'}
              </div>
            ) : isRejected ? (
              <div style={{
                padding: '10px 12px', background: 'var(--danger-soft)',
                borderLeft: '2px solid var(--danger)', fontSize: 13, color: 'oklch(0.42 0.14 25)',
              }}>
                Proposta rejeitada.
              </div>
            ) : (
              <>
                <button
                  className="oa-btn accent"
                  onClick={handleSendClick}
                  disabled={preparingPdf || sending}
                  style={{ width: '100%', padding: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {(preparingPdf || sending) && <Spinner size={14} color="rgba(255,255,255,0.9)" />}
                  {preparingPdf ? 'Preparando PDF…' : sending ? 'Enviando…' : <>Enviar proposta por email <span style={{ fontSize: 14 }}>→</span></>}
                </button>
                <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
                  pedirá confirmação antes do disparo
                </div>
              </>
            )}
          </section>

          {/* Aside — Desfecho comercial (só depois de enviada) */}
          {isSent && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 2 }}>resultado</div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>Desfecho comercial</h3>
              </div>
              <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                  O que o cliente respondeu. É daqui que sai a calibragem de preço e prazo
                  das próximas estimativas.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {OUTCOME_OPTIONS.map(opt => {
                    const active = outcome === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setOutcome(opt.value)}
                        className="oa-btn ghost sm"
                        style={{
                          padding: '7px 4px', fontSize: 11.5, justifyContent: 'center',
                          borderColor: active ? opt.color : 'var(--rule)',
                          color: active ? opt.color : 'var(--muted)',
                          background: active ? 'var(--paper-2)' : 'transparent',
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>

                {outcome === 'won' && (
                  <>
                    <div>
                      <div className="eyebrow" style={{ marginBottom: 4, fontSize: 9 }}>Valor fechado (R$)</div>
                      <input
                        className="oa-input" type="text" inputMode="numeric"
                        value={closedValue}
                        onChange={e => setClosedValue(parseBRLInput(e.target.value))}
                        placeholder="0,00"
                        style={{ fontSize: 13, padding: '5px 8px', fontFamily: 'var(--mono)', width: '100%' }}
                      />
                      <div style={{ fontSize: 10.5, color: 'var(--muted-2)', marginTop: 3 }}>
                        Quanto o cliente de fato pagou — pode diferir do que foi proposto.
                      </div>
                    </div>

                    <div>
                      <div className="eyebrow" style={{ marginBottom: 4, fontSize: 9 }}>Horas reais de entrega</div>
                      <input
                        className="oa-input" type="number" min="0"
                        value={actualHours}
                        onChange={e => setActualHours(e.target.value)}
                        placeholder="0"
                        style={{ fontSize: 13, padding: '5px 8px', fontFamily: 'var(--mono)', width: '100%' }}
                      />
                      <div style={{ fontSize: 10.5, color: 'var(--muted-2)', marginTop: 3 }}>
                        Preencha ao fim do projeto. É o que revela o ganho real de produtividade.
                      </div>
                    </div>
                  </>
                )}

                {outcome !== 'pending' && (
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 4, fontSize: 9 }}>
                      {outcome === 'lost' ? 'Por que perdeu' : 'Observações'}
                    </div>
                    <textarea
                      className="oa-input" rows={3}
                      value={outcomeNotes}
                      onChange={e => setOutcomeNotes(e.target.value)}
                      placeholder={outcome === 'lost' ? 'Preço, prazo, concorrente, projeto cancelado…' : ''}
                      style={{ fontFamily: 'var(--sans)', fontSize: 11.5, lineHeight: 1.5, resize: 'vertical', width: '100%' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <button
                    className="oa-btn ghost sm"
                    onClick={handleSaveOutcome}
                    disabled={savingOutcome}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    {savingOutcome && <Spinner size={11} />}
                    {savingOutcome ? 'Registrando…' : 'Registrar desfecho'}
                  </button>
                  {proposal.outcome_at && (
                    <span className="mono" style={{ fontSize: 10, color: 'var(--muted-2)' }}>
                      atualizado {fmtDate(proposal.outcome_at)}
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Aside 3 — Timeline */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 2 }}>histórico</div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>Linha do tempo</h3>
            </div>
            <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', padding: '8px 0' }}>
              {timeline.map((e, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 10,
                  padding: '8px 14px', fontSize: 12.5, alignItems: 'center',
                  borderTop: i === 0 ? 'none' : '1px solid var(--rule-2)',
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: e.kind === 'ok' ? 'var(--ok)' : e.kind === 'error' ? 'var(--danger)' : 'var(--muted-2)',
                  }} />
                  <span style={{ color: e.kind === 'error' ? 'oklch(0.42 0.14 25)' : 'var(--ink-2)' }}>{e.label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* SEND MODAL */}
      {showSendModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'grid', placeItems: 'center', zIndex: 100,
          }}
          onClick={() => setShowSendModal(false)}
        >
          <div
            style={{
              background: 'var(--paper)',
              border: '1px solid var(--rule)',
              padding: '32px',
              maxWidth: 440, width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="eyebrow" style={{ marginBottom: 8 }}>Confirmação de envio</div>
            <h2 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 500, letterSpacing: '-0.01em' }}>
              Enviar proposta?
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--muted)', lineHeight: 1.55 }}>
              A proposta será enviada por email para{' '}
              <strong className="mono" style={{ color: 'var(--ink)', fontWeight: 500 }}>{proposal.client_email}</strong>.
              {' '}Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="oa-btn ghost sm" onClick={() => setShowSendModal(false)}>
                Cancelar
              </button>
              <button
                className="oa-btn accent"
                onClick={handleSend}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                Confirmar envio →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
