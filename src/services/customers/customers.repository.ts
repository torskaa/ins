import type { Customer } from "@/services/orders/orders.repository"

export interface CustomersRepository {
  getAll(): Promise<Customer[]>
  getById(id: string): Promise<Customer | null>
  search(query: string): Promise<Customer[]>
  getTopBySpending(limit?: number): Promise<Customer[]>
  getTopByOrders(limit?: number): Promise<Customer[]>
}
