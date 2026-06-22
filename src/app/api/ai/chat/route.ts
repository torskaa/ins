import { apiHandler, respond, requireAuth } from "@/lib/middleware"
import { getAllAgents } from "@/ai/agents/registry"
import type { AiContext } from "@/ai/context/types"
import "@/ai/agents/setup"

export const POST = apiHandler(async (req: Request) => {
  await requireAuth()

  const body = await req.json()
  const { text, ctx } = body as { text: string; ctx: AiContext }
  if (!text?.trim()) {
    return Response.json({ success: false, error: "Message is required" }, { status: 400 })
  }

  const agents = getAllAgents()
  if (agents.length === 0) {
    return respond({ results: [] })
  }

  const results: Array<{
    agentId: string
    agentName: string
    summary?: string
    error?: string
    toolCalls: Array<{
      toolName: string
      input: Record<string, unknown>
      output?: string
      status: string
    }>
  }> = []

  for (const agent of agents) {
    const run = await agent.run(text, ctx)

    const toolCalls = run.steps.map((step) => ({
      toolName: step.toolName,
      input: step.input as Record<string, unknown>,
      output: step.output ? JSON.stringify(step.output, null, 2) : undefined,
      status: step.status,
    }))

    results.push({
      agentId: agent.id,
      agentName: agent.name,
      summary: run.summary,
      error: run.error,
      toolCalls,
    })

    if (run.status === "completed" && run.summary) break
  }

  return respond({ results })
})
