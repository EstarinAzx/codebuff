import {
  closeMCPClient,
  getMCPClient,
  listMCPTools,
} from '@codebuff/common/mcp/client'
import { stopActiveRun } from '../utils/active-run'
import {
  getComputerToolsConfig,
  getComputerToolsSettingsPath,
  isComputerToolSupported,
  loadComputerToolsSettings,
  prepareComputerToolsConfig,
  saveComputerToolsSetting,
  findComputerToolsBrowser,
} from '../utils/computer-tools'

import type { ComputerToolKind } from '../utils/computer-tools'
import type { MCPConfig } from '@codebuff/common/types/mcp'

type Options = {
  filePath?: string
  platform?: NodeJS.Platform
  which?: (name: string) => string | null
  probe?: (config: MCPConfig) => Promise<string[]>
  close?: (config: MCPConfig) => Promise<void>
  stop?: () => void
  existingServerNames?: string[]
}

const settingChanges = new Map<string, symbol>()

export async function handleComputerToolsCommand(
  kind: ComputerToolKind,
  args: string,
  options: Options = {},
): Promise<string> {
  const action = args.trim().toLowerCase() || 'status'
  if (!['on', 'off', 'status'].includes(action))
    return `Usage: /${kind} [on|off|status]`
  const filePath = options.filePath ?? getComputerToolsSettingsPath()
  const platform = options.platform ?? process.platform
  const changeKey = `${filePath}:${kind}`
  const change = Symbol()
  if (action !== 'status') settingChanges.set(changeKey, change)
  const close = options.close ?? closeMCPClient
  const config = getComputerToolsConfig(kind, platform, filePath)
  const collision = options.existingServerNames?.includes(`rdx-${kind}`)
  const stop = options.stop ?? (() => stopActiveRun('user-interrupt'))
  if (action === 'off' && !collision) stop()
  try {
    const settings = loadComputerToolsSettings(filePath)
    if (action === 'off') {
      // Persist before awaiting shutdown so the next run cannot advertise it.
      saveComputerToolsSetting(kind, false, filePath)
      if (!collision) {
        try {
          await close(config)
        } catch (error) {
          return `${kind}: off; shutdown failed: ${error instanceof Error ? error.message : String(error)}. Restart RD-X-96 to finish cleanup.`
        }
      }
      return `${kind}: off.${collision ? ' The user-owned MCP server is unchanged; disable it in its own configuration.' : ''}`
    }
    if (collision)
      return `${kind}: user-owned MCP name rdx-${kind} already exists. Built-in connector skipped; keep it or rename it in your MCP configuration.`
    if (!isComputerToolSupported(kind, platform))
      return `${kind}: unavailable. ${kind === 'computer' ? 'Windows desktop control requires Windows and an unlocked interactive desktop.' : 'Browser control supports Windows, macOS and Linux.'}`
    if (action === 'status' && !settings[kind])
      return `${kind}: off. Use /${kind} on to enable local ${kind === 'browser' ? 'browser' : 'desktop'} access. No service API key required.`

    const which = options.which ?? Bun.which
    if (!which(config.command) || (kind === 'browser' && !which('node'))) {
      return `${kind}: unavailable. ${kind === 'browser' ? 'Install Node.js 22.15+ (includes npx) and ' + (platform === 'win32' ? 'Microsoft Edge' : 'Google Chrome') : 'Install uv from https://docs.astral.sh/uv/getting-started/installation/; uvx downloads Python 3.13 and Windows-MCP on first use'}. Then retry /${kind} on.`
    }
    if (kind === 'browser' && !findComputerToolsBrowser(platform, which)) {
      return `browser: unavailable. Install ${platform === 'win32' ? 'Microsoft Edge' : 'Google Chrome'} in its standard location, then retry /browser on.`
    }
    if (action === 'on') prepareComputerToolsConfig(kind, filePath)
    const probe =
      options.probe ??
      (async (server: MCPConfig) =>
        (await listMCPTools(await getMCPClient(server))).tools.map(
          (tool) => tool.name,
        ))
    try {
      const tools = await probe(config)
      if (!tools.length) throw new Error('Server returned no tools')
      if (action === 'on' && settingChanges.get(changeKey) !== change)
        return `${kind}: setup superseded by a newer command.`
      if (action === 'on') saveComputerToolsSetting(kind, true, filePath)
      return `${kind}: on, ready (${tools.length} tools). Applies to the next message. ${kind === 'browser' ? 'Uses a separate, temporary browser profile.' : 'Controls the current Windows desktop.'} Actions run with your user access, without per-action confirmation. /${kind} off stops the active run and connector.`
    } catch (error) {
      if (action === 'on' && settingChanges.get(changeKey) !== change)
        return `${kind}: setup superseded by a newer command.`
      if (!settings[kind]) await close(config).catch(() => {})
      return `${kind}: ${settings[kind] ? 'on but unavailable' : 'not enabled'}. ${error instanceof Error ? error.message : String(error)}. First setup needs internet; retry /${kind} on after checking prerequisites. See docs/computer-tools.md.`
    }
  } catch (error) {
    if (action === 'off' && !collision) await close(config).catch(() => {})
    return `${kind}: ${error instanceof Error ? error.message : String(error)}`
  } finally {
    if (settingChanges.get(changeKey) === change)
      settingChanges.delete(changeKey)
  }
}
