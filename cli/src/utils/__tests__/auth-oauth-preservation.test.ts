import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, mock, spyOn, test } from 'bun:test'

const auth = await import('../auth')
const sdkCredentials = await import('../../../../sdk/src/credentials')
const sdkEnv = await import('../../../../sdk/src/env')

const user = {
  id: 'test-user',
  name: 'Test User',
  email: 'test@example.com',
  authToken: 'test-token',
  fingerprintId: 'test-id',
  fingerprintHash: 'test-hash',
}
const oauth = {
  accessToken: 'synthetic-access',
  refreshToken: 'synthetic-refresh',
  expiresAt: 4_000_000_000_000,
  connectedAt: 1,
}
let directory: string
let file: string

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-oauth-preservation-'))
  file = path.join(directory, 'credentials.json')
  spyOn(auth, 'getConfigDir').mockReturnValue(directory)
  spyOn(auth, 'getCredentialsPath').mockReturnValue(file)
  spyOn(sdkCredentials, 'getCredentialsPath').mockReturnValue(file)
  spyOn(sdkEnv, 'getChatGptOAuthTokenFromEnv').mockReturnValue(undefined)
  fs.writeFileSync(file, JSON.stringify({ default: user, chatgptOAuth: oauth }))
})

afterEach(() => {
  mock.restore()
  fs.rmSync(directory, { recursive: true, force: true })
})

test('saving CLI login preserves OAuth credentials readable by SDK Path A', () => {
  auth.saveUserCredentials({ ...user, authToken: 'new-test-token' })
  expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toEqual({
    default: { ...user, authToken: 'new-test-token' },
    chatgptOAuth: oauth,
  })
  expect(sdkCredentials.getChatGptOAuthCredentials()).toEqual(oauth)
})

test('clearing CLI login removes only default and preserves SDK Path A credentials', () => {
  auth.clearUserCredentials()
  expect(fs.existsSync(file)).toBe(true)
  expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toEqual({
    chatgptOAuth: oauth,
  })
  expect(sdkCredentials.getChatGptOAuthCredentials()).toEqual(oauth)
})

test('clearing a standalone CLI login still deletes its empty credentials file', () => {
  fs.writeFileSync(file, JSON.stringify({ default: user }))
  auth.clearUserCredentials()
  expect(fs.existsSync(file)).toBe(false)
})

test('clearing malformed null credentials still removes the invalid file', () => {
  fs.writeFileSync(file, 'null')
  auth.clearUserCredentials()
  expect(fs.existsSync(file)).toBe(false)
})
