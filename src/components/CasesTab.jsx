import { useState } from 'react'
import { archiveCase, updateCase, saveCase, getCategories, getHistory } from '../lib/storage.js'
import CaseFormModal from './CaseFormModal.jsx'
import HistoryModal from './HistoryModal.jsx'

function highlight(text, keyword) {
  if (!keyword.trim()) return text
  const parts = text.split(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === keyword.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{part}</mark>
    ) : part
  )
}

function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })
}

const CATEGORY_COLORS = {
  'ログイン・認証':   'bg-violet-50 text-violet-700 ring-violet-200',
  '料金・請求':       'bg-amber-50 text-amber-700 ring-amber-200',
  '機能の使い方':     'bg-blue-50 text-blue-700 ring-blue-200',
  '技術的な問題':     'bg-red-50 text-red-700 ring-red-200',
  'アカウント管理':   'bg-teal-50 text-teal-700 ring-teal-200',
  'その他':           'bg-gray-50 text-gray-600 ring-gray-200',
}
const DEFAULT_BADGE = 'bg-gray-50 text-gray-600 ring-gray-200'

export default function CasesTab({ cases, onRefresh }) {
  const [keyword, setKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('すべて')
  const [expandedId, setExpandedId] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCase, setEditingCase] = useState(null)
  const [historyCase, setHistoryCase] = useState(null)
  const [historyData, setHistoryData] = useState([])

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

  function handleArchive(id) {
    if (!confirm('この事例をアーカイブしますか？（一覧から非表示になります）')) return
    archiveCase(id)
    onRefresh()
    if (expandedId === id) setExpandedId(null)
  }

  function handleAddSave(data) {
    saveCase(data)
    setShowAddModal(false)
    onRefresh()
  }

  function handleEditSave(data) {
    updateCase(editingCase.id, data)
    setEditingCase(null)
    onRefresh()
  }

  function handleViewHistory(c) {
    setHistoryData(getHistory(c.id))
    setHistoryCase(c)
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="キーワード検索..."
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            手動で追加
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          <span className="font-semibold text-gray-600">{filtered.length}</span> 件の事例
        </p>
      </div>

      {/* Cases list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-16 text-center">
          <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <p className="text-sm text-gray-400">該当する事例が見つかりませんでした</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((c) => {
            const isExpanded = expandedId === c.id
            const hasBeenUpdated = c.updatedAt && c.updatedAt !== c.createdAt
            const badgeClass = CATEGORY_COLORS[c.category] ?? DEFAULT_BADGE
            return (
              <div
                key={c.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Row */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50/80 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ring-1 ${badgeClass}`}>
                        {c.category}
                      </span>
                      <span className="font-semibold text-gray-800 text-sm">
                        {highlight(c.summary, keyword)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-1 max-w-lg">
                      {highlight(c.inquiry, keyword)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-[11px] text-gray-400">{formatDate(c.createdAt)}</p>
                      {hasBeenUpdated && (
                        <p className="text-[11px] text-gray-300">更新: {formatDate(c.updatedAt)}</p>
                      )}
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-gray-50/50">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">問い合わせ内容</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{highlight(c.inquiry, keyword)}</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">対応ステップ</p>
                      <ol className="space-y-1.5">
                        {c.steps.map((step, i) => (
                          <li key={i} className="flex gap-2.5 text-sm text-gray-700">
                            <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5">
                              {i + 1}
                            </span>
                            <span>{highlight(step, keyword)}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {c.resolution && (
                      <div>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">解決・補足</p>
                        <p className="text-sm text-gray-700">{highlight(c.resolution, keyword)}</p>
                      </div>
                    )}

                    <div className="flex gap-1 pt-2 border-t border-gray-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingCase(c) }}
                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                        編集
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleViewHistory(c) }}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        履歴
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleArchive(c.id) }}
                        className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors ml-auto"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25-2.25M3.375 7.5h17.25" />
                        </svg>
                        アーカイブ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showAddModal && (
        <CaseFormModal onSave={handleAddSave} onClose={() => setShowAddModal(false)} />
      )}
      {editingCase && (
        <CaseFormModal initial={editingCase} onSave={handleEditSave} onClose={() => setEditingCase(null)} />
      )}
      {historyCase && (
        <HistoryModal
          caseItem={historyCase}
          history={historyData}
          onClose={() => { setHistoryCase(null); setHistoryData([]) }}
        />
      )}
    </div>
  )
}
