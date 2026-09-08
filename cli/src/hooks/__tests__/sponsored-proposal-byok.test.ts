import React from 'react'
import { afterEach, beforeEach, expect, mock, spyOn, test } from 'bun:test'

const ads = await import('../../commands/ads')
const auth = await import('../../utils/auth')
const providers = await import('../../utils/providers')
const target = await import('../../utils/sponsored-proposal-target')
const { useChatStore } = await import('../../state/chat-store')
const { useSponsoredProposal } = await import('../use-sponsored-proposal')

// Same minimal dispatcher approach as use-timeout.test.ts; no terminal needed.
const internals = (React as any)
  .__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
let dispatcher: unknown
let originalBackend: string | undefined
let originalMessages: ReturnType<typeof useChatStore.getState>['messages']
let cleanup: (() => void) | undefined
let remote: ReturnType<typeof spyOn<typeof target, 'sponsoredProposalTarget'>>
let fetchMock: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>>
let profileMock: ReturnType<typeof spyOn<typeof providers, 'getActiveProfile'>>

beforeEach(() => {
  originalBackend = process.env.CODEBUFF_USE_BACKEND
  delete process.env.CODEBUFF_USE_BACKEND
  originalMessages = useChatStore.getState().messages
  useChatStore
    .getState()
    .setMessages([
      { id: 'user-test', variant: 'user', content: 'hello', timestamp: '' },
    ])
  spyOn(ads, 'getAdsEnabled').mockReturnValue(true)
  spyOn(auth, 'getAuthToken').mockReturnValue('byok-local-token')
  profileMock = spyOn(providers, 'getActiveProfile').mockReturnValue({
    id: 'test-profile',
  } as ReturnType<typeof providers.getActiveProfile>)
  remote = spyOn(target, 'sponsoredProposalTarget').mockResolvedValue(
    'example/repo',
  )
  fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(
    Response.json({ proposal: null }),
  )
  dispatcher = internals.H
  cleanup = undefined
  internals.H = {
    useCallback: (callback: unknown) => callback,
    useSyncExternalStore: (_subscribe: unknown, snapshot: () => unknown) =>
      snapshot(),
    useDebugValue() {},
    useRef: (current: unknown) => ({ current }),
    useEffect: (effect: () => (() => void) | undefined) => {
      cleanup = effect()
    },
  }
})

afterEach(() => {
  cleanup?.()
  internals.H = dispatcher
  useChatStore.getState().setMessages(originalMessages)
  if (originalBackend === undefined) delete process.env.CODEBUFF_USE_BACKEND
  else process.env.CODEBUFF_USE_BACKEND = originalBackend
  mock.restore()
})

async function mount() {
  useSponsoredProposal()
  // Drain the target and transport promises without waiting for a poll timer.
  await new Promise((resolve) => setImmediate(resolve))
}

test('enabled ads and synthetic BYOK login resolve no remote and make no request', async () => {
  await mount()
  expect(remote).not.toHaveBeenCalled()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('backend opt-in still suppresses proposals while a BYOK profile is active', async () => {
  process.env.CODEBUFF_USE_BACKEND = '1'
  await mount()
  expect(remote).not.toHaveBeenCalled()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('standalone mode without a profile also makes no proposal request', async () => {
  profileMock.mockReturnValue(null)
  await mount()
  expect(remote).not.toHaveBeenCalled()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('backend opt-in without BYOK preserves proposal polling', async () => {
  process.env.CODEBUFF_USE_BACKEND = '1'
  profileMock.mockReturnValue(null)
  await mount()
  expect(remote).toHaveBeenCalledTimes(1)
  expect(fetchMock).toHaveBeenCalledTimes(1)
})
