import { api } from "@/lib/api-client"

interface Order {
  id: string
  number: string
  type: string
  status: string
  total: number
  orderDate: string
  customer?: { name: string } | null
  supplier?: { name: string } | null
  items: unknown[]
}

interface OrderInput {
  type: string
  status?: string
  items?: { productId: string; quantity: number; price: number }[]
  notes?: string
}

interface OrderListParams {
  type?: string
  search?: string
  status?: string
}

export const ordersClient = {
  list: (params?: OrderListParams) => {
    const searchParams = new URLSearchParams()
    if (params?.type) searchParams.set("type", params.type)
    if (params?.search) searchParams.set("search", params.search)
    if (params?.status) searchParams.set("status", params.status)
    const qs = searchParams.toString()
    return api.get<Order[]>(`/api/orders${qs ? `?${qs}` : ""}`)
  },
  get: (id: string) => api.get<Order>(`/api/orders/${id}`),
  create: (data: OrderInput) => api.post<Order>("/api/orders", data),
  update: (id: string, data: Partial<OrderInput>) => api.put<Order>(`/api/orders/${id}`, data),
  delete: (id: string) => api.delete<void>(`/api/orders/${id}`),
}
