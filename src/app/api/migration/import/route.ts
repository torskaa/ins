import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg } from "@/lib/middleware"

const ENTITY_HANDLERS: Record<string, (row: Record<string, any>, orgId: string) => Promise<any>> = {
  products: async (row, orgId) => {
    let categoryId: string | undefined
    if (row.category) {
      const cat = await prisma.category.upsert({
        where: { slug_organizationId: { slug: row.category.toLowerCase().replace(/\s+/g, "-"), organizationId: orgId } },
        update: {},
        create: { name: row.category, slug: row.category.toLowerCase().replace(/\s+/g, "-"), organizationId: orgId },
      })
      categoryId = cat.id
    }

    let supplierId: string | undefined
    if (row.supplier) {
      const existing = await prisma.supplier.findFirst({
        where: { name: row.supplier, organizationId: orgId },
      })
      if (existing) {
        supplierId = existing.id
      } else {
        const sup = await prisma.supplier.create({
          data: { name: row.supplier, organizationId: orgId },
        })
        supplierId = sup.id
      }
    }

    return prisma.product.create({
      data: {
        name: row.name,
        sku: row.sku || `IMP-${Date.now()}`,
        barcode: row.barcode,
        description: row.description,
        unitPrice: parseFloat(row.unitPrice) || 0,
        costPrice: parseFloat(row.costPrice) || 0,
        stock: parseInt(row.stock) || 0,
        minStock: parseInt(row.minStock) || 0,
        safetyStock: parseInt(row.safetyStock) || 0,
        uom: row.uom || "pcs",
        type: row.type || "finished_good",
        status: row.status || "active",
        weight: row.weight ? parseFloat(row.weight) : undefined,
        tags: row.tags,
        location: row.location,
        categoryId,
        supplierId,
        organizationId: orgId,
      },
    })
  },

  customers: async (row, orgId) => {
    return prisma.customer.create({
      data: {
        name: row.name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        company: row.company,
        taxId: row.taxId,
        creditLimit: row.creditLimit ? parseFloat(row.creditLimit) : undefined,
        notes: row.notes,
        organizationId: orgId,
      },
    })
  },

  suppliers: async (row, orgId) => {
    return prisma.supplier.create({
      data: {
        name: row.name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        taxId: row.taxId,
        contactPerson: row.contactPerson,
        paymentTerms: row.paymentTerms,
        currency: row.currency || "THB",
        notes: row.notes,
        organizationId: orgId,
      },
    })
  },

  categories: async (row, orgId) => {
    const slug = row.slug || row.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "")
    return prisma.category.upsert({
      where: { slug_organizationId: { slug, organizationId: orgId } },
      update: { description: row.description },
      create: { name: row.name, slug, description: row.description, organizationId: orgId },
    })
  },
}

export const POST = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()
  const formData = await request.formData()
  const entity = formData.get("entity") as string
  const mapping = JSON.parse(formData.get("mapping") as string) as Record<string, string>
  const file = formData.get("file") as File

  if (!entity || !file || !mapping) {
    return NextResponse.json({ error: "Missing entity, file, or mapping" }, { status: 400 })
  }

  const handler = ENTITY_HANDLERS[entity]
  if (!handler) {
    return NextResponse.json({ error: `Unknown entity: ${entity}` }, { status: 400 })
  }

  const text = await file.text()
  const ext = file.name.split(".").pop()?.toLowerCase()

  let rows: Record<string, string>[] = []

  if (ext === "csv") {
    const { parse } = await import("papaparse")
    const result = parse(text, { header: true, skipEmptyLines: true, dynamicTyping: false })
    rows = result.data as Record<string, string>[]
  } else if (ext === "xlsx" || ext === "xls") {
    const XLSX = await import("xlsx")
    const wb = XLSX.read(text, { type: "string" })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" })
    rows = data
  } else {
    return NextResponse.json({ error: "Unsupported file format. Use CSV or Excel." }, { status: 400 })
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "File is empty or has no data rows" }, { status: 400 })
  }

  if (rows.length > 5000) {
    return NextResponse.json({ error: "Maximum 5,000 rows per import" }, { status: 400 })
  }

  const importResults: { success: number; errors: { row: number; message: string }[] } = {
    success: 0,
    errors: [],
  }

  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i]
      const mapped: Record<string, any> = {}
      for (const [field, column] of Object.entries(mapping)) {
        mapped[field] = row[column]?.toString().trim() || ""
      }
      if (!mapped.name) {
        importResults.errors.push({ row: i + 2, message: "Name is required" })
        continue
      }
      await handler(mapped, org.id)
      importResults.success++
    } catch (err: any) {
      importResults.errors.push({ row: i + 2, message: err.message || "Unknown error" })
    }
  }

  return NextResponse.json(importResults)
})

export const dynamic = "force-dynamic"
