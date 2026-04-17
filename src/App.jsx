import { useState, useCallback } from 'react'
import { loadCases } from './lib/storage.js'
import ProposalTab from './components/ProposalTab.jsx'
import CasesTab from './components/CasesTab.jsx'
import FlowTab from './components/FlowTab.jsx'
import { useAuth, openLogin, logout } from './lib/auth.jsx'

const TABS = [
  { id: 'proposal', label: '対応提案' },
  { id: 'cases', label: '事例一覧' },
  { id: 'flow', label: 'フロー図' },
]

function LoginScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 flex flex-col items-center gap-6 w-full max-w-sm">
        <h1 className="text-xl font-bold text-gray-900">CS ワークフロー提案ツール</h1>
        <p className="text-sm text-gray-500 text-center">
          ご利用にはログインが必要です
        </p>
        <button
          onClick={openLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google でログイン
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('proposal')
  const [cases, setCases] = useState(() => loadCases())

  const refreshCases = useCallback(() => {
    setCases(loadCases())
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-sm text-gray-400">読み込み中...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              CS ワークフロー提案ツール
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              AIが過去事例をもとに最適な対応手順を提案します
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt="avatar"
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm text-gray-600 hidden sm:block">
              {user.user_metadata?.full_name || user.email}
            </span>
            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              ログアウト
            </button>
          </div>
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
          <CasesTab cases={cases} onRefresh={refreshCases} />
        )}
        {activeTab === 'flow' && (
          <FlowTab cases={cases} onCaseUpdated={refreshCases} />
        )}
      </main>
    </div>
  )
}
