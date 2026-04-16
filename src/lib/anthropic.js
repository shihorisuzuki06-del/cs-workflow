export async function proposeProcedure({ inquiry, category, cases }, onChunk) {
  const response = await fetch('/api/propose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inquiry, category, cases }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error || `サーバーエラー: ${response.status}`)
  }

  const data = await response.json()
  const fullText = data.choices?.[0]?.message?.content ?? ''

  onChunk(fullText)

  try {
    const jsonMatch = fullText.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    throw new Error('JSON not found in response')
  } catch {
    return { summary: '対応手順', steps: [fullText], notes: '' }
  }
}
