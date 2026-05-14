'use client'

import { useState } from 'react'

const TABS = [
  { k: 'discovery', label: 'Discovery Summary' },
  { k: 'pricing', label: 'Pricing Summary' },
  { k: 'phases', label: 'Phases Plan' },
  { k: 'meta', label: 'Proposal Metadata' },
] as const

type TabKey = typeof TABS[number]['k']

export function PipelineTabs({ content }: { content: Record<TabKey, string> }) {
  const [tab, setTab] = useState<TabKey>('discovery')
  return (
    <div className="oa-card">
      <div style={{ display: 'flex', borderBottom: '1px solid var(--rule)', background: 'var(--paper-2)' }}>
        {TABS.map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            style={{
              padding: '12px 18px', border: 0, background: 'transparent', cursor: 'pointer',
              fontSize: 12, fontFamily: 'var(--mono)',
              color: tab === t.k ? 'var(--ink)' : 'var(--muted)',
              borderBottom: tab === t.k ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1, textTransform: 'uppercase', letterSpacing: '0.06em',
            }}
          >{t.label}</button>
        ))}
      </div>
      <pre style={{
        margin: 0, padding: '18px 22px',
        fontSize: 12.5, lineHeight: 1.65,
        fontFamily: 'var(--mono)', color: 'var(--ink-2)',
        whiteSpace: 'pre-wrap', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto',
        background: 'var(--paper)',
      }}>{content[tab]}</pre>
    </div>
  )
}
