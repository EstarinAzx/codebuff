import { createTestRenderer } from '@opentui/core/testing'
import { createRoot, flushSync } from '@opentui/react'
import { beforeAll, expect, test } from 'bun:test'
import React from 'react'
import path from 'path'
import { existsSync, mkdirSync } from 'fs'

import { ChatHeader } from '../components/chat-header'
import { initializeThemeStore, useThemeStore } from '../hooks/use-theme'
import { IS_FREEBUFF } from '../utils/constants'
import { chatThemes, createMarkdownPalette } from '../utils/theme-system'
import { useChatStore } from '../state/chat-store'
import { useMessageBlockStore } from '../state/message-block-store'
import { GhostlineFixture } from './helpers/ghostline-fixture'
import type { CapturedFrame } from '@opentui/core'
import { QuestionOption } from '../components/ask-user/components/question-option'
import { OptionsList } from '../components/ask-user/components/options-list'
import { AdCard } from '../components/ad-banner'
import { MessageWithAgents } from '../components/message-with-agents'

beforeAll(initializeThemeStore)

function contrast(a: string, b: string) {
  const luminance = (hex: string) => {
    const channels = hex.slice(1).match(/../g)!.map((c) => {
      const value = parseInt(c, 16) / 255
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  }
  const x = luminance(a)
  const y = luminance(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

test.skipIf(IS_FREEBUFF)('Ghostline keeps text readable on base, input, and selected surfaces', () => {
  for (const theme of Object.values(chatThemes)) {
    const palette = createMarkdownPalette(theme)
    for (const bg of [theme.agentContentBg, theme.surface, theme.surfaceHover]) {
      for (const fg of [theme.foreground, theme.muted, theme.primary, theme.warning, theme.error, theme.success]) {
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)
      }
    }
    expect(contrast(palette.codeHeaderFg, palette.codeBackground)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(theme.agentContentBg, theme.info)).toBeGreaterThanOrEqual(4.5)
  }
})

// Export the renderer's own cell colors/positions, not a re-created UI mock.
async function saveFrame(name: string, frame: CapturedFrame, plain: string, base: string) {
  const directory = process.env.GHOSTLINE_FRAMES
  if (!directory) return
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true })
  const escape = (text: string) => text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!)
  const cells: string[] = []
  const hex = (color: { toInts(): number[] }) => '#' + color.toInts().slice(0, 3).map((c) => c.toString(16).padStart(2, '0')).join('')
  frame.lines.forEach((line, y) => {
    let x = 0
    for (const span of line.spans) {
      cells.push(`<rect x="${x * 9}" y="${y * 20}" width="${span.width * 9}" height="20" fill="${span.bg.a ? hex(span.bg) : base}"/>`)
      if (span.text.trim()) cells.push(`<text x="${x * 9}" y="${y * 20 + 15}" fill="${hex(span.fg)}" font-weight="${span.attributes & 1 ? 700 : 400}" textLength="${span.width * 9}" lengthAdjust="spacingAndGlyphs">${escape(span.text)}</text>`)
      x += span.width
    }
  })
  await Bun.write(path.join(directory, `${name}.txt`), plain)
  await Bun.write(path.join(directory, `${name}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" width="${frame.cols * 9}" height="${frame.rows * 20}" style="background:${base}" xml:space="preserve"><g font-family="Consolas,monospace" font-size="15">${cells.join('')}</g></svg>`)
}

test.skipIf(IS_FREEBUFF)('renderer keeps work, menus and compact input visible across terminal sizes and themes', async () => {
  const previous = useThemeStore.getState().theme
  try {
    for (const theme of Object.values(chatThemes)) {
      useThemeStore.setState({ theme })
      useMessageBlockStore.getState().setContext({ theme, markdownPalette: createMarkdownPalette(theme) })
      for (const [width, height] of [[120, 32], [40, 24], [80, 12]]) {
        for (const state of ['empty', 'active', 'providers', 'input', 'feedback'] as const) {
          const setup = await createTestRenderer({ width, height, backgroundColor: theme.agentContentBg })
          const root = createRoot(setup.renderer)
          try {
            flushSync(() => root.render(<GhostlineFixture width={width} height={height} state={state} />))
            await setup.renderOnce()
            const plain = setup.captureCharFrame()
            const rows = plain.split('\n')
            expect(plain).toContain(state === 'input' ? 'Inspect the input renderer' : 'Enter a task, or / for commands')
            if (state === 'empty') {
              expect(plain).toContain('CBM-01')
              const inputRow = rows.findIndex((line) => line.includes('Enter a task'))
              expect(inputRow).toBe(height - (height < 20 ? 1 : 2))
            }
            if (state === 'providers') {
              expect(plain).toContain('/model')
              expect(plain).toContain('/providers')
            }
            if (state === 'active') expect(plain).toContain('Esc')
            if (state === 'feedback') expect(plain).toContain('Request failed.')
            await saveFrame(`${theme.name}-${width}x${height}-${state}`, setup.captureSpans(), plain, theme.agentContentBg)
            if (state === 'input') {
              // Shortening the value must erase old cells, including with no OSC response.
              flushSync(() => setup.mockInput.pressKey('a', { ctrl: true }))
              await setup.renderOnce()
              const selected = setup.captureSpans().lines.flatMap((line) => line.spans).find((span) => span.text === 'I')!
              expect(selected).toBeDefined()
              expect(selected.fg.a).toBe(1)
              const hex = (rgba: typeof selected.fg) => '#' + rgba.toInts().slice(0, 3).map((c) => c.toString(16).padStart(2, '0')).join('')
              expect(contrast(hex(selected.fg), hex(selected.bg))).toBeGreaterThanOrEqual(4.5)
              await saveFrame(`${theme.name}-${width}x${height}-selection`, setup.captureSpans(), setup.captureCharFrame(), theme.agentContentBg)
              flushSync(() => setup.mockInput.pressKey('k', { ctrl: true }))
              await setup.renderOnce()
              expect(setup.captureCharFrame()).toContain('Enter a task, or / for commands')
              await saveFrame(`${theme.name}-${width}x${height}-cleared`, setup.captureSpans(), setup.captureCharFrame(), theme.agentContentBg)
              flushSync(() => root.render(<GhostlineFixture width={width} height={height} state={state} focused={false} />))
              await setup.renderOnce()
              await saveFrame(`${theme.name}-${width}x${height}-unfocused`, setup.captureSpans(), setup.captureCharFrame(), theme.agentContentBg)
            }
          } finally {
            flushSync(() => root.unmount())
            setup.renderer.destroy()
            useChatStore.getState().reset()
          }
        }
      }
    }
  } finally {
    useMessageBlockStore.getState().reset()
    useThemeStore.setState({ theme: previous })
  }
}, 30000)

test('limited-color terminals keep a theme-appropriate cursor fallback', () => {
  const result = Bun.spawnSync([process.execPath, '-e', `
    import { getLogoAccentColor } from './src/utils/theme-system'
    console.log(JSON.stringify(['dark', 'light'].map(name => getLogoAccentColor(name))))
  `], { cwd: path.resolve(import.meta.dir, '../..'), env: { ...process.env, TERM_PROGRAM: 'Apple_Terminal' } })
  expect(result.exitCode).toBe(0)
  expect(JSON.parse(result.stdout.toString().trim())).toEqual(IS_FREEBUFF ? ['lime', 'green'] : ['fuchsia', 'purple'])
})

test.skipIf(IS_FREEBUFF)('filled choices, actions and agent headers keep readable foregrounds in both themes', async () => {
  const previous = useThemeStore.getState().theme
  try {
    for (const theme of Object.values(chatThemes)) {
      useThemeStore.setState({ theme })
      useMessageBlockStore.getState().setContext({ theme, markdownPalette: createMarkdownPalette(theme) })
      const setup = await createTestRenderer({ width: 80, height: 22, backgroundColor: theme.agentContentBg })
      const root = createRoot(setup.renderer)
      try {
        flushSync(() => root.render(<box style={{ flexDirection: 'column' }}>
          <QuestionOption option={{ label: 'Focus choice', description: 'Choice description' }} indent={1} isSelected={false} isFocused onSelect={() => {}} onMouseOver={() => {}} />
          <OptionsList question={{ question: 'Choose', options: ['Option'] }} answer={undefined} optionIndent={1} focusedOptionIndex={1} isTypingCustom={false} onSelectOption={() => {}} onToggleOption={() => {}} onFocusOption={() => {}} />
          <AdCard width={78} ad={{ adText: 'Fixture', title: 'Advertisement', cta: 'Check pricing', url: '', favicon: '', clickUrl: '', impUrl: '' }} />
          <MessageWithAgents message={{ id: 'worker', variant: 'agent', content: 'Completed review.', timestamp: '12:00', agent: { agentName: 'Worker', agentType: 'code-reviewer', responseCount: 1 } }} depth={1} isLastMessage availableWidth={78} />
        </box>))
        await setup.renderOnce()
        const spans = setup.captureSpans().lines.flatMap((line) => line.spans)
        const hex = (color: typeof spans[number]['fg']) => '#' + color.toInts().slice(0, 3).map((c) => c.toString(16).padStart(2, '0')).join('')
        for (const label of ['Focus choice', 'Choice description', 'Custom', 'Type your own answer', 'Check pricing', 'Worker']) {
          const span = spans.find((span) => span.text.includes(label))!
          expect(span).toBeDefined()
          expect(contrast(hex(span.fg), hex(span.bg))).toBeGreaterThanOrEqual(4.5)
        }
        await saveFrame(`${theme.name}-80x22-filled-controls`, setup.captureSpans(), setup.captureCharFrame(), theme.agentContentBg)
      } finally {
        flushSync(() => root.unmount())
        setup.renderer.destroy()
      }
    }
  } finally {
    useThemeStore.setState({ theme: previous })
    useMessageBlockStore.getState().reset()
  }
})

test.skipIf(IS_FREEBUFF)('startup leaves room for work and follows the user accent override', async () => {
  const previous = useThemeStore.getState().theme
  useThemeStore.setState({ theme: { ...chatThemes.dark, primary: '#ddbbff' } })
  try {
    for (const [width, height] of [[120, 30], [40, 24], [80, 12]]) {
      const setup = await createTestRenderer({ width, height })
      const root = createRoot(setup.renderer)
      try {
        flushSync(() => root.render(<ChatHeader projectRoot="C:/work/ghostline" animationEnabled={false} />))
        await setup.renderOnce()
        const lines = setup.captureCharFrame().split('\n').filter((line) => line.trim())
        expect(lines.length).toBeLessThanOrEqual(3)
        expect(lines[0]).toContain('CBM-01')
        expect(lines.join('\n')).toContain('ghostline')
        const logo = setup.captureSpans().lines.flatMap((line) => line.spans).find((span) => span.text.includes('CBM-01'))!
        expect(logo.fg.toInts().slice(0, 3)).toEqual([221, 187, 255])
      } finally {
        flushSync(() => root.unmount())
        setup.renderer.destroy()
      }
    }
  } finally {
    useThemeStore.setState({ theme: previous })
  }
})
