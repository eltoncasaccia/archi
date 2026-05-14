const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export class SessionExpiredError extends Error {
  constructor() { super('session_expired') }
}

export async function validateCode(code: string) {
  const res = await fetch(`${API_URL}/session/validate-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  return res.json()
}

export async function streamMessage(
  sessionId: string,
  content: string,
  onDelta: (delta: string) => void,
): Promise<{ fullText: string; limitReached: boolean }> {
  const res = await fetch(`${API_URL}/session/${sessionId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })

  if (res.status === 401) throw new SessionExpiredError()
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''
  let limitReached = false

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') return { fullText, limitReached }
      try {
        const parsed = JSON.parse(data)
        if (parsed.delta) {
          fullText += parsed.delta
          onDelta(parsed.delta)
        }
        if (parsed.limit_reached) limitReached = true
        if (parsed.error) throw new Error(parsed.error)
      } catch (e) {
        if (e instanceof SyntaxError) continue /* ignore malformed chunks */
        throw e
      }
    }
  }

  return { fullText, limitReached }
}

export async function approveSession(sessionId: string) {
  const res = await fetch(`${API_URL}/session/${sessionId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  if (res.status === 401) throw new SessionExpiredError()
  return res.json()
}

export async function logoutSession(sessionId: string) {
  await fetch(`${API_URL}/session/${sessionId}/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function getSessionResume(sessionId: string): Promise<{
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string }>
  status: string
  has_pending_approval: boolean
}> {
  const res = await fetch(`${API_URL}/session/${sessionId}/resume`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function uploadDocument(
  sessionId: string,
  file: File,
): Promise<{ filename: string; extracted_text: string; char_count: number }> {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${API_URL}/session/${sessionId}/upload-document`, {
    method: 'POST',
    body: form,
  })

  if (res.status === 401) throw new SessionExpiredError()
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { detail?: string }).detail ?? 'Erro ao processar o documento.')
  }
  return res.json()
}
