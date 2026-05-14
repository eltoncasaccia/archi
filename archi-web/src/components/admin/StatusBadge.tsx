const STATUS_MAP: Record<string, { tone: string; label: string }> = {
  pending_review:  { tone: 'warn',   label: 'Aguardando' },
  approved:        { tone: 'info',   label: 'Aprovada' },
  sent:            { tone: 'ok',     label: 'Enviada' },
  rejected:        { tone: 'danger', label: 'Rejeitada' },
  pipeline_error:  { tone: 'danger', label: 'Erro' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { tone: 'muted', label: status }
  return <span className={`oa-badge ${s.tone}`}>{s.label}</span>
}
