import { z } from "zod"

export const paginationInputSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const paginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
})

export type PaginationInput = z.infer<typeof paginationInputSchema>
export type PaginationMeta = z.infer<typeof paginationMetaSchema>

export function paginate(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit)
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

export function paginatedResponse<T>(items: T[], total: number, input: PaginationInput) {
  return {
    items,
    pagination: paginate(input.page, input.limit, total),
  }
}
