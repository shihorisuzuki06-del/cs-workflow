const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'google/gemini-2.0-flash-001'

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const apiKey = process.env.CS_FLOW_OPENROUTER_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key not configured on server' }),
    }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) }
  }

  const { inquiry, category, cases = [] } = body
  if (!inquiry || !category) {
    return { statusCode: 400, body: JSON.stringify({ error: 'inquiry and category are required' }) }
  }

  const systemPrompt = `あなたはカスタマーサポート（CS）チームの対応支援AIです。
お客様からの問い合わせに対して、具体的で実践的な対応手順を提案してください。

## 出力形式
以下のJSON形式で回答してください（コードブロック不要、JSONのみ）:
{
  "summary": "この対応の要約（20文字以内）",
  "steps": [
    "ステップ1の内容",
    "ステップ2の内容",
    ...
  ],
  "notes": "補足事項や注意点（任意）"
}

## 対応のポイント
- お客様の感情に寄り添いながら、迅速・丁寧に対応する
- 各ステップは具体的なアクションを示す
- エスカレーションが必要な場合はそのタイミングを明記する
- ステップは3〜7個程度にまとめる`

  const casesContext =
    cases.length > 0
      ? `## 過去の対応事例\n\n${cases
          .slice(0, 10)
          .map(
            (c, i) =>
              `### 事例${i + 1}: ${c.summary}（カテゴリ: ${c.category}）\n問い合わせ: ${c.inquiry}\n対応手順:\n${c.steps.map((s, j) => `${j + 1}. ${s}`).join('\n')}\n解決: ${c.resolution}`
          )
          .join('\n\n')}`
      : '## 過去の対応事例\nまだ事例がありません。'

  const userMessage = `## 問い合わせカテゴリ
${category}

## 問い合わせ内容
${inquiry}

上記の問い合わせに対する対応手順をJSONで提案してください。`

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: `${systemPrompt}\n\n${casesContext}` },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: err?.error?.message || `OpenRouter error: ${response.status}` }),
      }
    }

    const data = await response.json()
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: err.message || 'Failed to reach OpenRouter' }),
    }
  }
}
