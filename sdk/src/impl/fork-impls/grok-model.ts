import { GROK_BASE_URL, grokHeaders } from '@codebuff/common/constants/grok'
import { OpenAICompatibleChatLanguageModel } from '@codebuff/llm-providers/openai-compatible'

import {
  convertMessages,
  convertTools,
  transformResponseStream,
} from '../chatgpt-backend-fetch'

export function createGrokModel(model: string, accessToken: string) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(model))
    throw new Error('Invalid Grok model ID; select a model with /model.')
  return new OpenAICompatibleChatLanguageModel(model, {
    provider: 'grok',
    url: () => `${GROK_BASE_URL}/responses`,
    headers: () => grokHeaders(accessToken, model),
    supportsStructuredOutputs: true,
    fetch: (async (_input, init) => {
      const body = JSON.parse(String(init?.body))
      const messages: Parameters<typeof convertMessages>[0] =
        body.messages ?? []
      const instructions = messages
        .filter((message) => ['system', 'developer'].includes(message.role))
        .map((message) =>
          typeof message.content === 'string'
            ? message.content
            : JSON.stringify(message.content),
        )
        .join('\n\n')
      const request: Record<string, unknown> = {
        model,
        instructions: instructions || 'You are a helpful assistant.',
        input: convertMessages(
          messages.filter(
            (message) => !['system', 'developer'].includes(message.role),
          ),
          false,
        ),
        stream: true,
        store: false,
      }
      if (body.tools?.length) {
        // xAI rejects slash-bearing enum values. Runtime tool validation remains authoritative.
        request.tools = JSON.parse(
          JSON.stringify(convertTools(body.tools), (key, value) =>
            key === 'enum' &&
            Array.isArray(value) &&
            value.some((item) => typeof item === 'string' && item.includes('/'))
              ? undefined
              : value,
          ),
        )
      }
      if (body.tool_choice != null) {
        request.tool_choice =
          body.tool_choice?.type === 'function'
            ? { type: 'function', name: body.tool_choice.function.name }
            : body.tool_choice
      }
      if (typeof body.max_tokens === 'number')
        request.max_output_tokens = body.max_tokens
      if (body.response_format) {
        request.text = {
          format:
            body.response_format.type === 'json_schema'
              ? { type: 'json_schema', ...body.response_format.json_schema }
              : body.response_format,
        }
      }
      const response = await globalThis.fetch(`${GROK_BASE_URL}/responses`, {
        ...init,
        redirect: 'error',
        body: JSON.stringify(request),
      })
      if (!response.ok || !response.body) return response
      // Grok reasoning cannot be replayed as Codex encrypted reasoning items.
      const stream = transformResponseStream(response.body, false)
      if (!body.stream) return collectCompletion(stream, model)
      return new Response(stream, {
        status: response.status,
        headers: { 'content-type': 'text/event-stream' },
      })
    }) as typeof fetch,
  })
}

// The subscription proxy streams. Runtime helpers using generateText need one
// Chat Completions JSON response after the same stream has finished.
async function collectCompletion(
  stream: ReadableStream<Uint8Array>,
  model: string,
): Promise<Response> {
  const message = {
    role: 'assistant',
    content: '',
    reasoning_content: '',
    tool_calls: [] as {
      id: string
      type: 'function'
      function: { name: string; arguments: string }
    }[],
  }
  let id: string | undefined
  let usage: unknown
  let finishReason: string | null = null
  const text = await new Response(stream).text()
  for (const line of text.split('\n')) {
    if (!line.startsWith('data: ') || line === 'data: [DONE]') continue
    const chunk = JSON.parse(line.slice(6))
    if (chunk.error)
      return Response.json({ error: chunk.error }, { status: 502 })
    id = chunk.id ?? id
    usage = chunk.usage ?? usage
    const choice = chunk.choices?.[0]
    if (!choice) continue
    finishReason = choice.finish_reason ?? finishReason
    const delta = choice.delta ?? {}
    message.content += delta.content ?? ''
    message.reasoning_content += delta.reasoning_content ?? ''
    for (const call of delta.tool_calls ?? []) {
      const target = (message.tool_calls[call.index] ??= {
        id: '',
        type: 'function',
        function: { name: '', arguments: '' },
      })
      target.id = call.id ?? target.id
      target.function.name += call.function?.name ?? ''
      target.function.arguments += call.function?.arguments ?? ''
    }
  }
  if (!finishReason) throw new Error('Grok response ended before completion')
  return Response.json({
    id,
    model,
    choices: [{ index: 0, message, finish_reason: finishReason }],
    usage,
  })
}
