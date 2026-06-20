import type { InventoryRepository, StockItem, StockMovement, Warehouse } from "./inventory.repository"
import { MockInventoryRepository } from "./mock-inventory.repository"

let repository: InventoryRepository | null = null

function getRepo(): InventoryRepository {
  if (!repository) repository = new MockInventoryRepository()
  return repository
}

export function setInventoryRepository(repo: InventoryRepository) {
  repository = repo
}

export const inventoryService = {
  async getStock(): Promise<StockItem[]> {
    return getRepo().getAllItems()
  },

  async getItem(id: string): Promise<StockItem | null> {
    return getRepo().getItemById(id)
  },

  async getLowStockItems(threshold?: number): Promise<StockItem[]> {
    return getRepo().getLowStockItems(threshold)
  },

  async getStockMovement(productId?: string, limit?: number): Promise<StockMovement[]> {
    return getRepo().getMovements(productId, limit)
  },

  async getWarehouses(): Promise<Warehouse[]> {
    return getRepo().getWarehouses()
  },

  async forecastStock(itemId: string, weeks = 4): Promise<{ item: StockItem | null; weeklyUsage: number; projectedStock: number; willRunOut: boolean; weeksUntilEmpty: number | null }> {
    const item = await getRepo().getItemById(itemId)
    if (!item) return { item: null, weeklyUsage: 0, projectedStock: 0, willRunOut: false, weeksUntilEmpty: null }

    const movements = await getRepo().getMovements(itemId, 20)
    const outboundMovements = movements.filter(m => m.quantity < 0)
    const totalOutbound = outboundMovements.reduce((sum, m) => sum + Math.abs(m.quantity), 0)
    const periodWeeks = 8
    const weeklyUsage = totalOutbound / periodWeeks
    const projectedStock = item.stock - weeklyUsage * weeks
    const willRunOut = projectedStock <= 0
    const weeksUntilEmpty = weeklyUsage > 0 ? Math.floor(item.stock / weeklyUsage) : null

    return { item, weeklyUsage, projectedStock, willRunOut, weeksUntilEmpty }
  },

  async getInventorySummary(): Promise<{ totalItems: number; totalStock: number; lowStockCount: number; warehouseCount: number; totalValue: number }> {
    const items = await getRepo().getAllItems()
    const warehouses = await getRepo().getWarehouses()
    const lowStock = await getRepo().getLowStockItems()
    return {
      totalItems: items.length,
      totalStock: items.reduce((s, i) => s + i.stock, 0),
      lowStockCount: lowStock.length,
      warehouseCount: warehouses.length,
      totalValue: items.reduce((s, i) => s + i.stock * i.costPrice, 0),
    }
  },
}
