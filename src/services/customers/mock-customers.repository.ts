import type { Customer } from "@/services/orders/orders.repository"
import type { CustomersRepository } from "./customers.repository"
import { customers } from "@/mock/orders.mock"

export class MockCustomersRepository implements CustomersRepository {
  async getAll(): Promise<Customer[]> {
    return customers.map(c => ({ ...c }))
  }

  async getById(id: string): Promise<Customer | null> {
    return customers.find(c => c.id === id) ?? null
  }

  async search(query: string): Promise<Customer[]> {
    const q = query.toLowerCase()
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    ).map(c => ({ ...c }))
  }

  async getTopBySpending(limit = 5): Promise<Customer[]> {
    return [...customers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit)
      .map(c => ({ ...c }))
  }

  async getTopByOrders(limit = 5): Promise<Customer[]> {
    return [...customers]
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, limit)
      .map(c => ({ ...c }))
  }
}
