import { memo, useState } from 'react'

import { useLogo } from '../hooks/use-logo'
import { useSheenAnimation } from '../hooks/use-sheen-animation'
import { useTerminalDimensions } from '../hooks/use-terminal-dimensions'
import { useTheme } from '../hooks/use-theme'
import { DISPLAY_NAME, IS_FREEBUFF } from '../utils/constants'
import { openFileAtPath } from '../utils/open-file'
import { formatCwd } from '../utils/path-helpers'
import { getLogoAccentColor, getLogoBlockColor } from '../utils/theme-system'
import { TerminalLink } from './terminal-link'

export const ChatHeader = memo(function ChatHeader({
  projectRoot,
  animationEnabled,
}: {
  projectRoot: string
  animationEnabled: boolean
}) {
  const { contentMaxWidth, terminalWidth, terminalHeight } = useTerminalDimensions()
  const theme = useTheme()
  const [sheenPosition, setSheenPosition] = useState(0)
  const blockColor = getLogoBlockColor(theme.name)
  const accentColor = getLogoAccentColor(theme.name)
  const { applySheenToChar } = useSheenAnimation({
    enabled: IS_FREEBUFF && animationEnabled,
    logoColor: theme.foreground,
    accentColor,
    blockColor,
    terminalWidth,
    sheenPosition,
    setSheenPosition,
  })
  const { component: logoComponent } = useLogo({
    availableWidth: contentMaxWidth,
    maxHeight: IS_FREEBUFF ? undefined : Math.max(1, terminalHeight - 12),
    accentColor,
    textColor: IS_FREEBUFF ? undefined : theme.primary,
    blockColor,
    applySheenToChar,
  })

  return (
    <box
      style={{
        flexDirection: 'column',
        gap: 0,
        paddingLeft: 1,
        paddingRight: 1,
      }}
    >
      <box
        style={{
          flexDirection: 'column',
          marginTop: IS_FREEBUFF ? 2 : 0,
          marginBottom: IS_FREEBUFF ? 1 : 0,
        }}
      >
        {logoComponent}
      </box>
      {IS_FREEBUFF && <text style={{ wrapMode: 'word', marginBottom: 1, fg: theme.foreground }}>
        {DISPLAY_NAME} will run commands on your behalf
        to help you build.
      </text>}
      <text style={{ wrapMode: 'word', marginBottom: 1, fg: IS_FREEBUFF ? theme.foreground : theme.muted }}>
        Directory{' '}
        <TerminalLink
          text={formatCwd(projectRoot)}
          color={theme.muted}
          inline={true}
          underlineOnHover={true}
          onActivate={() => openFileAtPath(projectRoot)}
        />
      </text>
    </box>
  )
})
