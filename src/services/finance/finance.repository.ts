export type Invoice = {
  id: string
  number: string
  customerId: string
  customerName: string
  status: string
  subtotal: number
  tax: number
  total: number
  dueDate: string
  createdAt: string
}

export type Payment = {
  id: string
  invoiceId: string
  invoiceNumber: string
  amount: number
  method: string
  reference: string
  createdAt: string
}

export interface FinanceRepository {
  getAllInvoices(limit?: number): Promise<Invoice[]>
  getInvoiceById(id: string): Promise<Invoice | null>
  getInvoicesByStatus(status: string): Promise<Invoice[]>
  getInvoicesByCustomer(customerId: string): Promise<Invoice[]>
  getOverdueInvoices(): Promise<Invoice[]>
  getAllPayments(limit?: number): Promise<Payment[]>
  getPaymentsByInvoice(invoiceId: string): Promise<Payment[]>
  getTotalOutstanding(): Promise<number>
  getTotalCollected(): Promise<number>
}
