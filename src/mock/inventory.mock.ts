export type MockMaterial = {
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
  status: "active" | "inactive"
  category: string
}

export type MockStockMovement = {
  id: string
  productId: string
  productName: string
  type: "received" | "sold" | "transferred" | "adjusted" | "returned"
  quantity: number
  reference: string
  createdAt: string
}

export type MockWarehouse = {
  id: string
  name: string
  location: string
  capacity: number
}

export const warehouses: MockWarehouse[] = [
  { id: "wh-1", name: "Main Warehouse", location: "Bangkok", capacity: 10000 },
  { id: "wh-2", name: "Secondary Storage", location: "Chonburi", capacity: 5000 },
  { id: "wh-3", name: "Overflow Facility", location: "Samut Prakan", capacity: 3000 },
]

export const materials: MockMaterial[] = [
  { id: "mat-1", name: "Steel Plate A36", sku: "STL-001", stock: 500, minStock: 100, maxStock: 1000, unitPrice: 45, costPrice: 32, warehouseId: "wh-1", warehouseName: "Main Warehouse", status: "active", category: "Raw Material" },
  { id: "mat-2", name: "Aluminum Extrusion 6061", sku: "ALM-002", stock: 320, minStock: 80, maxStock: 600, unitPrice: 78, costPrice: 55, warehouseId: "wh-1", warehouseName: "Main Warehouse", status: "active", category: "Raw Material" },
  { id: "mat-3", name: "Copper Wire 12 AWG", sku: "CPR-003", stock: 1200, minStock: 200, maxStock: 2000, unitPrice: 12, costPrice: 8, warehouseId: "wh-1", warehouseName: "Main Warehouse", status: "active", category: "Raw Material" },
  { id: "mat-4", name: "Polypropylene Pellets", sku: "PLY-004", stock: 2500, minStock: 500, maxStock: 5000, unitPrice: 3.5, costPrice: 2.2, warehouseId: "wh-2", warehouseName: "Secondary Storage", status: "active", category: "Raw Material" },
  { id: "mat-5", name: "Rubber Gasket Set", sku: "RBR-005", stock: 45, minStock: 100, maxStock: 300, unitPrice: 15, costPrice: 9, warehouseId: "wh-1", warehouseName: "Main Warehouse", status: "active", category: "Component" },
  { id: "mat-6", name: "Stainless Steel Fasteners M8", sku: "FST-006", stock: 6000, minStock: 1000, maxStock: 10000, unitPrice: 0.45, costPrice: 0.3, warehouseId: "wh-3", warehouseName: "Overflow Facility", status: "active", category: "Hardware" },
  { id: "mat-7", name: "Industrial Lubricant 5L", sku: "LUB-007", stock: 22, minStock: 50, maxStock: 200, unitPrice: 95, costPrice: 68, warehouseId: "wh-2", warehouseName: "Secondary Storage", status: "active", category: "Consumable" },
  { id: "mat-8", name: "Plywood Sheet 18mm", sku: "PLY-008", stock: 180, minStock: 60, maxStock: 300, unitPrice: 28, costPrice: 19, warehouseId: "wh-1", warehouseName: "Main Warehouse", status: "active", category: "Raw Material" },
  { id: "mat-9", name: "Hydraulic Pump Unit", sku: "HYP-009", stock: 8, minStock: 10, maxStock: 30, unitPrice: 450, costPrice: 320, warehouseId: "wh-3", warehouseName: "Overflow Facility", status: "active", category: "Component" },
  { id: "mat-10", name: "Electronic Sensor Module", sku: "SNS-010", stock: 340, minStock: 100, maxStock: 500, unitPrice: 22, costPrice: 14, warehouseId: "wh-2", warehouseName: "Secondary Storage", status: "active", category: "Electronics" },
]

export const stockMovements: MockStockMovement[] = [
  { id: "sm-1", productId: "mat-1", productName: "Steel Plate A36", type: "received", quantity: 200, reference: "PO-2024-001", createdAt: "2024-11-01T08:30:00Z" },
  { id: "sm-2", productId: "mat-3", productName: "Copper Wire 12 AWG", type: "sold", quantity: -150, reference: "SO-2024-012", createdAt: "2024-11-02T10:15:00Z" },
  { id: "sm-3", productId: "mat-5", productName: "Rubber Gasket Set", type: "transferred", quantity: -30, reference: "TRF-2024-001", createdAt: "2024-11-03T14:00:00Z" },
  { id: "sm-4", productId: "mat-7", productName: "Industrial Lubricant 5L", type: "sold", quantity: -10, reference: "SO-2024-015", createdAt: "2024-11-04T09:45:00Z" },
  { id: "sm-5", productId: "mat-2", productName: "Aluminum Extrusion 6061", type: "received", quantity: 150, reference: "PO-2024-002", createdAt: "2024-11-05T11:20:00Z" },
  { id: "sm-6", productId: "mat-9", productName: "Hydraulic Pump Unit", type: "sold", quantity: -3, reference: "SO-2024-018", createdAt: "2024-11-06T16:00:00Z" },
  { id: "sm-7", productId: "mat-4", productName: "Polypropylene Pellets", type: "received", quantity: 800, reference: "PO-2024-003", createdAt: "2024-11-07T07:30:00Z" },
  { id: "sm-8", productId: "mat-6", productName: "Stainless Steel Fasteners M8", type: "adjusted", quantity: -200, reference: "ADJ-2024-001", createdAt: "2024-11-08T13:00:00Z" },
  { id: "sm-9", productId: "mat-10", productName: "Electronic Sensor Module", type: "returned", quantity: 15, reference: "RET-2024-001", createdAt: "2024-11-09T10:30:00Z" },
  { id: "sm-10", productId: "mat-8", productName: "Plywood Sheet 18mm", type: "received", quantity: 60, reference: "PO-2024-004", createdAt: "2024-11-10T09:00:00Z" },
]
