import { beforeEach, describe, expect, test } from 'bun:test'
import { streamText } from 'ai'

import { createOpenAIOAuthModel } from '../model-provider'

import {
  __resetReasoningCache,
  captureReasoningFromOutput,
  convertMessages,
} from '../chatgpt-backend-fetch'

describe('Codex reasoning round-trip', () => {
  beforeEach(() => __resetReasoningCache())

  test('replays cached reasoning item immediately before its function_call', () => {
    // Turn 1 completed: reasoning item drove a function_call.
    captureReasoningFromOutput([
      { type: 'reasoning', id: 'rs_1', encrypted_content: 'ENC', summary: [] },
      {
        type: 'function_call',
        call_id: 'call_1',
        name: 'todo',
        arguments: '{}',
      },
    ])

    // Turn 2 request: the assistant/tool history must carry the reasoning back.
    const input = convertMessages([
      {
        role: 'assistant',
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: { name: 'todo', arguments: '{}' },
          },
        ],
      },
      { role: 'tool', tool_call_id: 'call_1', content: 'ok' },
    ])

    expect(input[0]).toMatchObject({
      type: 'reasoning',
      id: 'rs_1',
      encrypted_content: 'ENC',
    })
    expect(input[1]).toMatchObject({ type: 'function_call', call_id: 'call_1' })
  })

  test('emits one reasoning item before a batch of tool calls, not once per call', () => {
    captureReasoningFromOutput([
      { type: 'reasoning', id: 'rs_2', encrypted_content: 'ENC2', summary: [] },
      { type: 'function_call', call_id: 'call_a', name: 'a', arguments: '{}' },
      { type: 'function_call', call_id: 'call_b', name: 'b', arguments: '{}' },
    ])

    const input = convertMessages([
      {
        role: 'assistant',
        tool_calls: [
          {
            id: 'call_a',
            type: 'function',
            function: { name: 'a', arguments: '{}' },
          },
          {
            id: 'call_b',
            type: 'function',
            function: { name: 'b', arguments: '{}' },
          },
        ],
      },
    ])

    const reasoningItems = input.filter(
      (i) => (i as Record<string, unknown>).type === 'reasoning',
    )
    expect(reasoningItems).toHaveLength(1)
    expect(input[0]).toMatchObject({ type: 'reasoning', id: 'rs_2' })
    expect(input[1]).toMatchObject({ type: 'function_call', call_id: 'call_a' })
    expect(input[2]).toMatchObject({ type: 'function_call', call_id: 'call_b' })
  })

  test('no cached reasoning → function_call emitted alone, no crash', () => {
    const input = convertMessages([
      {
        role: 'assistant',
        tool_calls: [
          {
            id: 'call_absent',
            type: 'function',
            function: { name: 'x', arguments: '{}' },
          },
        ],
      },
    ])
    expect(input).toHaveLength(1)
    expect(input[0]).toMatchObject({
      type: 'function_call',
      call_id: 'call_absent',
    })
  })

  test('SDK 7 replays encrypted reasoning through the actual OAuth fetch adapter', async () => {
    const originalFetch = globalThis.fetch
    const requests: any[] = []
    const reasoning = {
      type: 'reasoning',
      id: 'rs_wire',
      encrypted_content: 'ENC_WIRE',
      summary: [],
    }
    const call = {
      type: 'function_call',
      call_id: 'call_wire',
      name: 'todo',
      arguments: '{}',
    }
    globalThis.fetch = (async (_input, init) => {
      requests.push(JSON.parse(String(init?.body)))
      return new Response(
        `data: ${JSON.stringify({
          type: 'response.completed',
          response: {
            id: 'response_wire',
            status: 'completed',
            output: [reasoning, call],
          },
        })}\n\n`,
        { headers: { 'content-type': 'text/event-stream' } },
      )
    }) as typeof fetch
    try {
      const model = createOpenAIOAuthModel('openai/gpt-5.3', 'fake-oauth-token')
      const first = streamText({
        model,
        messages: [{ role: 'user', content: 'go' }],
        maxRetries: 0,
      })
      for await (const part of first.stream) {
        if (part.type === 'error') throw part.error
      }
      const second = streamText({
        model,
        maxRetries: 0,
        messages: [
          {
            role: 'assistant',
            content: [
              {
                type: 'tool-call',
                toolCallId: 'call_wire',
                toolName: 'todo',
                input: {},
              },
            ],
          },
          {
            role: 'tool',
            content: [
              {
                type: 'tool-result',
                toolCallId: 'call_wire',
                toolName: 'todo',
                output: { type: 'text', value: 'ok' },
              },
            ],
          },
        ],
      })
      for await (const part of second.stream) {
        if (part.type === 'error') throw part.error
      }
      expect(requests).toHaveLength(2)
      expect(requests[1].store).toBe(false)
      const callIndex = requests[1].input.findIndex(
        (item: any) => item.type === 'function_call',
      )
      expect(callIndex).toBeGreaterThan(0)
      expect(requests[1].input[callIndex - 1]).toEqual(reasoning)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
