import { randomUUID } from "crypto"
import type { AiContext } from "../context/types"
import type { ToolResponse } from "../tools/types"
import { executeTool, getTool } from "../tools/registry"
import { checkToolRequiresApproval } from "../approval/approval"
import { agentRepository } from "@/services/agents"
import { getUsageTracker } from "../usage"
import type { Planner } from "./planner/types"
import type {
  AgentDefinition,
  AgentRun,
  AgentStep,
  PlannedStep,
} from "./types"

export abstract class BaseAgent implements AgentDefinition {
  abstract id: string
  abstract name: string
  abstract role: string
  abstract goal: string
  abstract instructions: string
  abstract availableTools: string[]

  protected planner: Planner | null = null

  protected abstract buildSummary(steps: AgentStep[], task: string): string

  getPlanner(): Planner | null {
    return this.planner
  }

  setPlanner(planner: Planner): void {
    this.planner = planner
  }

  async run(task: string, ctx: AiContext): Promise<AgentRun> {
    const startedAt = new Date()
    const runId = randomUUID()

    const run: AgentRun = {
      id: runId,
      agentId: this.id,
      agentName: this.name,
      task,
      context: ctx,
      steps: [],
      status: "idle",
      startedAt,
    }

    try {
      run.status = "planning"
      const plannedSteps = this.planner
        ? await this.planner.plan(task, ctx, this.availableTools)
        : []

      if (plannedSteps.length === 0) {
        run.status = "completed"
        run.summary = `No tools were needed for: "${task}"`
        run.completedAt = new Date()
        run.durationMs = run.completedAt.getTime() - startedAt.getTime()
        await agentRepository.createAgentRun(run)
        getUsageTracker().trackAgentRun({
          userId: ctx.userId,
          organizationId: ctx.organizationId,
          agentId: this.id,
          action: "agent_run",
          durationMs: run.durationMs,
          success: true,
          timestamp: new Date(),
        })
        return run
      }

      run.status = "executing"
      for (const planned of plannedSteps) {
        const stepStartedAt = new Date()
        const step: AgentStep = {
          id: randomUUID(),
          toolName: planned.toolName,
          input: planned.input,
          status: "running",
          startedAt: stepStartedAt,
        }

        run.steps.push(step)

        const tool = getTool(planned.toolName)
        if (tool && checkToolRequiresApproval(tool)) {
          step.status = "waiting_approval"
          run.status = "waiting_approval"
          run.approvalRequest = {
            id: randomUUID(),
            toolName: planned.toolName,
            input: planned.input,
            reason: `Tool "${planned.toolName}" requires approval before execution`,
            status: "pending",
            requestedBy: ctx.userId,
            requestedAt: new Date(),
          }
          await agentRepository.createAgentRun(run)
          return run
        }

        try {
          const result: ToolResponse = await executeTool(
            planned.toolName,
            ctx,
            planned.input,
          )

          step.output = result
          step.status = result.success ? "success" : "error"
          if (!result.success) {
            step.errorMessage = result.error?.message
          }
        } catch (error) {
          step.status = "error"
          step.errorMessage =
            error instanceof Error ? error.message : "Unknown error"
          step.output = {
            success: false,
            error: {
              code: "AGENT_EXECUTION_ERROR",
              message: step.errorMessage,
            },
          }
        }

        step.completedAt = new Date()
        step.durationMs =
          step.completedAt.getTime() - stepStartedAt.getTime()
      }

      run.status = "summarizing"
      run.summary = this.buildSummary(run.steps, task)

      run.status = "completed"
    } catch (error) {
      run.status = "failed"
      run.error =
        error instanceof Error ? error.message : "Agent run failed unexpectedly"
    }

    run.completedAt = new Date()
    run.durationMs = run.completedAt.getTime() - startedAt.getTime()

    await agentRepository.createAgentRun(run)

    getUsageTracker().trackAgentRun({
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      agentId: this.id,
      action: "agent_run",
      durationMs: run.durationMs,
      success: run.status === "completed",
      error: run.error,
      timestamp: new Date(),
    })

    return run
  }
}
