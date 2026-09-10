import React from 'react'

import { ChatHeader } from '../../components/chat-header'
import { ChatInputBar } from '../../components/chat-input-bar'
import { MessageWithAgents } from '../../components/message-with-agents'
import { StatusBar } from '../../components/status-bar'
import { useTheme } from '../../hooks/use-theme'
import type { ChatMessage } from '../../types/chat'

// Actual production components with controlled data and the chat's existing
// transcript/dock gutters. No app boot, profile access, authentication or LLM.
export function GhostlineFixture({ width, height, state, focused = true }: {
  width: number
  height: number
  state: 'empty' | 'active' | 'providers' | 'input' | 'feedback'
  focused?: boolean
}) {
  const theme = useTheme()
  const inputRef = React.useRef(null)
  const [value, setValue] = React.useState(state === 'input' ? 'Inspect the input renderer' : '')
  const [cursor, setCursor] = React.useState(value.length)
  const messages: ChatMessage[] = state === 'feedback' ? [
    { id: 'feedback', variant: 'ai', content: '', timestamp: '12:00', userError: 'Request failed. Try again.', blocks: [
      { type: 'text', content: 'Warning: Review changes before running.', color: theme.warning },
      { type: 'text', content: 'Success: Changes saved.', color: theme.success },
    ] },
  ] : state === 'active' ? [
    { id: 'task', variant: 'user', content: 'Inspect the input renderer.', timestamp: '12:00' },
    { id: 'reply', variant: 'ai', content: '', timestamp: '12:00', blocks: [
      { type: 'tool', toolCallId: 'read', toolName: 'read_files', input: { paths: ['cli/src/components/chat-input-bar.tsx'] }, output: 'Read 540 lines.', isCollapsed: true },
      { type: 'text', content: 'The composer now leaves more room for your work. Keyboard navigation remains available.' },
    ] },
  ] : state === 'providers' ? [
    { id: 'providers', variant: 'ai', timestamp: '12:00', content: 'BYOK provider profiles (active marked with *):\n  * local-profile  Personal subscription  (codex)\nCurrent model: gpt-5.5-project-review-long-model-label\nUse /model <id> to change.' },
  ] : []
  return (
    <box style={{ width: '100%', height: '100%', flexDirection: 'column' }}>
      <scrollbox scrollX={false} stickyScroll stickyStart="bottom" scrollbarOptions={{ visible: false }} style={{
        flexGrow: 1,
        contentOptions: { flexDirection: 'column', paddingLeft: 1, paddingRight: 2, paddingBottom: 1, justifyContent: 'flex-end' },
      }}>
        <ChatHeader projectRoot={state === 'providers' ? 'C:/work/a-long-project-directory/terminal-components' : 'C:/work/ghostline'} animationEnabled={false} />
        {messages.map((message, index) => <MessageWithAgents key={message.id} message={message} depth={0} isLastMessage={index === messages.length - 1} availableWidth={width - 2} />)}
      </scrollbox>
      <box style={{ flexShrink: 0 }}>
        {state === 'active' && <StatusBar timerStartTime={null} isAtBottom scrollToLatest={() => {}} statusIndicatorState={{ kind: 'streaming' }} onStop={() => {}} freebuffSession={null} />}
        <ChatInputBar
          inputValue={value} cursorPosition={cursor}
          setInputValue={(next) => {
            const input = typeof next === 'function' ? next({ text: value, cursorPosition: cursor, lastEditDueToNav: false }) : next
            setValue(input.text)
            setCursor(input.cursorPosition)
          }}
          inputFocused={focused} inputRef={inputRef} inputPlaceholder="Enter a task, or / for commands"
          lastEditDueToNav={false} agentMode="DEFAULT" toggleAgentMode={() => {}} setAgentMode={() => {}}
          hasSlashSuggestions={state === 'providers'} hasMentionSuggestions={false} hasSuggestionMenu={state === 'providers'}
          slashSuggestionItems={[
            { id: 'model', label: 'model', description: 'Select a model' },
            { id: 'providers', label: 'providers', description: 'Manage profiles' },
          ]}
          agentSuggestionItems={[]} fileSuggestionItems={[]} slashSelectedIndex={0} agentSelectedIndex={0}
          theme={theme} terminalHeight={height} separatorWidth={width - 2} shouldCenterInputVertically={false}
          inputBoxTitle={undefined} isCompactHeight={height < 20} isNarrowWidth={width < 50}
          feedbackMode={false} handleExitFeedback={() => {}} publishMode={false} handleExitPublish={() => {}}
          handlePublish={async () => {}} handleSubmit={async () => {}} onPaste={() => {}} onInterruptStream={() => {}}
        />
      </box>
    </box>
  )
}
