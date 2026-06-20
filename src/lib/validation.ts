import { z } from "zod"
import { AppError } from "@/lib/errors"

export { z }

const cuidRegex = /^c[a-z0-9]{24}$/

export const idSchema = z.string().regex(cuidRegex, "Invalid ID format")

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// ─── Product ───
export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  sku: z.string().min(1, "SKU is required").max(50),
  barcode: z.string().max(50).optional().default(""),
  description: z.string().max(2000).optional().default(""),
  unitPrice: z.coerce.number().min(0).default(0),
  costPrice: z.coerce.number().min(0).default(0),
  currency: z.enum(["THB", "USD", "EUR", "GBP", "JPY", "CNY", "SGD", "MYR"]).default("THB"),
  vatStatus: z.enum(["include_vat", "exclude_vat"]).default("exclude_vat"),
  stock: z.coerce.number().int().min(0).default(0),
  minStock: z.coerce.number().int().min(0).default(0),
  maxStock: z.coerce.number().int().min(0).optional(),
  safetyStock: z.coerce.number().int().min(0).default(0),
  uom: z.string().default("pcs"),
  leadTime: z.coerce.number().int().min(0).default(0),
  weight: z.coerce.number().min(0).optional(),
  dimensions: z.string().max(100).optional().default(""),
  externalId: z.string().max(100).optional().default(""),
  tags: z.string().optional().default(""),
  location: z.string().max(100).optional().default(""),
  image: z.string().url().optional().or(z.literal("")).default(""),
  type: z.enum(["raw_material", "finished_good", "service"]).default("finished_good"),
  status: z.enum(["active", "inactive", "discontinued"]).default("active"),
  categoryId: idSchema.optional(),
  supplierId: idSchema.optional(),
  warehouseId: idSchema.optional(),
})

export const productUpdateSchema = productSchema.partial()

// ─── Supplier ───
export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  taxId: z.string().max(50).optional().or(z.literal("")),
  contactPerson: z.string().max(200).optional().or(z.literal("")),
  contactPersonRole: z.string().max(100).optional().or(z.literal("")),
  preferredChannel: z.string().max(50).optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  paymentTerms: z.string().max(50).optional().or(z.literal("")),
  currency: z.string().max(10).default("THB"),
  rating: z.enum(["active", "preferred", "inactive", "blacklisted"]).default("active"),
  defaultLeadTime: z.coerce.number().int().min(0).default(0),
  documents: z.any().optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
})

export const supplierUpdateSchema = supplierSchema.partial()

// ─── Customer ───
export const customerSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  company: z.string().max(200).optional().or(z.literal("")),
  taxId: z.string().max(50).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  creditLimit: z.coerce.number().min(0).optional(),
})

// ─── Order ───
export const orderSchema = z.object({
  type: z.enum(["sales", "purchase"]).default("sales"),
  customerId: idSchema.optional(),
  supplierId: idSchema.optional(),
  notes: z.string().max(2000).optional(),
  expectedDate: z.string().optional(),
  items: z.array(z.object({
    productId: idSchema,
    quantity: z.coerce.number().int().positive(),
    unitPrice: z.coerce.number().min(0),
  })).min(1, "At least one item is required"),
})

export const orderUpdateSchema = z.object({
  status: z.enum(["draft", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"]).optional(),
  notes: z.string().max(2000).optional(),
})

// ─── BOM ───
export const bomItemSchema = z.object({
  materialId: idSchema,
  quantity: z.coerce.number().positive("Quantity must be positive"),
  scrapAllowance: z.coerce.number().min(0).default(0),
  unit: z.string().default("pcs"),
  wastePercent: z.coerce.number().min(0).max(100).default(0),
})

export const bomCreateSchema = z.object({
  finishedGoodId: idSchema,
  items: z.array(bomItemSchema).min(1, "At least one material is required"),
  version: z.number().int().positive().optional(),
  effectiveDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
})

export const bomActionSchema = z.object({
  action: z.enum(["submit", "approve", "archive", "new-version"]),
})

// ─── Stock ───
export const stockAdjustSchema = z.object({
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  reason: z.string().max(500).optional(),
})

export const stockTransferSchema = z.object({
  productId: idSchema,
  fromWarehouseId: idSchema,
  toWarehouseId: idSchema,
  quantity: z.coerce.number().int().positive(),
  lotId: idSchema.optional(),
})

// ─── Lot ───
export const lotSchema = z.object({
  number: z.string().min(1, "Lot number is required").max(50),
  productId: idSchema,
  supplierId: idSchema.optional(),
  receivedDate: z.string().optional(),
  expiryDate: z.string().optional(),
  quantity: z.coerce.number().int().positive(),
  costPrice: z.coerce.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
})

// ─── Invoice ───
export const invoiceSchema = z.object({
  customerId: idSchema,
  orderId: idSchema.optional(),
  issueDate: z.string(),
  dueDate: z.string(),
  notes: z.string().max(2000).optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.coerce.number().int().positive(),
    unitPrice: z.coerce.number().min(0),
    productId: idSchema.optional(),
  })).min(1),
})

// ─── Quotation ───
export const quotationSchema = z.object({
  customerId: idSchema,
  validUntil: z.string().optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(z.object({
    productId: idSchema,
    quantity: z.coerce.number().int().positive(),
    unitPrice: z.coerce.number().min(0),
  })).min(1),
})

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.join(".")
      if (!errors[path]) errors[path] = []
      errors[path].push(issue.message)
    }
    throw new AppError("Validation failed", 422, "VALIDATION_ERROR", errors)
  }
  return result.data
}

export function analyzePassword(password: string) {
  const checks = [
    { label: "At least 8 characters", passed: password.length >= 8 },
    { label: "Contains uppercase letter", passed: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", passed: /[a-z]/.test(password) },
    { label: "Contains number", passed: /\d/.test(password) },
    { label: "Contains special character", passed: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ]
  const passedCount = checks.filter((c) => c.passed).length
  const score = Math.min(passedCount, 4)
  const colors = ["bg-destructive", "bg-warning", "bg-warning", "bg-info", "bg-success"]
  const labels = ["Weak", "Fair", "Good", "Strong", "Very Strong"]
  return {
    score,
    label: labels[score],
    color: colors[score],
    checks,
  }
}
