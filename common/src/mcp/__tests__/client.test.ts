import { expect, test } from 'bun:test'
import path from 'node:path'
import * as mcp from '../client'

const config = {
  type: 'stdio' as const,
  command: process.execPath,
  args: [path.join(import.meta.dir, 'fixture-server.ts')],
  env: {},
}

test('concurrent discovery shares one process; close invalidates tools and permits a fresh process', async () => {
  const ids = await Promise.all([
    mcp.getMCPClient(config),
    mcp.getMCPClient(config),
  ])
  try {
    expect(ids[0]).toBe(ids[1])
    const firstTools = await mcp.listMCPTools(ids[0])
    const output = await mcp.callMCPTool(ids[0], { name: 'screenshot' })
    expect(output).toEqual([
      { type: 'media', mediaType: 'image/png', data: 'aW1hZ2U=' },
      { type: 'json', value: 'fixture' },
    ])
    expect(typeof mcp.closeMCPClient).toBe('function')
    await mcp.closeMCPClient(config)
    expect(() => mcp.listMCPTools(ids[0])).toThrow('client not found')
    const second = await mcp.getMCPClient(config)
    expect((await mcp.listMCPTools(second)).tools[0].name).not.toBe(
      firstTools.tools[0].name,
    )
    await mcp.closeMCPClient(config)
    await mcp.closeMCPClient(config)
  } finally {
    if (mcp.closeMCPClient) await mcp.closeMCPClient(config)
  }
})

test('failed discovery can be retried without restarting the CLI', async () => {
  const transient = { ...config, env: { MCP_FIXTURE_FAIL_LIST_ONCE: '1' } }
  const id = await mcp.getMCPClient(transient)
  try {
    await expect(mcp.listMCPTools(id)).rejects.toThrow(
      'Temporary discovery failure',
    )
    expect((await mcp.listMCPTools(id)).tools).toHaveLength(1)
  } finally {
    await mcp.closeMCPClient(transient)
  }
})
