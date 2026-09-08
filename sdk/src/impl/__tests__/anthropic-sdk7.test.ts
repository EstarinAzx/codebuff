import { afterEach, expect, test } from 'bun:test'
import { generateText, streamText } from 'ai'

import { getModelForRequest, setActiveByokProfile } from '../model-provider'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  setActiveByokProfile(null)
})

for (const streaming of [false, true]) {
  test(`Anthropic BYOK sends SDK 7 image bytes (${streaming ? 'stream' : 'generate'})`, async () => {
    const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
    let sentBody: any
    globalThis.fetch = (async (_input, init) => {
      sentBody = JSON.parse(String(init?.body))
      const message = {
        id: 'msg_test',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-4-5',
        content: [{ type: 'text', text: 'ok' }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 1, output_tokens: 1 },
      }
      if (!streaming) return Response.json(message)
      const events = [
        { type: 'message_start', message: { ...message, content: [] } },
        {
          type: 'content_block_start',
          index: 0,
          content_block: { type: 'text', text: '' },
        },
        {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'text_delta', text: 'ok' },
        },
        { type: 'content_block_stop', index: 0 },
        {
          type: 'message_delta',
          delta: { stop_reason: 'end_turn', stop_sequence: null },
          usage: { output_tokens: 1 },
        },
        { type: 'message_stop' },
      ]
      return new Response(
        events
          .map(
            (event) =>
              `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`,
          )
          .join(''),
        {
          headers: { 'content-type': 'text/event-stream' },
        },
      )
    }) as typeof fetch
    setActiveByokProfile({
      provider: 'anthropic',
      baseUrl: 'https://example.com/v1',
      apiKey: 'test-key',
    })
    const { model } = await getModelForRequest({
      apiKey: '',
      model: 'claude-sonnet-4-5',
    })
    const options = {
      model,
      maxRetries: 0,
      messages: [
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: 'What is this?' },
            { type: 'file' as const, data: bytes, mediaType: 'image/png' },
          ],
        },
      ],
    }
    if (streaming) {
      const result = streamText(options)
      for await (const _part of result.stream) {
      }
      expect(await result.text).toBe('ok')
    } else {
      expect((await generateText(options)).text).toBe('ok')
    }
    expect(sentBody.messages[0].content[1].source).toEqual({
      type: 'base64',
      media_type: 'image/png',
      data: Buffer.from(bytes).toString('base64'),
    })
  })
}
