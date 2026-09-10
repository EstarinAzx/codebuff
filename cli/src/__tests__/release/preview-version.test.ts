import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

test('the fork launcher keeps a newer local preview and accepts future stable updates', () => {
  const source = readFileSync(new URL('../../../release/index.js', import.meta.url), 'utf8')
  const comparison = source.slice(source.indexOf('function compareVersions('), source.indexOf('\nfunction formatBytes('))
  const compare = runInNewContext(`(${comparison})`) as (current: string, latest: string) => number

  expect(compare('1.5.2-dev.tools', '1.5.1')).toBeGreaterThan(0)
  expect(compare('1.5.2-dev.tools', '1.5.2-dev.tools')).toBe(0)
  expect(compare('1.5.2-dev.tools', '1.5.2')).toBeLessThan(0)
  expect(compare('1.5.2-dev.tools', '1.6.0')).toBeLessThan(0)
  expect(compare('broken', '1.5.1')).toBeLessThan(0)
})
