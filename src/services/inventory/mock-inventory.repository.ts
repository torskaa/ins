import type { InventoryRepository, StockItem, StockMovement, Warehouse } from "./inventory.repository"
import { materials, stockMovements, warehouses } from "@/mock/inventory.mock"

export class MockInventoryRepository implements InventoryRepository {
  async getAllItems(): Promise<StockItem[]> {
    return materials.map(m => ({ ...m }))
  }

  async getItemById(id: string): Promise<StockItem | null> {
    return materials.find(m => m.id === id) ?? null
  }

  async getItemsByWarehouse(warehouseId: string): Promise<StockItem[]> {
    return materials.filter(m => m.warehouseId === warehouseId).map(m => ({ ...m }))
  }

  async getLowStockItems(threshold?: number): Promise<StockItem[]> {
    return materials.filter(m => m.stock <= (threshold ?? m.minStock)).map(m => ({ ...m }))
  }

  async getMovements(productId?: string, limit = 50): Promise<StockMovement[]> {
    let movs = stockMovements
    if (productId) movs = movs.filter(sm => sm.productId === productId)
    return movs.slice(0, limit).map(m => ({ ...m }))
  }

  async getWarehouses(): Promise<Warehouse[]> {
    return warehouses.map(w => ({ ...w }))
  }
}
