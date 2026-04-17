import { useState, useCallback } from 'react'
import { loadCases } from './lib/storage.js'
import ProposalTab from './components/ProposalTab.jsx'
import CasesTab from './components/CasesTab.jsx'
import FlowTab from './components/FlowTab.jsx'
import CsvImportModal from './components/CsvImportModal.jsx'
import { useAuth, openLogin, logout } from './lib/auth.jsx'

// ── Icons ────────────────────────────────────────────────────
const IconSparkles = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
)
const IconDatabase = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
  </svg>
)
const IconFlow = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
)
const IconUpload = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
)
const IconMenu = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
)
const IconLogout = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
)

const NAV_ITEMS = [
  { id: 'proposal', label: '対応提案', Icon: IconSparkles },
  { id: 'cases',    label: '事例一覧', Icon: IconDatabase },
  { id: 'flow',     label: 'フロー図', Icon: IconFlow },
]

const PAGE_META = {
  proposal: { title: '対応提案',  desc: 'AIが過去事例をもとに最適な対応手順を提案します' },
  cases:    { title: '事例一覧',  desc: '登録済みの対応事例を検索・管理します' },
  flow:     { title: 'フロー図',  desc: '対応手順をフロー図で可視化します' },
}

// ── Login Screen ─────────────────────────────────────────────
function LoginScreen() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center">
              <IconSparkles />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">CS Flow</span>
          </div>
          <p className="text-slate-400 text-sm">カスタマーサポート ワークフロー支援ツール</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h2 className="text-white font-semibold text-lg mb-1">ログイン</h2>
          <p className="text-slate-400 text-sm mb-6">ご利用には Google アカウントが必要です</p>
          <button
            onClick={openLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google でログイン
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Sidebar ──────────────────────────────────────────────────
function Sidebar({ activeTab, onTabChange, onImportClick, user, open, onClose }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-60 bg-[#0F172A] flex flex-col z-30
        transition-transform duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 text-white">
              <IconSparkles />
            </div>
            <div>
              <p className="text-white font-bold text-base tracking-tight leading-none">CS Flow</p>
              <p className="text-slate-500 text-[10px] mt-0.5">Workflow Tool</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5">
          <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
            Navigation
          </p>
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => { onTabChange(id); onClose() }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left
                ${activeTab === id
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }
              `}
            >
              <Icon />
              <span>{label}</span>
              {activeTab === id && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              )}
            </button>
          ))}

          <div className="pt-4">
            <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
              Actions
            </p>
            <button
              onClick={() => { onImportClick(); onClose() }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 transition-all text-left"
            >
              <IconUpload />
              CSVインポート
            </button>
          </div>
        </nav>

        {/* User */}
        {user && (
          <div className="px-3 py-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="avatar"
                  className="w-8 h-8 rounded-full flex-shrink-0 ring-2 ring-white/10"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400 text-xs font-bold">
                    {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 text-xs font-medium truncate">
                  {user.user_metadata?.full_name || user.email}
                </p>
                {user.user_metadata?.full_name && (
                  <p className="text-slate-500 text-[10px] truncate">{user.email}</p>
                )}
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-2 py-2 mt-0.5 rounded-lg text-xs text-slate-500 hover:bg-white/[0.04] hover:text-slate-300 transition-all"
            >
              <IconLogout />
              ログアウト
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

// ── App ──────────────────────────────────────────────────────
export default function App() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('proposal')
  const [cases, setCases] = useState(() => loadCases())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  const refreshCases = useCallback(() => {
    setCases(loadCases())
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">読み込み中...</span>
        </div>
      </div>
    )
  }

  if (!user) return <LoginScreen />

  const page = PAGE_META[activeTab]

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onImportClick={() => setShowImportModal(true)}
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:ml-60 flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden bg-[#0F172A] px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-300 hover:text-white p-1 -ml-1">
            <IconMenu />
          </button>
          <span className="text-white font-bold tracking-tight">CS Flow</span>
        </header>

        {/* Page header */}
        <div className="bg-white border-b border-gray-200/80 px-6 lg:px-8 py-5">
          <h1 className="text-[17px] font-semibold text-gray-900 tracking-tight">{page.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{page.desc}</p>
        </div>

        {/* Main content */}
        <main className="flex-1 px-6 lg:px-8 py-6 max-w-5xl w-full">
          {activeTab === 'proposal' && <ProposalTab cases={cases} onCaseSaved={refreshCases} />}
          {activeTab === 'cases'    && <CasesTab cases={cases} onRefresh={refreshCases} />}
          {activeTab === 'flow'     && <FlowTab cases={cases} onCaseUpdated={refreshCases} />}
        </main>
      </div>

      {showImportModal && (
        <CsvImportModal
          onImported={refreshCases}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  )
}
