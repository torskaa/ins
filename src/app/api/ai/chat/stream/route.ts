import { apiHandler, requireAuth } from "@/lib/middleware"
import type { AiContext } from "@/ai/context/types"
import { getAllAgents } from "@/ai/agents/registry"
import { executeTool, getTool } from "@/ai/tools/registry"
import { checkToolRequiresApproval } from "@/ai/approval/approval"
import { getUsageTracker } from "@/ai/usage"
import { CopilotEventEmitter, serializeEvent, createEvent, validateEvent } from "@/ai/copilot/events"
import "@/ai/agents/setup"

export const POST = apiHandler(async (req: Request) => {
  await requireAuth()

  const body = await req.json()
  const { text, ctx } = body as { text: string; ctx: AiContext }
  if (!text?.trim()) {
    const errEvent = createEvent("failed", { error: "Message is required" })
    if (process.env.NODE_ENV === "development") {
      const v = validateEvent(errEvent as unknown as Record<string, unknown>)
      if (!v.valid) console.warn("[stream] Invalid failed event:", v.errors)
    }
    return new Response(
      serializeEvent(errEvent),
      { status: 400, headers: { "Content-Type": "text/event-stream" } },
    )
  }

  const agents = getAllAgents()
  if (agents.length === 0) {
    const errEvent = createEvent("failed", { error: "No agents available" })
    if (process.env.NODE_ENV === "development") {
      const v = validateEvent(errEvent as unknown as Record<string, unknown>)
      if (!v.valid) console.warn("[stream] Invalid failed event:", v.errors)
    }
    return new Response(
      serializeEvent(errEvent),
      { status: 400, headers: { "Content-Type": "text/event-stream" } },
    )
  }

  const stream = new ReadableStream({
    async start(controller) {
      const emitter = new CopilotEventEmitter(controller)

      try {
        const startedAt = new Date()

        for (const agent of agents) {
          emitter.emit("thinking", {
            agentId: agent.id,
            message: `${agent.name} is analyzing your request...`,
          })

          const planner = agent.getPlanner()
          const plannedSteps = planner
            ? await planner.plan(text, ctx, agent.availableTools)
            : []

          if (plannedSteps.length === 0) {
            emitter.emit("completed", {
              agentId: agent.id,
              summary: `No tools were needed for: "${text}"`,
              toolCalls: [],
            })
            break
          }

          emitter.emit("planning", {
            agentId: agent.id,
            message: `${agent.name} created ${plannedSteps.length} step(s)`,
            stepCount: plannedSteps.length,
          })

          const toolCalls: Array<{
            toolName: string
            status: string
          }> = []

          let paused = false
          for (const planned of plannedSteps) {
            emitter.emit("tool_start", {
              agentId: agent.id,
              toolName: planned.toolName,
              input: planned.input,
            })

            const tool = getTool(planned.toolName)
            if (tool && checkToolRequiresApproval(tool)) {
              emitter.emit("approval_required", {
                agentId: agent.id,
                toolName: planned.toolName,
                input: planned.input,
                reason: `Tool "${planned.toolName}" requires approval before execution`,
              })
              toolCalls.push({ toolName: planned.toolName, status: "waiting_approval" })
              paused = true
              break
            }

            try {
              const result = await executeTool(planned.toolName, ctx, planned.input)

              emitter.emit("tool_result", {
                agentId: agent.id,
                toolName: planned.toolName,
                status: result.success ? "success" : "error",
                output: result.success ? result.data : undefined,
                error: result.success ? undefined : result.error?.message,
              })

              toolCalls.push({
                toolName: planned.toolName,
                status: result.success ? "success" : "error",
              })
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : "Unknown error"
              emitter.emit("tool_result", {
                agentId: agent.id,
                toolName: planned.toolName,
                status: "error",
                error: errorMsg,
              })
              toolCalls.push({ toolName: planned.toolName, status: "error" })
            }
          }

          if (paused) {
            emitter.close()
            return
          }

          emitter.emit("completed", {
            agentId: agent.id,
            toolCalls,
          })

          getUsageTracker().trackAgentRun({
            userId: ctx.userId,
            organizationId: ctx.organizationId,
            agentId: agent.id,
            action: "agent_run",
            durationMs: Date.now() - startedAt.getTime(),
            success: true,
            timestamp: new Date(),
          })
          break
        }
      } catch (error) {
        emitter.emit("failed", {
          error: error instanceof Error ? error.message : "Agent execution failed",
        })
      } finally {
        emitter.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
})
