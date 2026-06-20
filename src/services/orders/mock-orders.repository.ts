import type { OrdersRepository, Customer, Order, Quotation } from "./orders.repository"
import { customers, orders, quotations } from "@/mock/orders.mock"

export class MockOrdersRepository implements OrdersRepository {
  async getAllCustomers(): Promise<Customer[]> {
    return customers.map(c => ({ ...c }))
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    return customers.find(c => c.id === id) ?? null
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return orders.filter(o => o.customerId === customerId).map(o => ({ ...o }))
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return orders.filter(o => o.status === status).map(o => ({ ...o }))
  }

  async getAllOrders(limit?: number): Promise<Order[]> {
    const items = [...orders]
    return (limit ? items.slice(0, limit) : items).map(o => ({ ...o }))
  }

  async getAllQuotations(limit?: number): Promise<Quotation[]> {
    const items = [...quotations]
    return (limit ? items.slice(0, limit) : items).map(q => ({ ...q }))
  }

  async getQuotationsByCustomer(customerId: string): Promise<Quotation[]> {
    return quotations.filter(q => q.customerId === customerId).map(q => ({ ...q }))
  }
}
