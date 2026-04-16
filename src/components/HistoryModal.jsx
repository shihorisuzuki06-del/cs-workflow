export default function HistoryModal({ caseItem, history, onClose }) {
  const sorted = [...history].reverse()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">編集履歴</h2>
            <p className="text-xs text-gray-500 mt-0.5">{caseItem.summary}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {sorted.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              編集履歴はまだありません
            </p>
          ) : (
            sorted.map((version, i) => (
              <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-600">
                    バージョン {sorted.length - i}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(version.savedAt).toLocaleString('ja-JP')}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex gap-4 flex-wrap">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-0.5">タイトル</p>
                      <p className="text-sm text-gray-800">{version.summary}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-0.5">カテゴリ</p>
                      <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                        {version.category}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">お問い合わせ内容</p>
                    <p className="text-sm text-gray-700">{version.inquiry}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1.5">対応ステップ</p>
                    <ol className="space-y-1">
                      {version.steps.map((step, j) => (
                        <li key={j} className="flex gap-2 text-sm text-gray-700">
                          <span className="flex-shrink-0 text-blue-500 font-bold">{j + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {version.resolution && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">解決・補足</p>
                      <p className="text-sm text-gray-700">{version.resolution}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
