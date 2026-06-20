import type { BaseAgent } from "./base-agent"

const agents = new Map<string, BaseAgent>()

export function registerAgent(agent: BaseAgent): void {
  if (agents.has(agent.id)) {
    throw new Error(`Agent "${agent.id}" is already registered`)
  }
  agents.set(agent.id, agent)
}

export function getAgent(id: string): BaseAgent | undefined {
  return agents.get(id)
}

export function getAllAgents(): BaseAgent[] {
  return Array.from(agents.values())
}

export function getAgentsByTool(toolName: string): BaseAgent[] {
  return Array.from(agents.values()).filter(a =>
    a.availableTools.includes(toolName),
  )
}
