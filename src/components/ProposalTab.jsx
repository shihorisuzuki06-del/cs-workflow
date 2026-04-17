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

  return (
    <div className="space-y-6">
      {/* Input area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">問い合わせ入力</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            カテゴリ
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            問い合わせ内容
          </label>
          <textarea
            value={inquiry}
            onChange={(e) => setInquiry(e.target.value)}
            rows={5}
            placeholder="お客様からの問い合わせ内容を入力してください..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <button
          onClick={handlePropose}
          disabled={loading || !inquiry.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
        >
          {loading ? '提案を生成中...' : '対応手順を提案'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Streaming / Result */}
      {(loading || result) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">対応手順の提案</h2>

          {loading && !result && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-2">生成中...</p>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                {streamText}
              </pre>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">要約:</span>
                <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-0.5 rounded-full">
                  {result.summary}
                </span>
              </div>

              {/* Steps */}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">対応ステップ:</p>
                <ol className="space-y-2">
                  {result.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-700 pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Notes */}
              {result.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-yellow-800 mb-1">補足事項</p>
                  <p className="text-sm text-yellow-900">{result.notes}</p>
                </div>
              )}

              {/* Save button */}
              <div className="pt-2">
                {saved ? (
                  <p className="text-sm text-green-600 font-medium">✓ 事例として保存しました</p>
                ) : (
                  <button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg px-5 py-2 text-sm transition-colors"
                  >
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
