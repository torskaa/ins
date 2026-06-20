import type { AiContext } from "../../context/types"

export interface Planner {
  plan(
    task: string,
    context: AiContext,
    availableTools: string[],
  ): Promise<import("../../agents/types").PlannedStep[]>
}
