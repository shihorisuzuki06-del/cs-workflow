const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'google/gemini-2.0-flash-001'
const ALLOWED_ORIGIN = 'https://whimsical-jalebi-97dbd3.netlify.app'

// 2. カテゴリ許可リスト
const ALLOWED_CATEGORIES = ['login', 'payment', 'bug', 'account', 'feature', 'other']

// 3. cases フィールド上限
const CASES_MAX_COUNT = 10
const CASE_FIELD_LIMITS = {
  title:   100,
  inquiry: 1000,
  step:    200,
  steps:   10,
}

// ── 1. レート制限 ────────────────────────────────────────────
const rateLimitStore = new Map()
const RATE_LIMIT  = 10
const RATE_WINDOW = 60_000

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
  const allowed = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function json(statusCode, payload, origin, extra = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin), ...extra },
    body: JSON.stringify(payload),
  }
}

// 3. cases バリデーション
function validateCases(cases) {
  if (!Array.isArray(cases)) return 'cases must be an array.'
  if (cases.length > CASES_MAX_COUNT) {
    return `cases は最大 ${CASES_MAX_COUNT} 件までです。`
  }
  for (let i = 0; i < cases.length; i++) {
    const c = cases[i]
    if (typeof c !== 'object' || c === null) return `cases[${i}] が不正な形式です。`

    if (c.summary && typeof c.summary === 'string' && c.summary.length > CASE_FIELD_LIMITS.title) {
      return `cases[${i}].summary は ${CASE_FIELD_LIMITS.title} 文字以内にしてください。`
    }
    if (c.inquiry && typeof c.inquiry === 'string' && c.inquiry.length > CASE_FIELD_LIMITS.inquiry) {
      return `cases[${i}].inquiry は ${CASE_FIELD_LIMITS.inquiry} 文字以内にしてください。`
    }
    if (c.steps !== undefined) {
      if (!Array.isArray(c.steps)) return `cases[${i}].steps は配列である必要があります。`
      if (c.steps.length > CASE_FIELD_LIMITS.steps) {
        return `cases[${i}].steps は最大 ${CASE_FIELD_LIMITS.steps} 件までです。`
      }
      for (let j = 0; j < c.steps.length; j++) {
        if (typeof c.steps[j] === 'string' && c.steps[j].length > CASE_FIELD_LIMITS.step) {
          return `cases[${i}].steps[${j}] は ${CASE_FIELD_LIMITS.step} 文字以内にしてください。`
        }
      }
    }
  }
  return null
}

// ── ハンドラー ────────────────────────────────────────────────
exports.handler = async (event, context) => {
  const origin = event.headers?.origin ?? ''

  // preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(origin), body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' }, origin)
  }

  // CORS チェック
  if (origin && origin !== ALLOWED_ORIGIN) {
    return json(403, { error: 'Forbidden' }, origin)
  }

  // ── 1. 認証チェック ─────────────────────────────────────────
  // Netlify は Authorization ヘッダーの Identity JWT を自動検証し
  // context.clientContext.user に注入する
  const user = context.clientContext?.user
  if (!user) {
    return json(401, { error: 'Unauthorized. ログインが必要です。' }, origin)
  }

  // レート制限
  const ip =
    event.headers?.['x-nf-client-connection-ip'] ??
    event.headers?.['x-forwarded-for']?.split(',')[0].trim() ??
    'unknown'

  if (isRateLimited(ip)) {
    return json(429, { error: 'Too many requests. Please wait a moment.' }, origin, {
      'Retry-After': '60',
    })
  }

  const apiKey = process.env.CS_FLOW_OPENROUTER_KEY
  if (!apiKey) {
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

  // 入力バリデーション
  if (!inquiry || inquiry.trim().length === 0) {
    return json(400, { error: 'お問い合わせ内容を入力してください。' }, origin)
  }
  if (inquiry.length > 1000) {
    return json(400, { error: 'お問い合わせ内容は1000文字以内で入力してください。' }, origin)
  }

  // ── 2. category 許可リスト検証 ───────────────────────────────
  if (!category || !ALLOWED_CATEGORIES.includes(category)) {
    return json(400, { error: `カテゴリが不正です。許可値: ${ALLOWED_CATEGORIES.join(', ')}` }, origin)
  }

  // ── 3. cases バリデーション ──────────────────────────────────
  const casesError = validateCases(cases)
  if (casesError) {
    return json(400, { error: casesError }, origin)
  }

  const CATEGORY_LABELS = {
    login:   'ログイン・認証',
    payment: '料金・請求',
    feature: '機能の使い方',
    bug:     '技術的な問題',
    account: 'アカウント管理',
    other:   'その他',
  }
  const categoryLabel = CATEGORY_LABELS[category] ?? category

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
          .slice(0, CASES_MAX_COUNT)
          .map(
            (c, i) =>
              `### 事例${i + 1}: ${c.summary}（カテゴリ: ${c.category}）\n問い合わせ: ${c.inquiry}\n対応手順:\n${c.steps.map((s, j) => `${j + 1}. ${s}`).join('\n')}\n解決: ${c.resolution}`
          )
          .join('\n\n')}`
      : '## 過去の対応事例\nまだ事例がありません。'

  const userMessage = `## 問い合わせカテゴリ
${categoryLabel}

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
      console.error('OpenRouter error:', response.status, err)
      return json(502, { error: 'AI サービスとの通信に失敗しました。しばらく経ってから再試行してください。' }, origin)
    }

    const data = await response.json()
    return json(200, data, origin)
  } catch (err) {
    console.error('Unhandled error in propose:', err)
    return json(502, { error: 'サーバーエラーが発生しました。しばらく経ってから再試行してください。' }, origin)
  }
}
