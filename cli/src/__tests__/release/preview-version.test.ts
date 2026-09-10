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

test('the published launcher retains system trust and existing Bun options', () => {
  const source = readFileSync(new URL('../../../release/index.js', import.meta.url), 'utf8')
  const bootstrap = source.slice(source.indexOf('const CONFIG = createConfig(packageName)'), source.indexOf('const { getProxyUrl, httpGet }'))
  for (const existing of [undefined, '--smol']) {
    const env = { BUN_OPTIONS: existing, NODE_EXTRA_CA_CERTS: 'existing-certs.pem' }
    runInNewContext(bootstrap, { process: { env }, packageName: 'test', createConfig: () => ({}) })
    expect(env.BUN_OPTIONS).toBe(['--use-system-ca', existing].filter(Boolean).join(' '))
    expect(env.NODE_EXTRA_CA_CERTS).toBe('existing-certs.pem')
  }
})
