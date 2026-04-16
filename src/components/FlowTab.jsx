import { useState } from 'react'
import FlowDiagram from './FlowDiagram.jsx'

export default function FlowTab({ cases }) {
  const [selectedId, setSelectedId] = useState('')

  const selected = cases.find((c) => c.id === selectedId)

  return (
    <div className="space-y-6">
      {/* Case selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">事例を選択</h2>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
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
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{selected.summary}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{selected.category}</p>
          </div>

          <FlowDiagram steps={selected.steps} />

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
