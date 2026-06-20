export type ToolPermission =
  | "inventory:read"
  | "inventory:write"
  | "orders:read"
  | "orders:write"
  | "customers:read"
  | "customers:write"
  | "finance:read"
  | "finance:write"
  | "ai:execute"
  | "admin"

export interface PermissionCheck {
  toolName: string
  requiredPermissions: ToolPermission[]
}

export interface PermissionResult {
  allowed: boolean
  deniedReason?: string
}
