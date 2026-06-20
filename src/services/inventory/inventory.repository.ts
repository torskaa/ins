export type StockItem = {
  id: string
  name: string
  sku: string
  stock: number
  minStock: number
  maxStock: number
  unitPrice: number
  costPrice: number
  warehouseId: string
  warehouseName: string
  status: string
  category: string
}

export type StockMovement = {
  id: string
  productId: string
  productName: string
  type: string
  quantity: number
  reference: string
  createdAt: string
}

export type Warehouse = {
  id: string
  name: string
  location: string
  capacity: number
}

export interface InventoryRepository {
  getAllItems(): Promise<StockItem[]>
  getItemById(id: string): Promise<StockItem | null>
  getItemsByWarehouse(warehouseId: string): Promise<StockItem[]>
  getLowStockItems(threshold?: number): Promise<StockItem[]>
  getMovements(productId?: string, limit?: number): Promise<StockMovement[]>
  getWarehouses(): Promise<Warehouse[]>
}
