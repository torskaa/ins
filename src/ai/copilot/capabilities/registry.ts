import type { CopilotCapability } from "./types"

const capabilities: CopilotCapability[] = [
  {
    name: "inventory_analysis",
    description: "Monitor and analyze inventory stock levels, identify low stock items, and forecast demand",
    agents: ["inventory-agent"],
    tools: ["inventory.getStock", "inventory.getLowStock", "inventory.forecast"],
    requiredPermissions: ["inventory:read"],
  },
  {
    name: "inventory_tracking",
    description: "Track inventory movements, view warehouse capacities, and access inventory summaries",
    agents: ["inventory-agent"],
    tools: ["inventory.getMovement", "inventory.getSummary", "inventory.getWarehouses"],
    requiredPermissions: ["inventory:read"],
  },
  {
    name: "order_management",
    description: "Track and manage sales orders by status, customer, or recency",
    agents: ["sales-agent"],
    tools: ["orders.getActive", "orders.getRecent", "orders.getByStatus", "orders.getByCustomer"],
    requiredPermissions: ["orders:read"],
  },
  {
    name: "customer_insights",
    description: "Search customers, view top customers by spending, and access detailed customer information",
    agents: ["sales-agent"],
    tools: ["customers.search", "customers.getTop", "customers.getDetails"],
    requiredPermissions: ["customers:read"],
  },
  {
    name: "sales_performance",
    description: "Analyze sales performance, view quotations, and review sales summaries",
    agents: ["sales-agent"],
    tools: ["orders.getSalesSummary", "orders.getRecentQuotations", "orders.getRecent"],
    requiredPermissions: ["orders:read"],
  },
  {
    name: "financial_analysis",
    description: "Monitor financial health, track invoices and payments, and review outstanding amounts",
    agents: ["finance-agent"],
    tools: [
      "finance.getSummary",
      "finance.getOutstanding",
      "finance.getInvoices",
      "finance.getOverdueInvoices",
      "finance.getInvoicesByCustomer",
      "finance.getPayments",
    ],
    requiredPermissions: ["finance:read"],
  },
]

export function getCapabilities(): CopilotCapability[] {
  return capabilities
}

export function getCapability(name: string): CopilotCapability | undefined {
  return capabilities.find((c) => c.name === name)
}

export function getCapabilitiesByAgent(agentId: string): CopilotCapability[] {
  return capabilities.filter((c) => c.agents.includes(agentId))
}

export function getCapabilitiesByTool(toolName: string): CopilotCapability[] {
  return capabilities.filter((c) => c.tools.includes(toolName))
}

export function getCapabilitiesByPermission(permission: string): CopilotCapability[] {
  return capabilities.filter((c) => c.requiredPermissions.includes(permission))
}
