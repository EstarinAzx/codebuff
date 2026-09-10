import { afterEach, beforeEach, expect, test } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { handleComputerToolsCommand } from '../../commands/computer-tools'
import {
  getComputerToolsConfig,
  loadComputerToolsSettings,
  mergeComputerTools,
} from '../computer-tools'

let directory: string
let filePath: string
beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rdx-tools-'))
  filePath = path.join(directory, 'computer-tools.json')
})
afterEach(() => fs.rmSync(directory, { recursive: true, force: true }))

const dependencies = () => ({
  filePath,
  platform: 'win32' as NodeJS.Platform,
  which: (_name: string) => '/installed/tool',
  probe: async () => ['browser_snapshot', 'browser_click'],
  close: async () => {},
  stop: () => {},
  existingServerNames: [] as string[],
})

test('off by default; enabling preserves other settings and repeated on/off is safe', async () => {
  expect(loadComputerToolsSettings(filePath)).toMatchObject({
    browser: false,
    computer: false,
  })
  fs.writeFileSync(
    filePath,
    JSON.stringify({ computer: true, future: { keep: 42 } }),
  )
  expect(
    await handleComputerToolsCommand('browser', 'on', dependencies()),
  ).toContain('ready')
  expect(
    await handleComputerToolsCommand('browser', 'on', dependencies()),
  ).toContain('ready')
  expect(loadComputerToolsSettings(filePath)).toMatchObject({
    browser: true,
    computer: true,
    future: { keep: 42 },
  })
  await handleComputerToolsCommand('browser', 'off', dependencies())
  await handleComputerToolsCommand('browser', 'off', dependencies())
  expect(loadComputerToolsSettings(filePath)).toMatchObject({
    browser: false,
    computer: true,
    future: { keep: 42 },
  })
})

test('unsupported platforms, missing launchers and failed discovery never enable tools', async () => {
  expect(
    await handleComputerToolsCommand('computer', 'on', {
      ...dependencies(),
      platform: 'linux',
    }),
  ).toContain('Windows')
  expect(
    await handleComputerToolsCommand('browser', 'on', {
      ...dependencies(),
      which: () => null,
    }),
  ).toContain('Node.js')
  expect(
    await handleComputerToolsCommand('computer', 'on', {
      ...dependencies(),
      which: () => null,
    }),
  ).toContain('uv')
  expect(
    await handleComputerToolsCommand('browser', 'on', {
      ...dependencies(),
      probe: async () => {
        throw new Error('download failed')
      },
    }),
  ).toContain('download failed')
  expect(loadComputerToolsSettings(filePath).browser).toBe(false)
  expect(loadComputerToolsSettings(filePath).computer).toBe(false)
})

test('missing browser installation is reported before activation', async () => {
  const result = await handleComputerToolsCommand('browser', 'on', {
    ...dependencies(),
    platform: 'darwin',
    which: (name) =>
      ['node', 'npx'].includes(name) ? '/installed/tool' : null,
  })
  expect(result).toContain('Google Chrome')
  expect(loadComputerToolsSettings(filePath).browser).toBe(false)
})

test('status is read-only and reports lost readiness; malformed settings are never overwritten', async () => {
  expect(
    await handleComputerToolsCommand('browser', '', dependencies()),
  ).toContain('off')
  expect(fs.existsSync(filePath)).toBe(false)
  await handleComputerToolsCommand('browser', 'on', dependencies())
  expect(
    await handleComputerToolsCommand('browser', 'status', {
      ...dependencies(),
      probe: async () => {
        throw new Error('offline')
      },
    }),
  ).toContain('offline')
  expect(loadComputerToolsSettings(filePath).browser).toBe(true)
  for (const content of ['{broken', '{"browser":"yes"}', '[]']) {
    fs.writeFileSync(filePath, content)
    expect(
      await handleComputerToolsCommand('browser', 'on', dependencies()),
    ).toContain('settings')
    expect(fs.readFileSync(filePath, 'utf8')).toBe(content)
  }
})

