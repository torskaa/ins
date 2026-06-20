import { inventoryService } from "@/services/inventory/inventory.service"
import type { ToolDefinition } from "./types"

export const inventoryTools: ToolDefinition[] = [
  {
    name: "inventory.getStock",
    description: "Get current stock levels for all items or a specific item by ID",
    inputSchema: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "Optional item ID to filter by" },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        stock: { type: "array", description: "Stock items with quantities" },
      },
    },
    requiredPermissions: ["inventory:read"],
    async execute(args) {
      try {
        const data = args.itemId
          ? await inventoryService.getItem(args.itemId)
          : await inventoryService.getStock()
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "INVENTORY_FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch stock data",
          },
        }
      }
    },
  },
  {
    name: "inventory.getLowStock",
    description: "Get all items that are below minimum stock level (low stock alert)",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        items: { type: "array", description: "Low stock items" },
        count: { type: "number", description: "Number of low stock items" },
      },
    },
    requiredPermissions: ["inventory:read"],
    async execute() {
      try {
        const data = await inventoryService.getLowStockItems()
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "INVENTORY_FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch low stock items",
          },
        }
      }
    },
  },
  {
    name: "inventory.getMovement",
    description: "Get stock movement history, optionally filtered by product",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", description: "Optional product ID to filter movements" },
        limit: { type: "number", description: "Max number of movements to return" },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        movements: { type: "array", description: "Stock movement records" },
      },
    },
    requiredPermissions: ["inventory:read"],
    async execute(args) {
      try {
        const data = await inventoryService.getStockMovement(args.productId, args.limit)
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "INVENTORY_FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch stock movements",
          },
        }
      }
    },
  },
  {
    name: "inventory.forecast",
    description: "Forecast stock levels for a specific item based on historical usage",
    inputSchema: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "Item ID to forecast" },
        weeks: { type: "number", description: "Number of weeks to forecast (default 4)" },
      },
      required: ["itemId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        forecast: { type: "array", description: "Weekly forecast projections" },
      },
    },
    requiredPermissions: ["inventory:read"],
    async execute(args) {
      try {
        const data = await inventoryService.forecastStock(args.itemId, args.weeks)
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "INVENTORY_FORECAST_ERROR",
            message: error instanceof Error ? error.message : "Failed to forecast stock",
          },
        }
      }
    },
  },
  {
    name: "inventory.getSummary",
    description: "Get an overall inventory summary including total items, stock value, and low stock count",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        summary: { type: "object", description: "Inventory summary metrics" },
      },
    },
    requiredPermissions: ["inventory:read"],
    async execute() {
      try {
        const data = await inventoryService.getInventorySummary()
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "INVENTORY_SUMMARY_ERROR",
            message: error instanceof Error ? error.message : "Failed to get inventory summary",
          },
        }
      }
    },
  },
  {
    name: "inventory.getWarehouses",
    description: "Get all warehouses and their capacities",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        warehouses: { type: "array", description: "Warehouse list" },
      },
    },
    requiredPermissions: ["inventory:read"],
    async execute() {
      try {
        const data = await inventoryService.getWarehouses()
        return { success: true, data }
      } catch (error) {
        return {
          success: false,
          error: {
            code: "INVENTORY_FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch warehouses",
          },
        }
      }
    },
  },
]
