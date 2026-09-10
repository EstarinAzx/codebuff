import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

import type { MCPConfig } from '@codebuff/common/types/mcp'

export type ComputerToolKind = 'browser' | 'computer'
export type ComputerToolsSettings = {
  browser: boolean
  computer: boolean
  [key: string]: unknown
}

// Pin the advertised browser surface too: upstream also exposes host-code execution.
export const BROWSER_TOOL_NAMES = [
  'browser_close',
  'browser_resize',
  'browser_console_messages',
  'browser_handle_dialog',
  'browser_evaluate',
  'browser_file_upload',
  'browser_drop',
  'browser_find',
  'browser_fill_form',
  'browser_press_key',
  'browser_type',
  'browser_mouse_move_xy',
  'browser_mouse_click_xy',
  'browser_mouse_drag_xy',
  'browser_mouse_down',
  'browser_mouse_up',
  'browser_mouse_wheel',
  'browser_navigate',
  'browser_navigate_back',
  'browser_network_requests',
  'browser_network_request',
  'browser_take_screenshot',
  'browser_snapshot',
  'browser_click',
  'browser_drag',
  'browser_hover',
  'browser_select_option',
  'browser_tabs',
  'browser_wait_for',
] as const

export function getComputerToolsSettingsPath(): string {
  return path.join(os.homedir(), '.config', 'rdx', 'computer-tools.json')
}

export function loadComputerToolsSettings(
  filePath = getComputerToolsSettingsPath(),
): ComputerToolsSettings {
  try {
    const value = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      ['browser', 'computer'].some(
        (key) => value[key] !== undefined && typeof value[key] !== 'boolean',
      )
    ) {
      throw new Error('Expected browser and computer to be booleans')
    }
    return { browser: false, computer: false, ...value }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return { browser: false, computer: false }
    throw new Error(
      `Cannot read local tool settings at ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

export function saveComputerToolsSetting(
  kind: ComputerToolKind,
  enabled: boolean,
  filePath = getComputerToolsSettingsPath(),
): void {
  const settings = loadComputerToolsSettings(filePath)
  settings[kind] = enabled
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const temporary = `${filePath}.${randomUUID()}.tmp`
  try {
    fs.writeFileSync(temporary, JSON.stringify(settings, null, 2) + '\n', {
      mode: 0o600,
      flag: 'wx',
    })
    fs.renameSync(temporary, filePath)
  } finally {
    fs.rmSync(temporary, { force: true })
  }
}

export function isComputerToolSupported(
  kind: ComputerToolKind,
  platform = process.platform,
): boolean {
  return kind === 'computer'
    ? platform === 'win32'
    : ['win32', 'darwin', 'linux'].includes(platform)
}

export function findComputerToolsBrowser(
  platform: NodeJS.Platform,
  which: (name: string) => string | null,
): string | undefined {
  const candidates =
    platform === 'win32'
      ? [
          path.win32.join(
            process.env['PROGRAMFILES(X86)'] ?? 'C:\\Program Files (x86)',
            'Microsoft/Edge/Application/msedge.exe',
          ),
          path.win32.join(
            process.env.PROGRAMFILES ?? 'C:\\Program Files',
            'Microsoft/Edge/Application/msedge.exe',
          ),
          path.win32.join(
            process.env.LOCALAPPDATA ?? '',
            'Microsoft/Edge/Application/msedge.exe',
          ),
        ]
      : platform === 'darwin'
        ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
        : ['google-chrome', 'google-chrome-stable']
  return candidates.find((candidate) => which(candidate))
}

export function getComputerToolsConfig(
  kind: ComputerToolKind,
  platform = process.platform,
  filePath = getComputerToolsSettingsPath(),
): Extract<MCPConfig, { type: 'stdio' }> {
  if (kind === 'browser') {
    return {
      type: 'stdio',
      command: 'npx',
      args: [
        '-y',
        '--prefer-offline',
        '@playwright/mcp@0.0.80',
        '--browser',
        platform === 'win32' ? 'msedge' : 'chrome',
        '--isolated',
        '--sandbox',
        '--image-responses',
        'allow',
        '--output-dir',
        path.join(path.dirname(filePath), 'browser-output'),
        '--caps',
        'vision',
      ],
      env: {
        // Keep verification enabled while trusting the OS certificate store.
        NODE_OPTIONS: '--use-system-ca',
        ...(process.env.NODE_EXTRA_CA_CERTS
          ? { NODE_EXTRA_CA_CERTS: process.env.NODE_EXTRA_CA_CERTS }
          : {}),
        ...(platform === 'linux'
          ? Object.fromEntries(
              ['DISPLAY', 'WAYLAND_DISPLAY', 'XDG_RUNTIME_DIR'].flatMap(
                (key) => (process.env[key] ? [[key, process.env[key]!]] : []),
              ),
            )
          : {}),
      },
    }
  }
  return {
    type: 'stdio',
    command: 'uvx',
    args: [
      '--native-tls',
      '--python',
      '3.13',
      'windows-mcp==0.8.5',
      'serve',
      '--transport',
      'stdio',
      '--config',
      path.join(path.dirname(filePath), 'windows-mcp.toml'),
      '--tools',
      'Screenshot,Snapshot,Click,Type,Scroll,Move,Shortcut,Wait,WaitFor,DisplayInventory,App,MultiSelect,MultiEdit',
    ],
    env: { ANONYMIZED_TELEMETRY: 'false', WINDOWS_MCP_WATCHDOG: 'false' },
  }
}

export function prepareComputerToolsConfig(
  kind: ComputerToolKind,
  filePath = getComputerToolsSettingsPath(),
): void {
  if (kind !== 'computer') return
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  try {
    fs.writeFileSync(
      path.join(path.dirname(filePath), 'windows-mcp.toml'),
      '# RD-X-96 local desktop connector. CLI flags select stdio and GUI tools.\n',
      { flag: 'wx', mode: 0o600 },
    )
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
  }
}

export function mergeComputerTools(
  existing: Record<string, MCPConfig>,
  settings: ComputerToolsSettings,
  platform = process.platform,
  filePath = getComputerToolsSettingsPath(),
): Record<string, MCPConfig> {
  const managed: Record<string, MCPConfig> = {}
  for (const kind of ['browser', 'computer'] as const) {
    if (settings[kind] && isComputerToolSupported(kind, platform))
      managed[`rdx-${kind}`] = getComputerToolsConfig(kind, platform, filePath)
  }
  return { ...managed, ...existing }
}
