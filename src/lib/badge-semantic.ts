export type BadgeSemanticCategory = "status" | "priority" | "category" | "type" | "id" | "role" | "method" | "default"

export interface BadgeSemanticStyle {
  variant: "primary" | "secondary" | "success" | "warning" | "info" | "outline" | "destructive"
  appearance?: "default" | "light" | "outline" | "ghost"
}

const badgeSemanticCategoryConfig: Record<BadgeSemanticCategory, BadgeSemanticStyle> = {
  status: { variant: "success", appearance: "light" },
  priority: { variant: "warning", appearance: "light" },
  category: { variant: "info", appearance: "light" },
  type: { variant: "primary", appearance: "light" },
  id: { variant: "secondary", appearance: "light" },
  role: { variant: "primary", appearance: "light" },
  method: { variant: "info", appearance: "light" },
  default: { variant: "secondary", appearance: "light" },
}

const badgeSemanticValueOverrides: Record<string, BadgeSemanticStyle> = {
  /* ── Status ── */
  active: { variant: "success", appearance: "light" },
  inactive: { variant: "secondary", appearance: "light" },
  draft: { variant: "warning", appearance: "light" },
  archived: { variant: "warning", appearance: "light" },
  discontinued: { variant: "destructive", appearance: "light" },
  paused: { variant: "warning", appearance: "light" },
  completed: { variant: "success", appearance: "light" },
  cancelled: { variant: "destructive", appearance: "light" },
  pending: { variant: "warning", appearance: "light" },
  confirmed: { variant: "success", appearance: "light" },
  shipped: { variant: "info", appearance: "light" },
  delivered: { variant: "success", appearance: "light" },
  returned: { variant: "warning", appearance: "light" },
  refunded: { variant: "destructive", appearance: "light" },
  overdue: { variant: "destructive", appearance: "light" },
  paid: { variant: "success", appearance: "light" },
  unpaid: { variant: "warning", appearance: "light" },
  sent: { variant: "info", appearance: "light" },
  approved: { variant: "success", appearance: "light" },
  rejected: { variant: "destructive", appearance: "light" },
  processing: { variant: "warning", appearance: "light" },

  /* ── Priority ── */
  high: { variant: "destructive", appearance: "light" },
  medium: { variant: "warning", appearance: "light" },
  low: { variant: "secondary", appearance: "light" },
  critical: { variant: "destructive", appearance: "light" },

  /* ── Payment methods ── */
  credit_card: { variant: "primary", appearance: "light" },
  bank_transfer: { variant: "info", appearance: "light" },
  cash: { variant: "success", appearance: "light" },
  cheque: { variant: "info", appearance: "light" },
  paypal: { variant: "primary", appearance: "light" },

  /* ── Inventory types ── */
  raw_material: { variant: "warning", appearance: "light" },
  finished_good: { variant: "success", appearance: "light" },
  service: { variant: "info", appearance: "light" },

  /* ── Generic overrides ── */
  preferred: { variant: "success", appearance: "light" },
  default: { variant: "primary", appearance: "light" },
  system: { variant: "info", appearance: "light" },
  custom: { variant: "secondary", appearance: "light" },
}

export function getBadgeSemantic(
  value: string,
  category?: BadgeSemanticCategory,
): BadgeSemanticStyle {
  const normalized = value.toLowerCase().replace(/\s+/g, "_")
  return (
    badgeSemanticValueOverrides[normalized] ??
    badgeSemanticCategoryConfig[category ?? "default"] ??
    badgeSemanticCategoryConfig.default
  )
}
