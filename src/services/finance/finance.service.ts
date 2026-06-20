import type { FinanceRepository, Invoice, Payment } from "./finance.repository"
import { MockFinanceRepository } from "./mock-finance.repository"

let repository: FinanceRepository | null = null

function getRepo(): FinanceRepository {
  if (!repository) repository = new MockFinanceRepository()
  return repository
}

export function setFinanceRepository(repo: FinanceRepository) {
  repository = repo
}

export const financeService = {
  async getInvoices(limit?: number): Promise<Invoice[]> {
    return getRepo().getAllInvoices(limit)
  },

  async getInvoice(id: string): Promise<Invoice | null> {
    return getRepo().getInvoiceById(id)
  },

  async getOverdueInvoices(): Promise<Invoice[]> {
    return getRepo().getOverdueInvoices()
  },

  async getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
    return getRepo().getInvoicesByCustomer(customerId)
  },

  async getPayments(limit?: number): Promise<Payment[]> {
    return getRepo().getAllPayments(limit)
  },

  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    return getRepo().getPaymentsByInvoice(invoiceId)
  },

  async getOutstandingAmount(): Promise<number> {
    return getRepo().getTotalOutstanding()
  },

  async getCollectedAmount(): Promise<number> {
    return getRepo().getTotalCollected()
  },

  async getFinanceSummary(): Promise<{ totalInvoiced: number; totalCollected: number; outstanding: number; overdueCount: number; paidCount: number }> {
    const invoices = await getRepo().getAllInvoices()
    const outstanding = await getRepo().getTotalOutstanding()
    const collected = await getRepo().getTotalCollected()
    return {
      totalInvoiced: invoices.reduce((s, inv) => s + inv.total, 0),
      totalCollected: collected,
      outstanding,
      overdueCount: invoices.filter(inv => inv.status === "overdue").length,
      paidCount: invoices.filter(inv => inv.status === "paid").length,
    }
  },
}
