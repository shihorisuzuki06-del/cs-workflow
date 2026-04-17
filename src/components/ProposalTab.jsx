import { useState } from 'react'
import { proposeProcedure } from '../lib/anthropic.js'
import { saveCase } from '../lib/storage.js'

// value はサーバーの許可リストと一致させる
const CATEGORIES = [
  { value: 'login',   label: 'ログイン・認証' },
  { value: 'payment', label: '料金・請求' },
  { value: 'feature', label: '機能の使い方' },
  { value: 'bug',     label: '技術的な問題' },
  { value: 'account', label: 'アカウント管理' },
  { value: 'other',   label: '解約・退会・その他' },
]

const CATEGORY_COLORS = {
  login:   'bg-violet-50 text-violet-700 ring-violet-200',
  payment: 'bg-amber-50 text-amber-700 ring-amber-200',
  feature: 'bg-blue-50 text-blue-700 ring-blue-200',
  bug:     'bg-red-50 text-red-700 ring-red-200',
  account: 'bg-teal-50 text-teal-700 ring-teal-200',
  other:   'bg-gray-50 text-gray-600 ring-gray-200',
}

export default function ProposalTab({ cases, onCaseSaved }) {
  const [inquiry, setInquiry] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0].value)
  const [loading, setLoading] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handlePropose() {
    if (!inquiry.trim()) return
    setLoading(true)
    setStreamText('')
    setResult(null)
    setError('')
    setSaved(false)

    try {
      const data = await proposeProcedure(
        { inquiry, category, cases },
        (chunk) => setStreamText(chunk)
      )
      setResult(data)
    } catch (e) {
      setError(e.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  function handleSave() {
    if (!result) return
    saveCase({
      category,
      inquiry,
      summary: result.summary,
      steps: result.steps,
      resolution: result.notes || '',
    })
    setSaved(true)
    onCaseSaved()
  }

  const catLabel = CATEGORIES.find((c) => c.value === category)?.label ?? category

  return (
    <div className="space-y-5">
      {/* Input card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">問い合わせ入力</h2>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ring-1 ${CATEGORY_COLORS[category]}`}>
            {catLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">カテゴリ</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              問い合わせ内容
              <span className="ml-2 text-gray-400 font-normal">{inquiry.length} / 1000</span>
            </label>
            <textarea
              value={inquiry}
              onChange={(e) => setInquiry(e.target.value)}
              rows={5}
              maxLength={1000}
              placeholder="お客様からの問い合わせ内容を入力してください..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-shadow"
            />
          </div>
        </div>

        <button
          onClick={handlePropose}
          disabled={loading || !inquiry.trim()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              提案を生成中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              対応手順を提案
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Result */}
      {(loading || result) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">対応手順の提案</h2>

          {loading && !result && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-2 font-medium">AI が生成中...</p>
              <pre className="text-xs text-gray-500 whitespace-pre-wrap font-mono leading-relaxed">
                {streamText}
              </pre>
            </div>
          )}

          {result && (
            <div className="space-y-5">
              {/* Summary badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">要約</span>
                <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {result.summary}
                </span>
              </div>

              {/* Steps */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-3">対応ステップ</p>
                <ol className="space-y-2.5">
                  {result.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-700 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Notes */}
              {result.notes && (
                <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  <div>
                    <p className="text-xs font-semibold text-amber-800 mb-0.5">補足事項</p>
                    <p className="text-sm text-amber-900">{result.notes}</p>
                  </div>
                </div>
              )}

              {/* Save */}
              <div className="pt-1 border-t border-gray-100">
                {saved ? (
                  <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    事例として保存しました
                  </div>
                ) : (
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                    </svg>
                    この手順を事例として保存
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
