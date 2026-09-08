// Protocol observed in stnly/pi-grok at 8b304e65 (MIT), 2026-09-09.
export const GROK_BASE_URL = 'https://cli-chat-proxy.grok.com/v1'
export const GROK_AUTH_URL = 'https://auth.x.ai'
export const GROK_CLIENT_ID = 'b1a00492-073a-47ea-816f-4c329264a828'
export const GROK_CLIENT_VERSION = '0.2.101'
export const GROK_FALLBACK_MODELS = [
  'grok-4.6',
  'grok-4.5',
  'grok-composer-2.5-fast',
  'grok-build',
  'grok-4.3',
]

export function grokHeaders(
  accessToken: string,
  model?: string,
): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'User-Agent': `grok-shell/${GROK_CLIENT_VERSION} (${process.platform}; ${process.arch})`,
    'x-grok-client-identifier': 'grok-shell',
    'x-grok-client-version': GROK_CLIENT_VERSION,
    'x-grok-client-mode': 'interactive',
    'X-XAI-Token-Auth': 'xai-grok-cli',
    'x-authenticateresponse': 'authenticate-response',
    ...(model ? { 'x-grok-model-override': model } : {}),
  }
}
