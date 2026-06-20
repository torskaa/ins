import { ordersService } from "@/services/orders/orders.service"
import type { ToolDefinition } from "./types"

export const ordersTools: ToolDefinition[] = [
  {
    name: "orders.getActive",
    description: "Get all active orders (pending, confirmed, processing, shipped)",
    inputSchema: { type: "object", properties: {} },
    requiredPermissions: ["orders:read"],
    async execute() {
      try {
        const data = await ordersService.getActiveOrders()
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "ORDERS_FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch active orders",
          },
        }
      }
    },
  },
  {
    name: "orders.getRecent",
    description: "Get the most recent orders",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of orders to return (default 5)" },
      },
    },
    requiredPermissions: ["orders:read"],
    async execute(args) {
      try {
        const data = await ordersService.getRecentOrders(args.limit ?? 5)
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "ORDERS_FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch recent orders",
          },
        }
      }
    },
  },
  {
    name: "orders.getByStatus",
    description: "Get orders filtered by status (pending, confirmed, processing, shipped, delivered, cancelled)",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Status to filter by" },
      },
      required: ["status"],
    },
    requiredPermissions: ["orders:read"],
    async execute(args) {
      try {
        const data = await ordersService.getOrdersByStatus(args.status)
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "ORDERS_FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch orders by status",
          },
        }
      }
    },
  },
  {
    name: "orders.getByCustomer",
    description: "Get all orders for a specific customer",
    inputSchema: {
      type: "object",
      properties: {
        customerId: { type: "string", description: "Customer ID" },
      },
      required: ["customerId"],
    },
    requiredPermissions: ["orders:read"],
    async execute(args) {
      try {
        const data = await ordersService.getOrdersByCustomer(args.customerId)
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "ORDERS_FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch orders by customer",
          },
        }
      }
    },
  },
  {
    name: "orders.getRecentQuotations",
    description: "Get the most recent quotations",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of quotations to return (default 5)" },
      },
    },
    requiredPermissions: ["orders:read"],
    async execute(args) {
      try {
        const data = await ordersService.getRecentQuotations(args.limit ?? 5)
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "ORDERS_FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch recent quotations",
          },
        }
      }
    },
  },
  {
    name: "orders.getSalesSummary",
    description: "Get a summary of sales performance (total orders, revenue, pending orders, active customers)",
    inputSchema: { type: "object", properties: {} },
    requiredPermissions: ["orders:read"],
    async execute() {
      try {
        const data = await ordersService.getSalesSummary()
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "ORDERS_SUMMARY_ERROR",
            message: error instanceof Error ? error.message : "Failed to get sales summary",
          },
        }
      }
    },
  },
]
