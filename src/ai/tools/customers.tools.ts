import { customersService } from "@/services/customers/customers.service"
import type { ToolDefinition } from "./types"

export const customersTools: ToolDefinition[] = [
  {
    name: "customers.search",
    description: "Search customers by name, company, or email",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    },
    requiredPermissions: ["customers:read"],
    async execute(args) {
      try {
        const data = await customersService.search(args.query)
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "CUSTOMERS_SEARCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to search customers",
          },
        }
      }
    },
  },
  {
    name: "customers.getTop",
    description: "Get top customers by spending or order count",
    inputSchema: {
      type: "object",
      properties: {
        by: { type: "string", enum: ["spending", "orders"], description: "Sort criteria (default spending)" },
        limit: { type: "number", description: "Number of customers to return (default 5)" },
      },
    },
    requiredPermissions: ["customers:read"],
    async execute(args) {
      try {
        const data = await customersService.getTopCustomers(args.by ?? "spending", args.limit ?? 5)
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "CUSTOMERS_FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch top customers",
          },
        }
      }
    },
  },
  {
    name: "customers.getDetails",
    description: "Get detailed information about a specific customer",
    inputSchema: {
      type: "object",
      properties: {
        customerId: { type: "string", description: "Customer ID" },
      },
      required: ["customerId"],
    },
    requiredPermissions: ["customers:read"],
    async execute(args) {
      try {
        const data = await customersService.getCustomer(args.customerId)
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "CUSTOMERS_FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch customer details",
          },
        }
      }
    },
  },
]
