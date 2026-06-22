export interface Suggestion {
  id: string
  label: string
  description?: string
  query: string
  category: "quick" | "entity" | "action"
}

const quickSuggestions: Suggestion[] = [
  { id: "q1", label: "Show low stock items", query: "Show low stock items", category: "quick" },
  { id: "q2", label: "What's my revenue?", query: "What's my revenue this month?", category: "quick" },
  { id: "q3", label: "Recent orders", query: "Show me recent orders", category: "quick" },
  { id: "q4", label: "Top customers", query: "Who are my top customers?", category: "quick" },
]

const entitySuggestions: Suggestion[] = [
  { id: "e1", label: "Create folder", description: "New workspace folder", query: "Create a folder named", category: "entity" },
  { id: "e2", label: "Create file", description: "New file in folder", query: "Create a file named", category: "entity" },
  { id: "e3", label: "Create tag", description: "New tag for entities", query: "Create a tag named", category: "entity" },
]

const actionSuggestions: Suggestion[] = [
  { id: "a1", label: "Set up workflow", description: "Automate a process", query: "Create a workflow for", category: "action" },
  { id: "a2", label: "Analyze sales", description: "Sales performance report", query: "Analyze sales performance", category: "action" },
  { id: "a3", label: "Inventory forecast", description: "Demand prediction", query: "Forecast inventory demand", category: "action" },
]

export function getSuggestions(category?: "quick" | "entity" | "action"): Suggestion[] {
  if (category === "quick") return quickSuggestions
  if (category === "entity") return entitySuggestions
  if (category === "action") return actionSuggestions
  return [...quickSuggestions, ...entitySuggestions, ...actionSuggestions]
}
