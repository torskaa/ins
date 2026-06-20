import type { AiContext } from "../context/types"
import type { ToolPermission, PermissionResult, PermissionCheck } from "./types"

const toolPermissionMap: Record<string, ToolPermission[]> = {
  "inventory.getStock": ["inventory:read"],
  "inventory.getLowStock": ["inventory:read"],
  "inventory.getMovement": ["inventory:read"],
  "inventory.forecast": ["inventory:read"],
  "inventory.getSummary": ["inventory:read"],
  "inventory.getWarehouses": ["inventory:read"],
  "orders.getActive": ["orders:read"],
  "orders.getRecent": ["orders:read"],
  "orders.getByStatus": ["orders:read"],
  "orders.getByCustomer": ["orders:read"],
  "orders.getRecentQuotations": ["orders:read"],
  "orders.getSalesSummary": ["orders:read"],
  "customers.search": ["customers:read"],
  "customers.getTop": ["customers:read"],
  "customers.getDetails": ["customers:read"],
  "finance.getInvoices": ["finance:read"],
  "finance.getOverdueInvoices": ["finance:read"],
  "finance.getInvoicesByCustomer": ["finance:read"],
  "finance.getPayments": ["finance:read"],
  "finance.getOutstanding": ["finance:read"],
  "finance.getSummary": ["finance:read"],
}

export function getPermissionCheck(toolName: string): PermissionCheck {
  const requiredPermissions = toolPermissionMap[toolName] ?? ["ai:execute"]
  return { toolName, requiredPermissions }
}

export function checkToolPermission(
  toolName: string,
  ctx: AiContext,
): PermissionResult {
  const { requiredPermissions } = getPermissionCheck(toolName)

  if (ctx.userRole === "admin") {
    return { allowed: true }
  }

  for (const perm of requiredPermissions) {
    if (!ctx.permissions.includes(perm) && !ctx.permissions.includes("admin")) {
      return {
        allowed: false,
        deniedReason: `Missing required permission: ${perm}`,
      }
    }
  }

  return { allowed: true }
}
