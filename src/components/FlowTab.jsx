import { useState } from 'react'
import FlowDiagram from './FlowDiagram.jsx'
import { updateCase } from '../lib/storage.js'

export default function FlowTab({ cases, onCaseUpdated }) {
  const [selectedId, setSelectedId] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editSteps, setEditSteps] = useState([])

  const selected = cases.find((c) => c.id === selectedId)

  function handleSelectCase(id) {
    setSelectedId(id)
    setEditMode(false)
    setEditSteps([])
  }

  function handleEditStart() {
    setEditSteps([...selected.steps])
    setEditMode(true)
  }

  function handleEditCancel() {
    setEditMode(false)
    setEditSteps([])
  }

  function handleStepChange(i, value) {
    const updated = [...editSteps]
    updated[i] = value
    setEditSteps(updated)
  }

  function addStep() {
    setEditSteps([...editSteps, ''])
  }

  function removeStep(i) {
    if (editSteps.length <= 1) return
    setEditSteps(editSteps.filter((_, idx) => idx !== i))
  }

  function moveStep(i, direction) {
    const updated = [...editSteps]
    const target = i + direction
    if (target < 0 || target >= updated.length) return
    ;[updated[i], updated[target]] = [updated[target], updated[i]]
    setEditSteps(updated)
  }

  function handleSave() {
    const validSteps = editSteps.filter((s) => s.trim())
    if (validSteps.length === 0) return
    updateCase(selectedId, { steps: validSteps })
    setEditMode(false)
    setEditSteps([])
    onCaseUpdated()
  }

  return (
    <div className="space-y-5">
      {/* Case selector */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          事例を選択
        </label>
        <select
          value={selectedId}
          onChange={(e) => handleSelectCase(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- 事例を選んでください --</option>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              [{c.category}] {c.summary}
            </option>
          ))}
        </select>
      </div>

      {/* Flow diagram */}
      {selected && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{selected.summary}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{selected.category}</p>
            </div>
            {!editMode && (
              <button
                onClick={handleEditStart}
                className="flex items-center gap-1.5 flex-shrink-0 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
                ステップを編集
              </button>
            )}
          </div>

          {editMode ? (
            <div className="space-y-3 border border-blue-100 rounded-xl p-5 bg-blue-50/30">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ステップを編集</p>
              <div className="space-y-2">
                {editSteps.map((step, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleStepChange(i, e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => moveStep(i, -1)}
                        disabled={i === 0}
                        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                        title="上へ"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(i, 1)}
                        disabled={i === editSteps.length - 1}
                        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                        title="下へ"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStep(i)}
                        disabled={editSteps.length <= 1}
                        className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addStep}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                ステップを追加
              </button>
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
                >
                  保存
                </button>
                <button
                  onClick={handleEditCancel}
                  className="text-gray-600 border border-gray-200 text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <FlowDiagram steps={selected.steps} />
          )}

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">問い合わせ内容</p>
              <p className="text-sm text-gray-700 leading-relaxed">{selected.inquiry}</p>
            </div>
            {selected.resolution && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">解決・補足</p>
                <p className="text-sm text-gray-700">{selected.resolution}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedId && cases.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-16 text-center">
          <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          <p className="text-sm text-gray-400">まだ事例がありません</p>
          <p className="text-xs text-gray-300 mt-1">「対応提案」タブで事例を作成・保存してください</p>
        </div>
      )}
    </div>
  )
}
