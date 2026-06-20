import type { Customer } from "@/services/orders/orders.repository"
import type { CustomersRepository } from "./customers.repository"
import { MockCustomersRepository } from "./mock-customers.repository"

let repository: CustomersRepository | null = null

function getRepo(): CustomersRepository {
  if (!repository) repository = new MockCustomersRepository()
  return repository
}

export function setCustomersRepository(repo: CustomersRepository) {
  repository = repo
}

export const customersService = {
  async search(query: string): Promise<Customer[]> {
    if (!query.trim()) return []
    return getRepo().search(query)
  },

  async getTopCustomers(by: "spending" | "orders" = "spending", limit = 5): Promise<Customer[]> {
    if (by === "spending") return getRepo().getTopBySpending(limit)
    return getRepo().getTopByOrders(limit)
  },

  async getCustomer(id: string): Promise<Customer | null> {
    return getRepo().getById(id)
  },

  async getAll(): Promise<Customer[]> {
    return getRepo().getAll()
  },
}
