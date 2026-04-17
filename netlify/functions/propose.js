const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'google/gemini-2.0-flash-001'
const ALLOWED_ORIGIN = 'https://whimsical-jalebi-97dbd3.netlify.app'

// ── 1. レート制限 ────────────────────────────────────────────
// キー: IP、値: { count, resetAt }
const rateLimitStore = new Map()
const RATE_LIMIT = 10       // 最大リクエスト数
const RATE_WINDOW = 60_000  // ウィンドウ幅（ms）

function isRateLimited(ip) {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return false
  }
  if (entry.count >= RATE_LIMIT) return true
  entry.count++
  return false
}

// ── ヘルパー ─────────────────────────────────────────────────
function corsHeaders(origin) {
  // 3. CORS: 許可オリジンのみ Access-Control-Allow-Origin を返す
  const allowed = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function json(statusCode, payload, origin) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    body: JSON.stringify(payload),
  }
}

// ── ハンドラー ────────────────────────────────────────────────
exports.handler = async (event) => {
  const origin = event.headers?.origin ?? ''

  // preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(origin), body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' }, origin)
  }

  // 3. CORS: 許可されていないオリジンはここで弾く
  if (origin && origin !== ALLOWED_ORIGIN) {
    return json(403, { error: 'Forbidden' }, origin)
  }

  // 1. レート制限
  const ip =
    event.headers?.['x-forwarded-for']?.split(',')[0].trim() ??
    event.headers?.['client-ip'] ??
    'unknown'

  if (isRateLimited(ip)) {
    return json(429, { error: 'Too many requests. Please wait a moment.' }, origin)
  }

  const apiKey = process.env.CS_FLOW_OPENROUTER_KEY
  if (!apiKey) {
    // 4. 内部エラーは詳細を隠す
    return json(500, { error: 'Server configuration error.' }, origin)
  }

  // JSON パース
  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return json(400, { error: 'Invalid request format.' }, origin)
  }

  const { inquiry, category, cases = [] } = body

  // 2. 入力バリデーション
  if (!inquiry || inquiry.trim().length === 0) {
    return json(400, { error: 'お問い合わせ内容を入力してください。' }, origin)
  }
  if (inquiry.length > 1000) {
    return json(400, { error: 'お問い合わせ内容は1000文字以内で入力してください。' }, origin)
  }
  if (!category) {
    return json(400, { error: 'カテゴリを選択してください。' }, origin)
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
      // 4. 上流エラーの詳細はログに留め、ユーザーには汎用メッセージを返す
      const err = await response.json().catch(() => ({}))
      console.error('OpenRouter error:', response.status, err)
      return json(502, { error: 'AI サービスとの通信に失敗しました。しばらく経ってから再試行してください。' }, origin)
    }

    const data = await response.json()
    return json(200, data, origin)
  } catch (err) {
    // 4. スタックトレース等は返さない
    console.error('Unhandled error in propose:', err)
    return json(502, { error: 'サーバーエラーが発生しました。しばらく経ってから再試行してください。' }, origin)
  }
}