test('a user-owned name blocks activation and survives merge/off unchanged', async () => {
  const userServer = {
    type: 'stdio' as const,
    command: 'custom',
    args: [],
    env: {},
  }
  const occupied = { ...dependencies(), existingServerNames: ['rdx-browser'] }
  expect(await handleComputerToolsCommand('browser', 'on', occupied)).toContain(
    'user',
  )
  expect(loadComputerToolsSettings(filePath).browser).toBe(false)
  const original = { 'rdx-browser': userServer }
  const merged = mergeComputerTools(
    original,
    { browser: true, computer: true },
    'win32',
    filePath,
  )
  expect(merged['rdx-browser']).toBe(userServer)
  expect(merged['rdx-computer']).toBeDefined()
  expect(Object.keys(original)).toEqual(['rdx-browser'])
  expect(
    mergeComputerTools(
      original,
      { browser: false, computer: false },
      'win32',
      filePath,
    ),
  ).toEqual(original)
})

test('off interrupts a run and removes advertisement even when shutdown fails', async () => {
  await handleComputerToolsCommand('browser', 'on', dependencies())
  let stopped = false
  const result = await handleComputerToolsCommand('browser', 'off', {
    ...dependencies(),
    stop: () => {
      stopped = true
    },
    close: async () => {
      throw new Error('cannot close')
    },
  })
  expect(stopped).toBe(true)
  expect(loadComputerToolsSettings(filePath).browser).toBe(false)
  expect(result).toContain('cannot close')
})

test('desktop uses its own config and GUI tools; browser uses isolated profiles', async () => {
  await handleComputerToolsCommand('computer', 'on', dependencies())
  const computer = getComputerToolsConfig('computer', 'win32', filePath)
  expect(computer.args).toContain('--native-tls')
  expect(computer.args).toContain('stdio')
  const configPath = computer.args[computer.args.indexOf('--config') + 1]
  expect(path.dirname(configPath)).toBe(directory)
  expect(fs.existsSync(configPath)).toBe(true)
  const tools = computer.args[computer.args.indexOf('--tools') + 1].split(',')
  expect(tools).toContain('Screenshot')
  expect(tools).toContain('Type')
  expect(tools).not.toContain('PowerShell')
  expect(tools).not.toContain('Registry')
  expect(computer.env.ANONYMIZED_TELEMETRY).toBe('false')
  expect(getComputerToolsConfig('browser', 'win32', filePath).args).toContain(
    '--isolated',
  )
  expect(
    getComputerToolsConfig('browser', 'win32', filePath).env.NODE_OPTIONS,
  ).toContain('--use-system-ca')
  expect(
    mergeComputerTools(
      {},
      { browser: true, computer: true },
      'linux',
      filePath,
    )['rdx-computer'],
  ).toBeUndefined()
})

test('off during first-time setup cannot be undone by late discovery', async () => {
  let finish!: (tools: string[]) => void
  const pending = handleComputerToolsCommand('browser', 'on', {
    ...dependencies(),
    probe: () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  })
  await handleComputerToolsCommand('browser', 'off', dependencies())
  finish(['browser_snapshot'])
  await pending
  expect(loadComputerToolsSettings(filePath).browser).toBe(false)
})

test('browser output stays beside the selected settings file', () => {
  const browser = getComputerToolsConfig('browser', 'win32', filePath)
  const outputFlag = browser.args.indexOf('--output-dir')
  expect(outputFlag).toBeGreaterThanOrEqual(0)
  expect(browser.args[outputFlag + 1]).toBe(path.join(directory, 'browser-output'))
})

test('off still interrupts and closes when settings cannot be written', async () => {
  fs.writeFileSync(filePath, '{broken')
  let stopped = false
  let closed = false
  const result = await handleComputerToolsCommand('browser', 'off', {
    ...dependencies(),
    stop: () => {
      stopped = true
    },
    close: async () => {
      closed = true
    },
  })
  expect(stopped).toBe(true)
  expect(closed).toBe(true)
  expect(result).toContain('settings')
  expect(fs.readFileSync(filePath, 'utf8')).toBe('{broken')
})
