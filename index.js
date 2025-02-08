#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { exec } from 'child_process'
import path from 'path';
import os from 'os';

const db_dir = os.platform() === 'darwin' ?  'Library/Application Support/notedeck/db' :  '.local/share/notedeck/db';
const default_db = path.join(os.homedir(), db_dir)

// Function to execute ndb command line tool
function executeNdbCommand (args) {
  return new Promise((resolve, reject) => {
	  console.error(`executing ndb ${args}`)
    exec(`ndb ${args}`, { }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr))
        return
      }
      resolve(stdout.trim())
    })
  })
}

const tools = [
  {
    name: "ndb_stat",
    description: 'Get statistics of the NDB.',
    inputSchema: {
      type: 'object',
      properties: {
        dbDir: { type: 'string', description: 'The database directory', default: default_db }
      },
      required: ['dbDir']
    },
    execute: ({ dbDir }) => {
      dbDir = dbDir || default_db;
      return executeNdbCommand(`-d ${dbDir} stat`)
    }
  },
  {
    name: "ndb_query",
    description: 'Query the NDB with specific parameters.',
    inputSchema: {
      type: 'object',
      properties: {
        dbDir: { type: 'string', description: 'The database directory', default: default_db },
        limit: { type: 'number', description: 'Returns results in descending order, with at most this many results', default: 100 },
        kind: { type: 'number', description: 'The note kind to filter on. Text notes are 1' },
        author: { type: 'string', description: 'The author pubkey' },
        search: { type: 'string', description: 'The full text search string' }
      },
      required: ["limit"]
    },
    execute: ({ dbDir, limit, kind, author, search }) => {
      dbDir = dbDir || default_db;
      let queryArgs = `-d ${dbDir} query`
      if (limit != null) queryArgs += ` --limit ${limit}`
      if (kind != null) queryArgs += ` --kind ${kind}`
      if (author) queryArgs += ` --author ${author}`
      if (search) queryArgs += ` --search "${search}"`
      return executeNdbCommand(queryArgs)
    }
  }
]

const server = new Server({
  name: 'nostrdb-server',
  version: '1.0.0'
}, {
  capabilities: { tools: {} }
})

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  if (!args) {
    throw new Error(`No arguments provided for tool: ${name}`)
  }

  const tool = tools.find((t) => t.name === name);
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`)
  }

  return { content: [{ type: 'text', text: JSON.stringify(await tool.execute(args), null, 2) }] }
})

async function main () {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Nostrdb MCP Server running on stdio')
}

main().catch((error) => {
  console.error('Fatal error in main():', error)
  process.exit(1)
})
