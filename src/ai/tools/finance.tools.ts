import { financeService } from "@/services/finance/finance.service"
import type { ToolDefinition } from "./types"

export const financeTools: ToolDefinition[] = [
  {
    name: "finance.getInvoices",
    description: "Get all invoices, optionally limited",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max invoices to return" },
      },
    },
    requiredPermissions: ["finance:read"],
    async execute(args) {
      try {
        const data = await financeService.getInvoices(args.limit)
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "FINANCE_FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch invoices",
          },
        }
      }
    },
  },
  {
    name: "finance.getOverdueInvoices",
    description: "Get all overdue invoices that need attention",
    inputSchema: { type: "object", properties: {} },
    requiredPermissions: ["finance:read"],
    async execute() {
      try {
        const data = await financeService.getOverdueInvoices()
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "FINANCE_FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch overdue invoices",
          },
        }
      }
    },
  },
  {
    name: "finance.getInvoicesByCustomer",
    description: "Get invoices for a specific customer",
    inputSchema: {
      type: "object",
      properties: {
        customerId: { type: "string", description: "Customer ID" },
      },
      required: ["customerId"],
    },
    requiredPermissions: ["finance:read"],
    async execute(args) {
      try {
        const data = await financeService.getInvoicesByCustomer(args.customerId)
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "FINANCE_FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch invoices by customer",
          },
        }
      }
    },
  },
  {
    name: "finance.getPayments",
    description: "Get payment history, optionally by invoice",
    inputSchema: {
      type: "object",
      properties: {
        invoiceId: { type: "string", description: "Optional invoice ID to filter payments" },
        limit: { type: "number", description: "Max payments to return" },
      },
    },
    requiredPermissions: ["finance:read"],
    async execute(args) {
      try {
        const data = args.invoiceId
          ? await financeService.getPaymentsByInvoice(args.invoiceId)
          : await financeService.getPayments(args.limit)
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "FINANCE_FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch payments",
          },
        }
      }
    },
  },
  {
    name: "finance.getOutstanding",
    description: "Get total outstanding (unpaid) amount across all invoices",
    inputSchema: { type: "object", properties: {} },
    requiredPermissions: ["finance:read"],
    async execute() {
      try {
        const outstanding = await financeService.getOutstandingAmount()
        return { success: true, data: { outstanding } }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "FINANCE_SUMMARY_ERROR",
            message: error instanceof Error ? error.message : "Failed to calculate outstanding amount",
          },
        }
      }
    },
  },
  {
    name: "finance.getSummary",
    description: "Get a financial summary including total invoiced, collected, outstanding, and overdue count",
    inputSchema: { type: "object", properties: {} },
    requiredPermissions: ["finance:read"],
    async execute() {
      try {
        const data = await financeService.getFinanceSummary()
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "FINANCE_SUMMARY_ERROR",
            message: error instanceof Error ? error.message : "Failed to get finance summary",
          },
        }
      }
    },
  },
]
