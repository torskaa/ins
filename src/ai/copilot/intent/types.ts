export type CopilotMode = "ask" | "analyze" | "create" | "automate" | "manage"

export type IntentType =
  | "query"         // Ask questions about existing data
  | "analysis"      // Multi-step analysis
  | "creation"      // Create ERP entities
  | "update"        // Update existing entities
  | "workflow"      // Create/modify workflows
  | "manage"        // Manage workspace objects
  | "unknown"

export interface Intent {
  type: IntentType
  mode: CopilotMode
  confidence: number
  entities: string[]
  primaryEntity?: string
  action?: string
  rawInput: string
}

export interface IntentMatch {
  keywords: string[]
  type: IntentType
  mode: CopilotMode
  priority: number
}
