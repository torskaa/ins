export type MockInvoice = {
  id: string
  number: string
  customerId: string
  customerName: string
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
  subtotal: number
  tax: number
  total: number
  dueDate: string
  createdAt: string
}

export type MockPayment = {
  id: string
  invoiceId: string
  invoiceNumber: string
  amount: number
  method: "bank_transfer" | "credit_card" | "cash" | "cheque"
  reference: string
  createdAt: string
}

export const invoices: MockInvoice[] = [
  { id: "inv-1", number: "INV-2024-001", customerId: "c-1", customerName: "Somchai Manufacturing", status: "paid", subtotal: 18500, tax: 1295, total: 19795, dueDate: "2024-11-15", createdAt: "2024-10-15" },
  { id: "inv-2", number: "INV-2024-002", customerId: "c-2", customerName: "Prasert Industrial Supply", status: "sent", subtotal: 32000, tax: 2240, total: 34240, dueDate: "2024-11-20", createdAt: "2024-10-20" },
  { id: "inv-3", number: "INV-2024-003", customerId: "c-4", customerName: "Siriwat Construction", status: "overdue", subtotal: 56000, tax: 3920, total: 59920, dueDate: "2024-11-05", createdAt: "2024-10-05" },
  { id: "inv-4", number: "INV-2024-004", customerId: "c-3", customerName: "Narong Engineering", status: "draft", subtotal: 12750, tax: 893, total: 13643, dueDate: "2024-12-01", createdAt: "2024-10-28" },
  { id: "inv-5", number: "INV-2024-005", customerId: "c-1", customerName: "Somchai Manufacturing", status: "paid", subtotal: 8900, tax: 623, total: 9523, dueDate: "2024-12-05", createdAt: "2024-11-05" },
]

export const payments: MockPayment[] = [
  { id: "pmt-1", invoiceId: "inv-1", invoiceNumber: "INV-2024-001", amount: 19795, method: "bank_transfer", reference: "TRF-20241020", createdAt: "2024-10-20" },
  { id: "pmt-2", invoiceId: "inv-5", invoiceNumber: "INV-2024-005", amount: 9523, method: "credit_card", reference: "CC-20241110", createdAt: "2024-11-10" },
  { id: "pmt-3", invoiceId: "inv-1", invoiceNumber: "INV-2024-001", amount: 5000, method: "cash", reference: "CSH-20241018", createdAt: "2024-10-18" },
]
