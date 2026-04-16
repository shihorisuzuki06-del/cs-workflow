import { useState } from 'react'

const CATEGORIES = [
  'ログイン・認証',
  '料金・請求',
  '機能の使い方',
  '技術的な問題',
  'アカウント管理',
  '解約・退会',
  'その他',
]

export default function CaseFormModal({ initial, onSave, onClose }) {
  const [summary, setSummary] = useState(initial?.summary || '')
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0])
  const [inquiry, setInquiry] = useState(initial?.inquiry || '')
  const [steps, setSteps] = useState(initial?.steps?.length ? initial.steps : [''])
  const [resolution, setResolution] = useState(initial?.resolution || '')

  function addStep() {
    setSteps([...steps, ''])
  }

  function removeStep(i) {
    if (steps.length <= 1) return
    setSteps(steps.filter((_, idx) => idx !== i))
  }

  function updateStep(i, value) {
    const updated = [...steps]
    updated[i] = value
    setSteps(updated)
  }

  function moveStep(i, direction) {
    const updated = [...steps]
    const target = i + direction
    if (target < 0 || target >= updated.length) return
    ;[updated[i], updated[target]] = [updated[target], updated[i]]
    setSteps(updated)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const validSteps = steps.filter((s) => s.trim())
    if (!summary.trim() || !inquiry.trim() || validSteps.length === 0) return
    onSave({ summary, category, inquiry, steps: validSteps, resolution })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {initial ? '事例を編集' : '事例を手動追加'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル（要約）<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: パスワードリセット対応"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              お問い合わせ内容<span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              value={inquiry}
              onChange={(e) => setInquiry(e.target.value)}
              required
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="お客様からの問い合わせ内容を入力してください"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              対応ステップ<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => updateStep(i, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`ステップ ${i + 1}`}
                  />
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => moveStep(i, -1)}
                      disabled={i === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs px-1"
                      title="上へ"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(i, 1)}
                      disabled={i === steps.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs px-1"
                      title="下へ"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStep(i)}
                      disabled={steps.length <= 1}
                      className="text-red-400 hover:text-red-600 disabled:opacity-30 text-xs px-1"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addStep}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + ステップを追加
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              解決・補足<span className="text-gray-400 text-xs font-normal ml-1">（任意）</span>
            </label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="解決内容や補足情報"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {initial ? '更新する' : '追加する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
