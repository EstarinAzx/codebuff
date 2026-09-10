import React, { useMemo } from 'react'

import { LOGO, LOGO_SMALL, SHADOW_CHARS } from '../login/constants'
import { parseLogoLines } from '../login/utils'
import { DISPLAY_NAME } from '../utils/constants'

interface UseLogoOptions {
  /**
   * Available width for rendering the logo
   */
  availableWidth: number
  /**
   * Optional function to apply styling to each character (e.g., for sheen animation)
   * If not provided, default coloring is applied (white blocks, accent shadows)
   */
  applySheenToChar?: (
    char: string,
    charIndex: number,
    lineIndex: number,
  ) => React.ReactNode
  /**
   * Color to apply to the text variant
   */
  textColor?: string
  /**
   * Accent color for shadow/border characters (defaults to acid green #9EFC62)
   */
  accentColor?: string
  /**
   * Block color for solid block characters (white for dark mode, black for light mode)
   */
  blockColor?: string
  /**
   * Optional vertical budget (in rows) for the logo. When fewer than the
   * artwork's rows are available, the hook downgrades to the single-line
   * text variant so callers on short terminals don't have to special-case it.
   */
  maxHeight?: number
}

interface LogoResult {
  /**
   * The formatted logo as a React component ready to render in UI
   */
  component: React.ReactNode
  /**
   * The formatted logo string for plain text contexts (e.g., chat messages)
   * Empty string for narrow widths, formatted ASCII art otherwise
   */
  textBlock: string
}

// Measure the actual art once. A historical breakpoint can silently crop a new logo.
const LOGO_VARIANTS = [LOGO, LOGO_SMALL].map((art) => {
  const lines = parseLogoLines(art)
  return {
    art,
    width: Math.max(...lines.map((line) => line.length)),
    height: lines.length,
  }
})

/** Render the largest complete banner that fits, or the compact product name. */
export const useLogo = ({
  availableWidth,
  applySheenToChar,
  textColor,
  accentColor = '#9EFC62',
  blockColor = '#ffffff',
  maxHeight,
}: UseLogoOptions): LogoResult => {
  const rawLogoString = useMemo(
    () =>
      LOGO_VARIANTS.find(
        ({ width, height }) =>
          width <= availableWidth && (maxHeight == null || height <= maxHeight),
      )?.art ?? DISPLAY_NAME,
    [availableWidth, maxHeight],
  )

  // Format text block for plain text contexts (chat messages, etc.)
  const textBlock = useMemo(() => {
    if (rawLogoString === DISPLAY_NAME) {
      return '' // Don't show ASCII art for text-only variant in plain text contexts
    }
    // Parse and format for plain text display
    return parseLogoLines(rawLogoString)
      .map((line) => line.slice(0, availableWidth))
      .join('\n')
  }, [rawLogoString, availableWidth])

  // Format component for React contexts (login modal, etc.)
  const component = useMemo(() => {
    // Text-only variant for very narrow widths
    if (rawLogoString === DISPLAY_NAME) {
      return (
        <text style={{ wrapMode: 'none' }}>
          <b>
            {textColor ? (
              <span fg={textColor}>{DISPLAY_NAME}</span>
            ) : (
              <>{DISPLAY_NAME}</>
            )}
          </b>
        </text>
      )
    }

    // ASCII art variant
    const logoLines = parseLogoLines(rawLogoString)
    const displayLines = logoLines.map((line) => line.slice(0, availableWidth))

    // Default coloring function: blockColor for blocks, accent color for shadows
    const defaultColorChar = (char: string, charIndex: number) => {
      if (char === ' ' || char === '\n') {
        return <span key={charIndex}>{char}</span>
      }
      // Block characters use blockColor (white in dark mode, black in light mode)
      if (char === '█') {
        return (
          <span key={charIndex} fg={blockColor}>
            {char}
          </span>
        )
      }
      // Shadow/border characters get accent color
      if (SHADOW_CHARS.has(char)) {
        return (
          <span key={charIndex} fg={accentColor}>
            {char}
          </span>
        )
      }
      // Other characters use accent color
      return (
        <span key={charIndex} fg={accentColor}>
          {char}
        </span>
      )
    }

    return (
      <>
        {displayLines.map((line, lineIndex) => (
          <text key={`logo-line-${lineIndex}`} style={{ wrapMode: 'none' }}>
            {line
              .split('')
              .map((char, charIndex) =>
                applySheenToChar
                  ? applySheenToChar(char, charIndex, lineIndex)
                  : defaultColorChar(char, charIndex),
              )}
          </text>
        ))}
      </>
    )
  }, [
    rawLogoString,
    availableWidth,
    applySheenToChar,
    textColor,
    accentColor,
    blockColor,
    maxHeight,
  ])

  return { component, textBlock }
}
