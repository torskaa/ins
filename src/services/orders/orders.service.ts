import type { OrdersRepository, Customer, Order, Quotation } from "./orders.repository"
import { MockOrdersRepository } from "./mock-orders.repository"

let repository: OrdersRepository | null = null

function getRepo(): OrdersRepository {
  if (!repository) repository = new MockOrdersRepository()
  return repository
}

export function setOrdersRepository(repo: OrdersRepository) {
  repository = repo
}

export const ordersService = {
  async getAllCustomers(): Promise<Customer[]> {
    return getRepo().getAllCustomers()
  },

  async getCustomer(id: string): Promise<Customer | null> {
    return getRepo().getCustomerById(id)
  },

  async getActiveOrders(): Promise<Order[]> {
    const active = ["pending", "confirmed", "processing", "shipped"]
    const all = await getRepo().getAllOrders()
    return all.filter(o => active.includes(o.status))
  },

  async getRecentOrders(limit = 5): Promise<Order[]> {
    return getRepo().getAllOrders(limit)
  },

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return getRepo().getOrdersByStatus(status)
  },

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return getRepo().getOrdersByCustomer(customerId)
  },

  async getRecentQuotations(limit = 5): Promise<Quotation[]> {
    return getRepo().getAllQuotations(limit)
  },

  async getSalesSummary(): Promise<{ totalOrders: number; totalRevenue: number; pendingOrders: number; activeCustomers: number }> {
    const customers = await getRepo().getAllCustomers()
    const orders = await getRepo().getAllOrders()
    return {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((s, o) => s + o.total, 0),
      pendingOrders: orders.filter(o => o.status === "pending").length,
      activeCustomers: customers.filter(c => c.status === "active").length,
    }
  },
}
