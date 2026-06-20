import type { AgentMemory } from "./types"

export class InMemoryAgentMemory implements AgentMemory {
  private store = new Map<string, unknown>()

  async remember(key: string, value: unknown): Promise<void> {
    this.store.set(key, value)
  }

  async recall<T = unknown>(key: string): Promise<T | undefined> {
    return this.store.get(key) as T | undefined
  }

  async clear(): Promise<void> {
    this.store.clear()
  }
}
