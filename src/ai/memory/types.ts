export interface AgentMemory {
  remember(key: string, value: unknown): Promise<void>
  recall<T = unknown>(key: string): Promise<T | undefined>
  clear(): Promise<void>
}
