import { createTestRenderer } from '@opentui/core/testing'
import { createRoot, flushSync } from '@opentui/react'
import { describe, expect, spyOn, test } from 'bun:test'
import React from 'react'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'
import path from 'path'
import { runInNewContext } from 'vm'

import { serializeConversation } from '../commands/copy-conversation'
import { useLogo } from '../hooks/use-logo'
import { LOGO, LOGO_SMALL } from '../login/constants'
import { IS_FREEBUFF } from '../utils/constants'
import * as terminalIo from '../utils/terminal-io'
import { setTerminalTitle } from '../utils/terminal-title'
import { callbackPageHtml } from '../utils/chatgpt-oauth'
import { bundledAgents } from '../agents/bundled-agents.generated'
import { getToolSet } from '../../../packages/agent-runtime/src/tools/prompts'

const name = IS_FREEBUFF ? 'Freebuff' : 'CBM-01'

describe('shipped product identity', () => {
  test('help introduces the product using its working command', () => {
    const result = Bun.spawnSync(
      [
        process.execPath,
        '-e',
        `import { parseArgs } from './src/cli-args'; parseArgs({ argv: ['bun', 'cli', '--help'] })`,
      ],
      {
        cwd: fileURLToPath(new URL('../..', import.meta.url)),
        env: process.env,
      },
    )
    expect(result.exitCode).toBe(0)
    expect(result.stdout.toString()).toContain(name)
    expect(result.stdout.toString()).toContain(
      `Usage: ${IS_FREEBUFF ? 'freebuff' : 'cbm'} `,
    )
  })

  test('title and conversation export identify the product', () => {
    const write = spyOn(terminalIo, 'writeTerminalControlSync').mockReturnValue(
      true,
    )
    try {
      setTerminalTitle('Project\nname')
      expect(write.mock.calls[0][0]).toContain(`${name}: Project name`)
    } finally {
      write.mockRestore()
    }
    expect(serializeConversation([]).text).toContain(`# ${name} conversation`)
  })

  test('callback success and error pages preserve escaping and product identity', () => {
    expect(callbackPageHtml(true)).toContain(`Connected — ${name}`)
    const error = callbackPageHtml(false, '<script>"bad"</script>')
    expect(error).toContain(`Return to ${name}`)
    expect(error).toContain('&lt;script&gt;&quot;bad&quot;&lt;/script&gt;')
    expect(error).not.toContain('<script>')
  })

  test('bundled fork agents introduce CBM-01 while keeping their routing IDs', () => {
    for (const id of ['mod-default', 'mod-lite', 'mod-max', 'mod-plan']) {
      const agent = bundledAgents[id]
      expect(agent.id).toBe(id)
      expect(agent.displayName).toStartWith('CBM-01 ')
      expect(agent.systemPrompt).toContain('CBM-01')
    }
  })

  test('fork roots and reachable children do not teach legacy generated commit footers', async () => {
    const pending = ['mod-default', 'mod-lite', 'mod-max', 'mod-plan']
    const visited = new Set<string>()
    const terminalAgents: string[] = []
    while (pending.length) {
      const id = pending.pop()!
      if (visited.has(id)) continue
      visited.add(id)
      const agent = bundledAgents[id]
      expect(agent).toBeDefined()
      pending.push(...(agent.spawnableAgents ?? []))
      if (!agent.toolNames?.includes('run_terminal_command')) continue
      terminalAgents.push(id)
      const tools = await getToolSet({
        toolNames: agent.toolNames,
        windowedFileReads: agent.windowedFileReads ?? false,
        suppressCommitAttribution: agent.suppressCommitAttribution,
        additionalToolDefinitions: async () => ({}),
        agentTools: {},
        skills: {},
      })
      const description = tools.run_terminal_command?.description
      expect(description).toBeDefined()
      expect(description).not.toContain('Generated with Codebuff')
      expect(description).not.toContain('Co-Authored-By: Codebuff')
      expect(description).not.toContain('noreply@codebuff.com')
    }
    expect(terminalAgents.sort()).toEqual([
      'mod-default',
      'mod-lite',
      'mod-max',
    ])
  })

  test('postinstall welcomes users to CBM-01 and preserves binary cleanup names', () => {
    const messages: string[] = []
    const removed: string[] = []
    // Execute the actual lifecycle script without touching an installed CLI.
    runInNewContext(
      readFileSync(
        new URL('../../release/postinstall.js', import.meta.url),
        'utf8',
      ),
      {
        require: (name: string) => {
          if (name === 'fs')
            return {
              unlinkSync: (file: string) => removed.push(path.basename(file)),
            }
          if (name === 'os') return { homedir: () => '/test-home' }
          if (name === 'path') return path
          throw new Error(`Unexpected postinstall dependency: ${name}`)
        },
        process: { platform: 'win32' },
        console: { log: (line: string) => messages.push(line) },
      },
    )
    expect(messages.join('\n')).toContain('CBM-01 installed.')
    expect(messages.join('\n')).toContain('Run: cbm')
    expect(removed).toEqual(['codebuff.exe', 'codebuff-mod.exe'])
  })

  test('logos fit their actual width and collapse to readable text on short terminals', async () => {
    const fullWidth = Math.max(...LOGO.split('\n').map((line) => line.length))
    const smallWidth = Math.max(
      ...LOGO_SMALL.split('\n').map((line) => line.length),
    )
    for (const [width, height, art] of [
      [fullWidth, 8, LOGO],
      [fullWidth - 1, 8, LOGO_SMALL],
      [smallWidth, 8, LOGO_SMALL],
      [smallWidth - 1, 8, null],
      [8, 8, null],
      [fullWidth, 1, null],
    ] as const) {
      const setup = await createTestRenderer({ width, height })
      const root = createRoot(setup.renderer)
      let textBlock = ''
      function Logo() {
        const result = useLogo({ availableWidth: width, maxHeight: height })
        textBlock = result.textBlock
        return result.component
      }
      try {
        flushSync(() => root.render(<Logo />))
        await setup.renderOnce()
        const frame = setup.captureCharFrame()
        if (!IS_FREEBUFF) expect(frame).toContain('CBM-01')
        if (art) {
          expect(textBlock).toBe(art.split('\n').filter(Boolean).join('\n'))
          for (const line of textBlock.split('\n'))
            expect(frame).toContain(line.trimEnd())
        } else {
          expect(textBlock).toBe('')
          expect(frame).toContain(name)
        }
      } finally {
        root.unmount()
        setup.renderer.destroy()
      }
    }
  })
})
