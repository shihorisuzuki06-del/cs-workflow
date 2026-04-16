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
    <div className="space-y-6">
      {/* Case selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">事例を選択</h2>
        <select
          value={selectedId}
          onChange={(e) => handleSelectCase(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{selected.summary}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{selected.category}</p>
            </div>
            {!editMode && (
              <button
                onClick={handleEditStart}
                className="flex-shrink-0 text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
              >
                ステップを編集
              </button>
            )}
          </div>

          {editMode ? (
            <div className="space-y-3 border border-blue-100 rounded-lg p-4 bg-blue-50/30">
              <p className="text-sm font-medium text-gray-700">ステップを編集</p>
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
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        disabled={i === editSteps.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs px-1"
                        title="下へ"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStep(i)}
                        disabled={editSteps.length <= 1}
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
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + ステップを追加
              </button>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
                >
                  保存
                </button>
                <button
                  onClick={handleEditCancel}
                  className="text-gray-600 border border-gray-300 text-sm rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <FlowDiagram steps={selected.steps} />
          )}

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500 mb-1">問い合わせ内容</p>
            <p className="text-sm text-gray-700">{selected.inquiry}</p>
          </div>

          {selected.resolution && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">解決・補足</p>
              <p className="text-sm text-gray-700">{selected.resolution}</p>
            </div>
          )}
        </div>
      )}

      {!selectedId && cases.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          まだ事例がありません。「対応提案」タブで事例を作成・保存してください。
        </div>
      )}
    </div>
  )
}
