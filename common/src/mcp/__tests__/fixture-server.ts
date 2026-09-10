// Deliberately inert MCP peer: no browser, desktop, network or filesystem tools.
import { createInterface } from 'node:readline'

let failList = process.env.MCP_FIXTURE_FAIL_LIST_ONCE === '1'
createInterface({ input: process.stdin }).on('line', (line) => {
  const request = JSON.parse(line)
  if (request.id === undefined) return
  if (request.method === 'tools/list' && failList) {
    failList = false
    process.stdout.write(
      JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32000, message: 'Temporary discovery failure' },
      }) + '\n',
    )
    return
  }
  const result =
    request.method === 'initialize'
      ? {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'fixture', version: '1' },
        }
      : request.method === 'tools/list'
        ? {
            tools: [
              { name: `pid_${process.pid}`, inputSchema: { type: 'object' } },
            ],
          }
        : {
            content: [
              { type: 'image', mimeType: 'image/png', data: 'aW1hZ2U=' },
              { type: 'text', text: 'fixture' },
            ],
          }
  process.stdout.write(
    JSON.stringify({ jsonrpc: '2.0', id: request.id, result }) + '\n',
  )
})
