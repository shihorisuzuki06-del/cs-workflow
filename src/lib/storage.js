import { SAMPLE_CASES } from './sampleData.js'

const STORAGE_KEY = 'cs_workflow_cases'
const HISTORY_PREFIX = 'cs_workflow_history_'

export function loadCases({ includeArchived = false } = {}) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    let cases
    if (raw) {
      cases = JSON.parse(raw)
    } else {
      cases = SAMPLE_CASES
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cases))
    }
    // Normalize: ensure updatedAt exists
    cases = cases.map((c) => ({
      ...c,
      updatedAt: c.updatedAt || c.createdAt,
      archived: c.archived || false,
    }))
    if (!includeArchived) {
      return cases.filter((c) => !c.archived)
    }
    return cases
  } catch {
    return SAMPLE_CASES
  }
}

export function saveCase(caseData) {
  const cases = loadCases({ includeArchived: true })
  const now = new Date().toISOString()
  const newCase = {
    id: `case-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    archived: false,
    ...caseData,
  }
  const updated = [newCase, ...cases]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return newCase
}

export function updateCase(id, caseData) {
  const cases = loadCases({ includeArchived: true })
  const existing = cases.find((c) => c.id === id)
  if (!existing) return null

  // Save history before updating
  const history = getHistory(id)
  const snapshot = { ...existing, savedAt: new Date().toISOString() }
  history.push(snapshot)
  localStorage.setItem(`${HISTORY_PREFIX}${id}`, JSON.stringify(history))

  // Update case
  const now = new Date().toISOString()
  const updatedCase = { ...existing, ...caseData, updatedAt: now }
  const updated = cases.map((c) => (c.id === id ? updatedCase : c))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updatedCase
}

export function archiveCase(id) {
  const cases = loadCases({ includeArchived: true })
  const updated = cases.map((c) =>
    c.id === id ? { ...c, archived: true, updatedAt: new Date().toISOString() } : c
  )
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

// Keep for backward compat (now does archive instead of hard delete)
export function deleteCase(id) {
  archiveCase(id)
}

export function getHistory(id) {
  try {
    const raw = localStorage.getItem(`${HISTORY_PREFIX}${id}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getCategories(cases) {
  const set = new Set(cases.map((c) => c.category))
  return ['すべて', ...Array.from(set)]
}
