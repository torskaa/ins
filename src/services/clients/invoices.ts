import { api } from "@/lib/api-client"

interface Invoice {
  id: string
  number: string
  status: string
  total: number
  issueDate: string
  dueDate: string
  customer?: { name: string } | null
  items: unknown[]
}

interface InvoiceInput {
  customerId: string
  items: { productId: string; quantity: number; price: number }[]
  dueDate?: string
  notes?: string
}

export const invoicesClient = {
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : ""
    return api.get<Invoice[]>(`/api/invoices${qs}`)
  },
  get: (id: string) => api.get<Invoice>(`/api/invoices/${id}`),
  create: (data: InvoiceInput) => api.post<Invoice>("/api/invoices", data),
  update: (id: string, data: Partial<InvoiceInput>) => api.put<Invoice>(`/api/invoices/${id}`, data),
  delete: (id: string) => api.delete<void>(`/api/invoices/${id}`),
}
