import { expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  addProfile,
  getActiveProfile,
  getSearchProfile,
  removeProfile,
  setActiveProfile,
} from '../providers'

test('search uses active Codex or first configured Codex while preserving Grok selection', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rdx-search-'))
  const file = join(dir, 'providers.json')
  try {
    const grok = addProfile(
      { name: 'Grok', preset: 'grok', makeActive: true },
      file,
    )
    expect(getSearchProfile(file)).toBeNull()
    const first = addProfile({ name: 'Codex A', preset: 'codex' }, file)
    const second = addProfile({ name: 'Codex B', preset: 'codex' }, file)
    expect(getSearchProfile(file)?.id).toBe(first.id)
    expect(getActiveProfile(file)?.id).toBe(grok.id)
    setActiveProfile(second.id, file)
    expect(getSearchProfile(file)?.id).toBe(second.id)
    setActiveProfile(grok.id, file)
    removeProfile(first.id, file)
    expect(getSearchProfile(file)?.id).toBe(second.id)
    removeProfile(second.id, file)
    expect(getSearchProfile(file)).toBeNull()
    expect(getActiveProfile(file)?.id).toBe(grok.id)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
