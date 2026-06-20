export type Customer = {
  id: string
  name: string
  company: string
  email: string
  phone: string
  totalOrders: number
  totalSpent: number
  status: string
}

export type Order = {
  id: string
  number: string
  customerId: string
  customerName: string
  status: string
  type: string
  total: number
  items: number
  createdAt: string
  estimatedDate: string
}

export type Quotation = {
  id: string
  number: string
  customerId: string
  customerName: string
  status: string
  total: number
  items: number
  validUntil: string
  createdAt: string
}

export interface OrdersRepository {
  getAllCustomers(): Promise<Customer[]>
  getCustomerById(id: string): Promise<Customer | null>
  getOrdersByCustomer(customerId: string): Promise<Order[]>
  getOrdersByStatus(status: string): Promise<Order[]>
  getAllOrders(limit?: number): Promise<Order[]>
  getAllQuotations(limit?: number): Promise<Quotation[]>
  getQuotationsByCustomer(customerId: string): Promise<Quotation[]>
}
