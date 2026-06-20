export type MockCustomer = {
  id: string
  name: string
  company: string
  email: string
  phone: string
  totalOrders: number
  totalSpent: number
  status: "active" | "inactive"
}

export type MockOrder = {
  id: string
  number: string
  customerId: string
  customerName: string
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  type: "sales" | "purchase"
  total: number
  items: number
  createdAt: string
  estimatedDate: string
}

export type MockQuotation = {
  id: string
  number: string
  customerId: string
  customerName: string
  status: "draft" | "sent" | "confirmed" | "expired" | "lost"
  total: number
  items: number
  validUntil: string
  createdAt: string
}

export const customers: MockCustomer[] = [
  { id: "c-1", name: "Somchai Manufacturing", company: "Somchai Manufacturing Co., Ltd.", email: "somchai@smc.co.th", phone: "+66 2-555-0101", totalOrders: 24, totalSpent: 450000, status: "active" },
  { id: "c-2", name: "Prasert Industrial Supply", company: "Prasert Industrial Supply Ltd.", email: "prasert@pis.co.th", phone: "+66 2-555-0102", totalOrders: 18, totalSpent: 320000, status: "active" },
  { id: "c-3", name: "Narong Engineering", company: "Narong Engineering Partnership", email: "narong@ne.co.th", phone: "+66 2-555-0103", totalOrders: 7, totalSpent: 125000, status: "active" },
  { id: "c-4", name: "Siriwat Construction", company: "Siriwat Construction Co., Ltd.", email: "siriwat@sc.co.th", phone: "+66 2-555-0104", totalOrders: 31, totalSpent: 890000, status: "active" },
  { id: "c-5", name: "Thongchai Auto Parts", company: "Thongchai Auto Parts Ltd.", email: "thongchai@tap.co.th", phone: "+66 2-555-0105", totalOrders: 3, totalSpent: 45000, status: "inactive" },
]

export const orders: MockOrder[] = [
  { id: "ord-1", number: "SO-2024-012", customerId: "c-1", customerName: "Somchai Manufacturing", status: "delivered", type: "sales", total: 18500, items: 3, createdAt: "2024-10-15T09:00:00Z", estimatedDate: "2024-10-30" },
  { id: "ord-2", number: "SO-2024-015", customerId: "c-2", customerName: "Prasert Industrial Supply", status: "shipped", type: "sales", total: 32000, items: 5, createdAt: "2024-10-20T10:30:00Z", estimatedDate: "2024-11-05" },
  { id: "ord-3", number: "SO-2024-018", customerId: "c-3", customerName: "Narong Engineering", status: "processing", type: "sales", total: 12750, items: 2, createdAt: "2024-10-28T14:00:00Z", estimatedDate: "2024-11-15" },
  { id: "ord-4", number: "PO-2024-001", customerId: "c-4", customerName: "Siriwat Construction", status: "confirmed", type: "purchase", total: 56000, items: 8, createdAt: "2024-11-01T08:00:00Z", estimatedDate: "2024-11-20" },
  { id: "ord-5", number: "SO-2024-020", customerId: "c-1", customerName: "Somchai Manufacturing", status: "pending", type: "sales", total: 8900, items: 1, createdAt: "2024-11-05T11:00:00Z", estimatedDate: "2024-11-25" },
]

export const quotations: MockQuotation[] = [
  { id: "q-1", number: "Q-2024-001", customerId: "c-1", customerName: "Somchai Manufacturing", status: "confirmed", total: 45000, items: 4, validUntil: "2024-12-15", createdAt: "2024-10-20" },
  { id: "q-2", number: "Q-2024-002", customerId: "c-4", customerName: "Siriwat Construction", status: "sent", total: 128000, items: 6, validUntil: "2024-12-01", createdAt: "2024-10-25" },
  { id: "q-3", number: "Q-2024-003", customerId: "c-2", customerName: "Prasert Industrial Supply", status: "draft", total: 23000, items: 2, validUntil: "2024-12-20", createdAt: "2024-11-01" },
  { id: "q-4", number: "Q-2024-004", customerId: "c-3", customerName: "Narong Engineering", status: "expired", total: 6700, items: 1, validUntil: "2024-11-10", createdAt: "2024-10-10" },
]
