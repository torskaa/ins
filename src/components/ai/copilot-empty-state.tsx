"use client"

import {
  AlertTriangleIcon,
  BellIcon,
  CalculatorIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  DollarSignIcon,
  FilePlusIcon,
  FileTextIcon,
  MapIcon,
  PackageIcon,
  PackagePlusIcon,
  PenToolIcon,
  RefreshCwIcon,
  SettingsIcon,
  ShieldIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"
import type { AiMode } from "@/components/ai/ai-mode-selector"

interface CopilotEmptyStateProps {
  onSuggestionClick: (text: string) => void
  userName?: string | null
  mode: AiMode
}

const suggestionsByMode: Record<AiMode, { icon: React.ComponentType<{ className?: string }>; label: string; query: string }[]> = {
  ask: [
    { icon: PackageIcon, label: "Stock levels", query: "Show me current stock levels across all warehouses" },
    { icon: AlertTriangleIcon, label: "Stock alerts", query: "Show me stock alerts and low inventory items" },
    { icon: ShoppingCartIcon, label: "Recent orders", query: "Show me recent orders and their status" },
    { icon: FileTextIcon, label: "Invoices", query: "Show me outstanding invoices that need payment" },
    { icon: TrendingUpIcon, label: "Sales", query: "Give me a sales summary for this month" },
    { icon: UsersIcon, label: "Customers", query: "Show me customer information and history" },
  ],
  analyze: [
    { icon: TrendingUpIcon, label: "Sales trends", query: "Analyze sales trends for the last quarter" },
    { icon: PackageIcon, label: "Inventory", query: "Analyze inventory turnover and slow-moving items" },
    { icon: DollarSignIcon, label: "Revenue", query: "Break down revenue by category this month" },
    { icon: UsersIcon, label: "Customers", query: "Analyze customer segments and buying patterns" },
    { icon: CalculatorIcon, label: "Costs", query: "Analyze costs and profit margins across products" },
    { icon: FileTextIcon, label: "Reports", query: "Generate a monthly inventory report" },
  ],
  create: [
    { icon: FilePlusIcon, label: "Purchase order", query: "Create a new purchase order" },
    { icon: ShoppingCartIcon, label: "Invoice", query: "Draft an invoice for a customer" },
    { icon: PackagePlusIcon, label: "Product", query: "Create a new product entry" },
    { icon: PenToolIcon, label: "Proposal", query: "Help me write a business proposal" },
    { icon: FileTextIcon, label: "Report", query: "Generate an inventory report" },
    { icon: BellIcon, label: "Alert", query: "Create a stock alert rule" },
  ],
  automate: [
    { icon: BellIcon, label: "Reorder alerts", query: "Set up automatic reorder alerts for low stock" },
    { icon: ClockIcon, label: "Reminders", query: "Create automated invoice payment reminders" },
    { icon: CheckCircleIcon, label: "Approvals", query: "Set up approval workflows for purchase orders" },
    { icon: RefreshCwIcon, label: "Inventory sync", query: "Automate inventory sync between warehouses" },
    { icon: TrendingUpIcon, label: "Scheduled reports", query: "Schedule weekly sales reports" },
    { icon: PackageIcon, label: "Stock rules", query: "Create automated stock transfer rules" },
  ],
  manage: [
    { icon: ShieldIcon, label: "Permissions", query: "Show me user roles and permissions" },
    { icon: SettingsIcon, label: "Roles", query: "Help me manage user roles and access" },
    { icon: FileTextIcon, label: "Audit log", query: "Show me recent audit log entries" },
    { icon: CreditCardIcon, label: "Billing", query: "Show me the billing and subscription overview" },
    { icon: MapIcon, label: "Workspace", query: "Help me set up a new workspace" },
    { icon: UsersIcon, label: "Team", query: "Show me team members and their details" },
  ],
}

export function CopilotEmptyState({ onSuggestionClick, mode }: CopilotEmptyStateProps) {
  const suggestions = suggestionsByMode[mode]

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-center px-6">
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl">
        {suggestions.map((s) => {
          const Icon = s.icon
          return (
            <button
              key={s.label}
              onClick={() => onSuggestionClick(s.query)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground bg-muted/10 rounded-full hover:bg-surface hover:text-foreground transition-colors duration-150"
            >
              <Icon className="size-3.5" />
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
