import { useState, useRef } from 'react'
import { loadCases, saveCase } from '../lib/storage.js'

const VALID_CATEGORIES = [
  'ログイン・認証',
  '料金・請求',
  '機能の使い方',
  '技術的な問題',
  'アカウント管理',
  '解約・退会',
  'その他',
]

const EXPECTED_HEADERS = [
  'タイトル',
  'カテゴリ',
  'お問い合わせ内容',
  'ステップ1',
  'ステップ2',
  'ステップ3',
  'ステップ4',
  'ステップ5',
]

// Simple CSV parser (handles quoted fields, CRLF/LF, BOM)
function parseCSV(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1) // BOM除去

  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        row.push(field)
        field = ''
      } else if (ch === '\r' && next === '\n') {
        row.push(field)
        field = ''
        rows.push(row)
        row = []
        i++
      } else if (ch === '\n' || ch === '\r') {
        row.push(field)
        field = ''
        rows.push(row)
        row = []
      } else {
        field += ch
      }
    }
  }

  if (row.length > 0 || field) {
    row.push(field)
    rows.push(row)
  }

  // 末尾の空行を除去
  while (rows.length > 0 && rows[rows.length - 1].every((c) => !c.trim())) {
    rows.pop()
  }

  return rows
}

function generateTemplate() {
  const header = EXPECTED_HEADERS.join(',')
  const sample =
    'パスワードリセット対応,ログイン・認証,パスワードを忘れてしまいログインできません。,' +
    '本人確認（登録メールアドレス確認）,' +
    'パスワードリセットメールの送付手順を案内,' +
    '迷惑メールフォルダの確認を依頼,' +
    '新パスワード設定後のログイン確認を依頼,' +
    '解決確認後にクローズ'
  const csv = '\uFEFF' + header + '\n' + sample + '\n'
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'cases_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// Parse rows into case objects, returning { cases, errors }
function validateRows(rows) {
  const results = []
  const errors = []

  // ヘッダー行の検出
  let dataRows = rows
  if (rows.length > 0) {
    const firstRow = rows[0].map((c) => c.trim())
    const isHeader = firstRow[0] === 'タイトル' || firstRow[0] === 'タイトル（要約）'
    if (isHeader) {
      // 列数チェック
      if (firstRow.length < 4) {
        errors.push({
          row: 1,
          message: `列数が不足しています（${firstRow.length}列）。「タイトル,カテゴリ,お問い合わせ内容,ステップ1,...」の形式で作成してください。`,
          fatal: true,
        })
        return { cases: [], errors }
      }
      dataRows = rows.slice(1)
    }
  }

  if (dataRows.length === 0) {
    errors.push({ row: null, message: 'データ行がありません。', fatal: true })
    return { cases: [], errors }
  }

  dataRows.forEach((cols, idx) => {
    const rowNum = idx + 2 // 1-indexed + header
    const trimmed = cols.map((c) => (c || '').trim())

    if (trimmed.length < 4) {
      errors.push({
        row: rowNum,
        message: `列数が不足しています（${trimmed.length}列）。タイトル・カテゴリ・お問い合わせ内容・ステップ1 は必須です。`,
      })
      return
    }

    const [summary, rawCategory, inquiry, ...stepCols] = trimmed

    if (!summary) {
      errors.push({ row: rowNum, message: 'タイトルが空です。' })
      return
    }
    if (!inquiry) {
      errors.push({ row: rowNum, message: `「${summary}」: お問い合わせ内容が空です。` })
      return
    }

    const steps = stepCols.slice(0, 5).filter((s) => s)
    if (steps.length === 0) {
      errors.push({ row: rowNum, message: `「${summary}」: ステップが1件も入力されていません。` })
      return
    }

    const category = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : 'その他'
    const categoryWarning = !VALID_CATEGORIES.includes(rawCategory) && rawCategory
      ? `「${summary}」: カテゴリ「${rawCategory}」は不正なため「その他」として登録します。`
      : null

    results.push({ summary, category, inquiry, steps, resolution: '', categoryWarning, _rowNum: rowNum })
  })

  return { cases: results, errors }
}

export default function CsvImportModal({ onImported, onClose }) {
  const [parsed, setParsed] = useState(null) // { cases, errors }
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null) // { added, skipped, skippedTitles }
  const fileRef = useRef()

  function handleFile(file) {
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      setParsed({ cases: [], errors: [{ row: null, message: 'CSVファイル（.csv）を選択してください。', fatal: true }] })
      setFileName(file.name)
      return
    }
    setFileName(file.name)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const rows = parseCSV(text)
      if (rows.length === 0) {
        setParsed({ cases: [], errors: [{ row: null, message: 'ファイルが空です。', fatal: true }] })
        return
      }
      setParsed(validateRows(rows))
    }
    reader.readAsText(file, 'UTF-8')
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  function handleImport() {
    if (!parsed || parsed.cases.length === 0) return
    setImporting(true)

    const existing = loadCases({ includeArchived: true })
    const existingTitles = new Set(existing.map((c) => c.summary))

    const added = []
    const skippedTitles = []

    parsed.cases.forEach(({ summary, category, inquiry, steps, resolution }) => {
      if (existingTitles.has(summary)) {
        skippedTitles.push(summary)
      } else {
        saveCase({ summary, category, inquiry, steps, resolution })
        existingTitles.add(summary)
        added.push(summary)
      }
    })

    setResult({ added: added.length, skipped: skippedTitles.length, skippedTitles })
    setImporting(false)
    onImported()
  }

  const warnings = parsed?.cases.filter((c) => c.categoryWarning) || []
  const fatalError = parsed?.errors.find((e) => e.fatal)
  const rowErrors = parsed?.errors.filter((e) => !e.fatal) || []
  const validCount = parsed?.cases.length || 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">CSVインポート</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Format description + template download */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">CSVフォーマット（列順固定）</p>
            <p className="text-xs text-gray-500 font-mono">
              タイトル, カテゴリ, お問い合わせ内容, ステップ1, ステップ2, ステップ3, ステップ4, ステップ5
            </p>
            <ul className="text-xs text-gray-500 space-y-0.5 list-disc list-inside">
              <li>1行目はヘッダー行として自動認識（省略可）</li>
              <li>ステップ2〜5は省略可。ステップ1は必須</li>
              <li>不正なカテゴリは「その他」として登録</li>
            </ul>
            <button
              onClick={generateTemplate}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
            >
              テンプレートをダウンロード
            </button>
          </div>

          {/* File drop zone */}
          {!result && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg p-8 text-center cursor-pointer transition-colors"
            >
              <p className="text-sm text-gray-500">
                CSVファイルをドラッグ＆ドロップ、または
                <span className="text-blue-600 font-medium"> クリックして選択</span>
              </p>
              {fileName && (
                <p className="text-xs text-gray-400 mt-1">{fileName}</p>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>
          )}

          {/* Fatal error */}
          {fatalError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-700 mb-1">フォーマットエラー</p>
              <p className="text-sm text-red-600">{fatalError.message}</p>
            </div>
          )}

          {/* Row-level errors */}
          {!fatalError && rowErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-1">
              <p className="text-sm font-medium text-red-700 mb-2">
                {rowErrors.length} 件のエラーが見つかりました（該当行はスキップされます）
              </p>
              {rowErrors.map((e, i) => (
                <p key={i} className="text-xs text-red-600">
                  {e.row ? `行 ${e.row}: ` : ''}{e.message}
                </p>
              ))}
            </div>
          )}

          {/* Category warnings */}
          {!fatalError && warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-1">
              <p className="text-sm font-medium text-yellow-700 mb-1">カテゴリの自動補正</p>
              {warnings.map((c, i) => (
                <p key={i} className="text-xs text-yellow-700">{c.categoryWarning}</p>
              ))}
            </div>
          )}

          {/* Preview */}
          {!fatalError && parsed && validCount > 0 && !result && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                プレビュー（{validCount} 件のインポート対象）
              </p>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-2 font-medium text-gray-600">タイトル</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">カテゴリ</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">ステップ数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.cases.slice(0, 10).map((c, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0">
                        <td className="px-3 py-2 text-gray-800 max-w-[200px] truncate">{c.summary}</td>
                        <td className="px-3 py-2">
                          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">
                            {c.category}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500">{c.steps.length} ステップ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {validCount > 10 && (
                  <p className="text-xs text-gray-400 px-3 py-2 border-t border-gray-100">
                    …他 {validCount - 10} 件
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Import result */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-5 space-y-3">
              <p className="text-sm font-semibold text-green-700">インポート完了</p>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{result.added}</p>
                  <p className="text-xs text-gray-500 mt-0.5">件 追加</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-400">{result.skipped}</p>
                  <p className="text-xs text-gray-500 mt-0.5">件 スキップ</p>
                </div>
              </div>
              {result.skipped > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    スキップ（タイトルが重複）:
                  </p>
                  <ul className="text-xs text-gray-500 space-y-0.5 list-disc list-inside">
                    {result.skippedTitles.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {result ? '閉じる' : 'キャンセル'}
            </button>
            {!result && (
              <button
                onClick={handleImport}
                disabled={importing || validCount === 0 || !!fatalError}
                className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
              >
                {importing ? 'インポート中...' : `${validCount} 件をインポート`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
