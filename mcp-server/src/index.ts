#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

import { callHumanApi } from './client.js'

const server = new McpServer({
  name: 'humanapi',
  version: '2.0.0',
})

function resultContent(value: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
      },
    ],
  }
}

async function invokeTool(tool: string, args: Record<string, unknown>) {
  try {
    return resultContent(await callHumanApi(tool, args))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected HumanAPI error'
    return { ...resultContent(message), isError: true }
  }
}

const coordinateSchema = {
  lat: z.number().min(-90).max(90).describe('Latitude'),
  lon: z.number().min(-180).max(180).describe('Longitude'),
}

server.registerTool(
  'search_humans',
  {
    title: 'Search humans',
    description: 'Search for available human experts matching task requirements.',
    inputSchema: {
      skills: z.array(z.string()).optional().describe('Required verified skills'),
      location: z.object(coordinateSchema).optional().describe('Search origin'),
      max_distance: z.number().positive().optional().describe('Maximum distance in metres'),
      rate_min: z.number().nonnegative().optional().describe('Minimum hourly rate'),
      rate_max: z.number().nonnegative().optional().describe('Maximum hourly rate'),
      rating_min: z.number().min(0).max(5).optional().describe('Minimum rating'),
      available_now: z.boolean().optional().describe('Only return currently available humans'),
    },
  },
  (args) => invokeTool('search_humans', args)
)

server.registerTool(
  'get_human',
  {
    title: 'Get human',
    description: 'Get a human expert profile by HumanProfile ID.',
    inputSchema: {
      id: z.string().min(1).describe('HumanProfile ID'),
    },
  },
  (args) => invokeTool('get_human', args)
)

server.registerTool(
  'book_human',
  {
    title: 'Book human',
    description: 'Create a task and booking for an available human expert.',
    inputSchema: {
      human_id: z.string().min(1).describe('HumanProfile ID'),
      task_description: z.string().min(1).describe('Task description'),
      task_location: z
        .object({
          ...coordinateSchema,
          address: z.string().min(1).optional(),
        })
        .describe('Task location'),
      scheduled_time: z.string().datetime({ offset: true }).describe('ISO 8601 time'),
      estimated_duration: z.number().int().positive().describe('Duration in minutes'),
      payment_amount: z.number().positive().describe('Payment amount in CNY'),
      payment_method: z.string().min(1).optional().describe('Payment method reference'),
      agent_id: z.string().min(1).describe('Agent user ID'),
    },
  },
  (args) => invokeTool('book_human', args)
)

server.registerTool(
  'get_booking',
  {
    title: 'Get booking',
    description: 'Get the current details and state of a booking.',
    inputSchema: {
      id: z.string().min(1).describe('Booking ID'),
    },
  },
  (args) => invokeTool('get_booking', args)
)

server.registerTool(
  'update_booking',
  {
    title: 'Update booking',
    description: 'Advance or cancel a booking using a valid state transition.',
    inputSchema: {
      id: z.string().min(1).describe('Booking ID'),
      status: z
        .enum(['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
        .describe('New booking status'),
      proof: z.string().min(1).optional().describe('Completion proof'),
    },
  },
  (args) => invokeTool('update_booking', args)
)

server.registerTool(
  'list_skills',
  {
    title: 'List skills',
    description: 'List all HumanAPI skill categories and skills.',
    inputSchema: {},
  },
  (args) => invokeTool('list_skills', args)
)

server.registerTool(
  'create_review',
  {
    title: 'Create review',
    description:
      'Review a completed booking. The reviewer must be the agent or human of the booking.',
    inputSchema: {
      booking_id: z.string().min(1).describe('Booking ID'),
      reviewer_id: z.string().min(1).describe('Reviewer user ID'),
      rating: z.number().min(1).max(5).describe('Rating between 1 and 5'),
      comment: z.string().min(1).optional().describe('Optional review comment'),
    },
  },
  (args) => invokeTool('create_review', args)
)

server.registerTool(
  'send_message',
  {
    title: 'Send message',
    description: 'Send a message inside a booking conversation.',
    inputSchema: {
      booking_id: z.string().min(1).describe('Booking ID'),
      sender_id: z.string().min(1).describe('Sender user ID'),
      recipient_id: z.string().min(1).describe('Recipient user ID'),
      content: z.string().min(1).describe('Message content'),
    },
  },
  (args) => invokeTool('send_message', args)
)

server.registerTool(
  'create_dispute',
  {
    title: 'Create dispute',
    description:
      'Open a dispute for a booking and move it into the DISPUTED state.',
    inputSchema: {
      booking_id: z.string().min(1).describe('Booking ID'),
      reporter_id: z.string().min(1).describe('Reporter user ID'),
      reason: z.string().min(1).describe('Short dispute reason'),
      description: z.string().min(1).describe('Detailed description'),
      evidence: z
        .array(z.record(z.string(), z.unknown()))
        .optional()
        .describe('Optional evidence entries'),
    },
  },
  (args) => invokeTool('create_dispute', args)
)

server.registerTool(
  'get_dispute',
  {
    title: 'Get dispute',
    description: 'Read a dispute by ID.',
    inputSchema: {
      id: z.string().min(1).describe('Dispute ID'),
    },
  },
  (args) => invokeTool('get_dispute', args)
)

server.registerTool(
  'list_disputes',
  {
    title: 'List disputes',
    description: 'List disputes, optionally filtered by status or booking.',
    inputSchema: {
      status: z
        .enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'REJECTED'])
        .optional()
        .describe('Filter by dispute status'),
      booking_id: z.string().min(1).optional().describe('Filter by booking ID'),
    },
  },
  (args) => invokeTool('list_disputes', args)
)

server.registerTool(
  'resolve_dispute',
  {
    title: 'Resolve dispute',
    description: 'Close a dispute as RESOLVED or REJECTED.',
    inputSchema: {
      id: z.string().min(1).describe('Dispute ID'),
      status: z.enum(['RESOLVED', 'REJECTED']).describe('Closing status'),
      resolution: z.string().min(1).optional().describe('Resolution note'),
    },
  },
  (args) => invokeTool('resolve_dispute', args)
)

const transport = new StdioServerTransport()
await server.connect(transport)
