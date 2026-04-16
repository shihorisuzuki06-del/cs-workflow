import { useState, useCallback } from 'react'
import { loadCases } from './lib/storage.js'
import ProposalTab from './components/ProposalTab.jsx'
import CasesTab from './components/CasesTab.jsx'
import FlowTab from './components/FlowTab.jsx'

const TABS = [
  { id: 'proposal', label: '対応提案' },
  { id: 'cases', label: '事例一覧' },
  { id: 'flow', label: 'フロー図' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('proposal')
  const [cases, setCases] = useState(() => loadCases())

  const refreshCases = useCallback(() => {
    setCases(loadCases())
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">
            CS ワークフロー提案ツール
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            AIが過去事例をもとに最適な対応手順を提案します
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'proposal' && (
          <ProposalTab cases={cases} onCaseSaved={refreshCases} />
        )}
        {activeTab === 'cases' && (
          <CasesTab cases={cases} onDeleted={refreshCases} />
        )}
        {activeTab === 'flow' && (
          <FlowTab cases={cases} />
        )}
      </main>
    </div>
  )
}
