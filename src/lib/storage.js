import { SAMPLE_CASES } from './sampleData.js'

const STORAGE_KEY = 'cs_workflow_cases'

export function loadCases() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
    // First run: seed with sample data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_CASES))
    return SAMPLE_CASES
  } catch {
    return SAMPLE_CASES
  }
}

export function saveCase(caseData) {
  const cases = loadCases()
  const newCase = {
    id: `case-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...caseData,
  }
  const updated = [newCase, ...cases]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return newCase
}

export function deleteCase(id) {
  const cases = loadCases()
  const updated = cases.filter((c) => c.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export function getCategories(cases) {
  const set = new Set(cases.map((c) => c.category))
  return ['すべて', ...Array.from(set)]
}
