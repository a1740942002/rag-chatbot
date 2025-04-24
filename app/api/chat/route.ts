import { createResource } from '@/lib/actions/resources'
import { openai } from '@ai-sdk/openai'
import { streamText, tool } from 'ai'
import { z } from 'zod'
import { findRelevantContent } from '@/lib/ai/embedding'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    system: `You are a helpful assistant. always check your knowledge base (using getInformation tool) before answering any questions.

    if no relevant information is found in the tool calls, respond something like "Sorry, I don't know, but if you tell me more I will memorize it."
    Combine those information and respond to questions`,
    tools: {
      getInformation: tool({
        description: `get information from your knowledge base to answer questions`,
        parameters: z.object({
          question: z.string().describe('the users question')
        }),
        execute: async ({ question }) => findRelevantContent(question)
      }),
      addResource: tool({
        description: `add a resource to your knowledge base.
          If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
        parameters: z.object({
          content: z
            .string()
            .describe('the content or resource to add to the knowledge base')
        }),
        execute: async ({ content }) => createResource({ content })
      })
    }
  })

  return result.toDataStreamResponse()
}
