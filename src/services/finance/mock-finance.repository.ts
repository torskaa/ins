import type { FinanceRepository, Invoice, Payment } from "./finance.repository"
import { invoices, payments } from "@/mock/finance.mock"

export class MockFinanceRepository implements FinanceRepository {
  async getAllInvoices(limit?: number): Promise<Invoice[]> {
    const items = [...invoices]
    return (limit ? items.slice(0, limit) : items).map(inv => ({ ...inv }))
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    return invoices.find(inv => inv.id === id) ?? null
  }

  async getInvoicesByStatus(status: string): Promise<Invoice[]> {
    return invoices.filter(inv => inv.status === status).map(inv => ({ ...inv }))
  }

  async getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
    return invoices.filter(inv => inv.customerId === customerId).map(inv => ({ ...inv }))
  }

  async getOverdueInvoices(): Promise<Invoice[]> {
    return invoices.filter(inv => inv.status === "overdue").map(inv => ({ ...inv }))
  }

  async getAllPayments(limit?: number): Promise<Payment[]> {
    const items = [...payments]
    return (limit ? items.slice(0, limit) : items).map(p => ({ ...p }))
  }

  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    return payments.filter(p => p.invoiceId === invoiceId).map(p => ({ ...p }))
  }

  async getTotalOutstanding(): Promise<number> {
    return invoices
      .filter(inv => inv.status === "sent" || inv.status === "overdue")
      .reduce((sum, inv) => sum + inv.total, 0)
  }

  async getTotalCollected(): Promise<number> {
    return payments.reduce((sum, p) => sum + p.amount, 0)
  }
}
