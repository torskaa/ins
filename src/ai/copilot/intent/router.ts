import type { Intent, IntentMatch, IntentType, CopilotMode } from "./types"

const intentPatterns: IntentMatch[] = [
  { keywords: ["show", "list", "get", "find", "what", "how many", "search", "view"], type: "query", mode: "ask", priority: 1 },
  { keywords: ["analyze", "analyze", "trend", "compare", "summary", "report", "insight"], type: "analysis", mode: "analyze", priority: 2 },
  { keywords: ["create", "new", "add", "make", "generate", "build", "set up"], type: "creation", mode: "create", priority: 3 },
  { keywords: ["update", "change", "modify", "edit", "set", "assign"], type: "update", mode: "create", priority: 3 },
  { keywords: ["workflow", "automate", "automation", "trigger", "when"], type: "workflow", mode: "automate", priority: 4 },
  { keywords: ["manage", "organize", "folder", "file", "tag", "structure"], type: "manage", mode: "manage", priority: 5 },
]

function detectEntities(input: string): string[] {
  const entityPatterns = [
    { keyword: "inventory|stock|warehouse|product|item|material", entity: "inventory" },
    { keyword: "order|sale|purchase|quotation", entity: "order" },
    { keyword: "customer|client|lead|contact", entity: "customer" },
    { keyword: "invoice|payment|revenue|finance|cost|budget", entity: "finance" },
    { keyword: "folder|directory", entity: "folder" },
    { keyword: "file|document|note", entity: "file" },
    { keyword: "tag|label|category", entity: "tag" },
    { keyword: "workflow|automation|rule", entity: "workflow" },
    { keyword: "view|filter|dashboard", entity: "view" },
    { keyword: "supplier|vendor|distributor", entity: "supplier" },
    { keyword: "report|chart|graph|kpi", entity: "report" },
  ]
  const lower = input.toLowerCase()
  return entityPatterns
    .filter(({ keyword }) => new RegExp(keyword, "i").test(lower))
    .map(({ entity }) => entity)
}

export function routeIntent(input: string, mode?: CopilotMode): Intent {
  const lower = input.toLowerCase()
  const entities = detectEntities(input)

  let bestMatch: IntentMatch | null = null

  if (mode && mode !== "ask") {
    const modeMap: Record<string, { type: IntentType }> = {
      analyze: { type: "analysis" },
      create: { type: "creation" },
      automate: { type: "workflow" },
      manage: { type: "manage" },
    }
    const mapped = modeMap[mode]
    if (mapped) {
      bestMatch = { keywords: [], type: mapped.type, mode, priority: 0 }
    }
  }

  if (!bestMatch) {
    for (const pattern of intentPatterns) {
      const matches = pattern.keywords.some((kw) => lower.includes(kw))
      if (matches) {
        if (!bestMatch || pattern.priority < bestMatch.priority) {
          bestMatch = pattern
        }
      }
    }
  }

  if (!bestMatch) {
    return { type: "unknown", mode: mode || "ask", confidence: 0.1, entities, rawInput: input }
  }

  const confidence = bestMatch.priority <= 2 ? 0.9 : 0.8
  return {
    type: bestMatch.type,
    mode: bestMatch.mode,
    confidence,
    entities,
    primaryEntity: entities[0],
    rawInput: input,
  }
}
