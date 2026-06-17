import { NextResponse } from "next/server"
import { apiHandler, requireOrg } from "@/lib/middleware"

const ENTITIES: Record<string, { label: string; fields: { key: string; label: string; type: string; required?: boolean; hint?: string }[] }> = {
  products: {
    label: "Products",
    fields: [
      { key: "name", label: "Product Name", type: "string", required: true },
      { key: "sku", label: "SKU", type: "string", required: true },
      { key: "barcode", label: "Barcode", type: "string" },
      { key: "description", label: "Description", type: "text" },
      { key: "unitPrice", label: "Unit Price", type: "number" },
      { key: "costPrice", label: "Cost Price", type: "number" },
      { key: "stock", label: "Stock Quantity", type: "number" },
      { key: "minStock", label: "Min Stock", type: "number" },
      { key: "safetyStock", label: "Safety Stock", type: "number" },
      { key: "uom", label: "Unit of Measure", type: "string", hint: "pcs, kg, m, box" },
      { key: "type", label: "Product Type", type: "select", hint: "raw_material, finished_good, service" },
      { key: "status", label: "Status", type: "select", hint: "active, inactive, discontinued" },
      { key: "category", label: "Category Name", type: "string" },
      { key: "supplier", label: "Supplier Name", type: "string" },
      { key: "warehouse", label: "Warehouse Name", type: "string" },
      { key: "weight", label: "Weight", type: "number" },
      { key: "tags", label: "Tags", type: "string", hint: "comma-separated" },
      { key: "location", label: "Location", type: "string" },
    ],
  },
  customers: {
    label: "Customers",
    fields: [
      { key: "name", label: "Customer Name", type: "string", required: true },
      { key: "email", label: "Email", type: "string" },
      { key: "phone", label: "Phone", type: "string" },
      { key: "address", label: "Address", type: "text" },
      { key: "company", label: "Company", type: "string" },
      { key: "taxId", label: "Tax ID", type: "string" },
      { key: "creditLimit", label: "Credit Limit", type: "number" },
      { key: "notes", label: "Notes", type: "text" },
    ],
  },
  suppliers: {
    label: "Suppliers",
    fields: [
      { key: "name", label: "Supplier Name", type: "string", required: true },
      { key: "email", label: "Email", type: "string" },
      { key: "phone", label: "Phone", type: "string" },
      { key: "address", label: "Address", type: "text" },
      { key: "taxId", label: "Tax ID", type: "string" },
      { key: "contactPerson", label: "Contact Person", type: "string" },
      { key: "paymentTerms", label: "Payment Terms", type: "string" },
      { key: "currency", label: "Currency", type: "select", hint: "THB, USD, EUR" },
      { key: "notes", label: "Notes", type: "text" },
    ],
  },
  categories: {
    label: "Categories",
    fields: [
      { key: "name", label: "Category Name", type: "string", required: true },
      { key: "slug", label: "Slug", type: "string", hint: "leave empty to auto-generate" },
      { key: "description", label: "Description", type: "text" },
    ],
  },
}

export const GET = apiHandler(async () => {
  return NextResponse.json(
    Object.entries(ENTITIES).map(([key, val]) => ({
      key,
      label: val.label,
      fieldCount: val.fields.length,
      requiredFields: val.fields.filter((f) => f.required).map((f) => f.label),
    }))
  )
})

export const dynamic = "force-dynamic"
