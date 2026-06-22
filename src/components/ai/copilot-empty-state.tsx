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
  SparklesIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import type { AiMode } from "@/components/ai/ai-mode-selector"

interface CopilotEmptyStateProps {
  onSuggestionClick: (text: string) => void
  userName?: string | null
  mode: AiMode
}

const suggestionsByMode: Record<AiMode, { icon: React.ComponentType<{ className?: string }>; label: string; query: string; color: string }[]> = {
  ask: [
    { icon: PackageIcon, label: "Check stock levels", query: "Show me current stock levels across all warehouses", color: "text-blue-500" },
    { icon: AlertTriangleIcon, label: "Stock alerts", query: "Show me stock alerts and low inventory items", color: "text-amber-500" },
    { icon: ShoppingCartIcon, label: "Recent orders", query: "Show me recent orders and their status", color: "text-green-500" },
    { icon: FileTextIcon, label: "Outstanding invoices", query: "Show me outstanding invoices that need payment", color: "text-orange-500" },
    { icon: TrendingUpIcon, label: "Sales summary", query: "Give me a sales summary for this month", color: "text-purple-500" },
    { icon: SparklesIcon, label: "More", query: "", color: "text-muted-foreground" },
  ],
  analyze: [
    { icon: TrendingUpIcon, label: "Sales trends", query: "Analyze sales trends for the last quarter", color: "text-blue-500" },
    { icon: PackageIcon, label: "Inventory insights", query: "Analyze inventory turnover and slow-moving items", color: "text-orange-500" },
    { icon: DollarSignIcon, label: "Revenue breakdown", query: "Break down revenue by category this month", color: "text-green-500" },
    { icon: UsersIcon, label: "Customer insights", query: "Analyze customer segments and buying patterns", color: "text-purple-500" },
    { icon: CalculatorIcon, label: "Cost analysis", query: "Analyze costs and profit margins across products", color: "text-amber-500" },
    { icon: SparklesIcon, label: "More", query: "", color: "text-muted-foreground" },
  ],
  create: [
    { icon: FilePlusIcon, label: "Create purchase order", query: "Create a new purchase order", color: "text-blue-500" },
    { icon: FileTextIcon, label: "Generate report", query: "Generate a monthly inventory report", color: "text-green-500" },
    { icon: PackagePlusIcon, label: "Create product", query: "Create a new product entry", color: "text-purple-500" },
    { icon: ShoppingCartIcon, label: "Draft invoice", query: "Draft an invoice for a customer", color: "text-orange-500" },
    { icon: PenToolIcon, label: "Write proposal", query: "Help me write a business proposal", color: "text-amber-500" },
    { icon: SparklesIcon, label: "More", query: "", color: "text-muted-foreground" },
  ],
  automate: [
    { icon: BellIcon, label: "Auto reorder alerts", query: "Set up automatic reorder alerts for low stock", color: "text-amber-500" },
    { icon: ClockIcon, label: "Invoice reminders", query: "Create automated invoice payment reminders", color: "text-orange-500" },
    { icon: CheckCircleIcon, label: "Approval workflows", query: "Set up approval workflows for purchase orders", color: "text-green-500" },
    { icon: RefreshCwIcon, label: "Inventory sync", query: "Automate inventory synchronization between warehouses", color: "text-blue-500" },
    { icon: TrendingUpIcon, label: "Scheduled reports", query: "Schedule weekly sales reports to be sent automatically", color: "text-purple-500" },
    { icon: SparklesIcon, label: "More", query: "", color: "text-muted-foreground" },
  ],
  manage: [
    { icon: ShieldIcon, label: "User permissions", query: "Show me user roles and permissions", color: "text-blue-500" },
    { icon: SettingsIcon, label: "Role management", query: "Help me manage user roles and access", color: "text-purple-500" },
    { icon: FileTextIcon, label: "Audit logs", query: "Show me recent audit log entries", color: "text-orange-500" },
    { icon: CreditCardIcon, label: "Billing overview", query: "Show me the billing and subscription overview", color: "text-green-500" },
    { icon: MapIcon, label: "Workspace setup", query: "Help me set up a new workspace", color: "text-amber-500" },
    { icon: SparklesIcon, label: "More", query: "", color: "text-muted-foreground" },
  ],
}

export function CopilotEmptyState({ onSuggestionClick, userName, mode }: CopilotEmptyStateProps) {
  const suggestions = suggestionsByMode[mode]

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-center px-6">
      <svg fill="none" height="48" viewBox="0 0 48 48" width="48" className="mb-8">
        <rect fill="#0A0D12" height="48" rx="12" width="48" />
        <path
          clipRule="evenodd"
          d="M6 24c11.4411 0 18-6.5589 18-18 0 11.4411 6.5589 18 18 18-11.4411 0-18 6.5589-18 18 0-11.4411-6.5589-18-18-18z"
          fill="white"
          fillOpacity="0.8"
          fillRule="evenodd"
        />
      </svg>

      <div className="flex flex-col space-y-2.5 mb-6">
        <div className="flex flex-col">
          <h2 className="text-xl font-medium tracking-tight text-muted-foreground">
            Hi {userName || "there"},
          </h2>
          <h3 className="text-lg font-medium tracking-[-0.006em]">
            Welcome back! How can I help?
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          I'm here to help you tackle your tasks. Choose from the prompts below or just tell me what you need!
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {suggestions.map((s) => {
          const Icon = s.icon
          return (
            <Button
              key={s.label}
              variant="ghost"
              className="h-auto bg-surface text-foreground hover:bg-surface hover:text-foreground px-2.5 py-1.5 rounded-lg text-xs font-medium [&_svg]:size-3.5"
              onClick={() => onSuggestionClick(s.query)}
            >
              <Icon aria-hidden="true" className={s.color} />
              {s.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
