import { useState } from 'react'
import { deleteCase, getCategories } from '../lib/storage.js'

function highlight(text, keyword) {
  if (!keyword.trim()) return text
  const parts = text.split(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === keyword.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

export default function CasesTab({ cases, onDeleted }) {
  const [keyword, setKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('すべて')
  const [expandedId, setExpandedId] = useState(null)

  const categories = getCategories(cases)

  const filtered = cases.filter((c) => {
    const matchCat = selectedCategory === 'すべて' || c.category === selectedCategory
    const kw = keyword.toLowerCase()
    const matchKw =
      !kw ||
      c.inquiry.toLowerCase().includes(kw) ||
      c.summary.toLowerCase().includes(kw) ||
      c.steps.some((s) => s.toLowerCase().includes(kw))
    return matchCat && matchKw
  })

  function handleDelete(id) {
    if (!confirm('この事例を削除しますか？')) return
    deleteCase(id)
    onDeleted()
    if (expandedId === id) setExpandedId(null)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="キーワード検索..."
            className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-gray-500">{filtered.length} 件の事例</p>
      </div>

      {/* Cases list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          該当する事例が見つかりませんでした
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const isExpanded = expandedId === c.id
            return (
              <div
                key={c.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Header */}
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                        {c.category}
                      </span>
                      <span className="font-semibold text-gray-800 text-sm">
                        {highlight(c.summary, keyword)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {highlight(c.inquiry, keyword)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(c.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-gray-400 text-sm select-none">
                    {isExpanded ? '▲' : '▼'}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">問い合わせ内容</p>
                      <p className="text-sm text-gray-700">{highlight(c.inquiry, keyword)}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">対応ステップ</p>
                      <ol className="space-y-1">
                        {c.steps.map((step, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-700">
                            <span className="flex-shrink-0 text-blue-500 font-bold">{i + 1}.</span>
                            <span>{highlight(step, keyword)}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {c.resolution && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">解決・補足</p>
                        <p className="text-sm text-gray-700">{highlight(c.resolution, keyword)}</p>
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
