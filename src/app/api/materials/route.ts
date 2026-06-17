import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"
import { auth } from "@/lib/auth"
import { ProductStatus } from "@/generated/prisma/enums"
import { validate, productSchema } from "@/lib/validation"

export const GET = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()

  const materials = await prisma.product.findMany({
    where: { organizationId: org.id, type: "raw_material", deletedAt: null },
    include: {
      category: { select: { name: true } },
      supplier: { select: { name: true } },
      warehouse: { select: { name: true } },
      supplierPrices: { include: { supplier: { select: { name: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(materials)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("materials", "create")
  const { org } = await requireOrg()

  const session = await auth()
  const body = await request.json()
  const data = validate(productSchema, { ...body, type: "raw_material" })

  const supplierPricesData = body.supplierPrices as Array<Record<string, unknown>> | undefined

  const material = await prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      barcode: data.barcode || undefined,
      description: data.description || undefined,
      unitPrice: data.unitPrice,
      costPrice: data.costPrice,
      currency: data.currency,
      vatStatus: data.vatStatus,
      stock: data.stock,
      minStock: data.minStock,
      maxStock: data.maxStock ?? null,
      safetyStock: data.safetyStock,
      uom: data.uom,
      leadTime: data.leadTime,
      weight: data.weight ?? null,
      dimensions: data.dimensions || undefined,
      externalId: data.externalId || undefined,
      tags: data.tags || undefined,
      location: data.location || undefined,
      image: data.image || undefined,
      status: data.status as typeof ProductStatus[keyof typeof ProductStatus],
      categoryId: data.categoryId || undefined,
      supplierId: data.supplierId || undefined,
      warehouseId: data.warehouseId || undefined,
      type: "raw_material",
      organizationId: org.id,
      createdById: session?.user?.id,
      ...(supplierPricesData?.length
        ? {
            supplierPrices: {
              create: supplierPricesData.map((sp) => ({
                supplierId: sp.supplierId as string,
                price: typeof sp.price === "string" ? parseFloat(sp.price) || 0 : (sp.price as number) || 0,
                currency: (sp.currency as string) || "THB",
                leadTime: typeof sp.leadTime === "string" ? parseInt(sp.leadTime) || 0 : (sp.leadTime as number) || 0,
                isDefault: sp.isDefault === true,
                notes: sp.notes as string | undefined,
              })),
            },
          }
        : {}),
    },
    include: {
      supplierPrices: { include: { supplier: { select: { name: true } } } },
    },
  })

  await logAudit({
    action: "created",
    entity: "Material",
    entityId: material.id,
    message: `Material "${material.name}" created`,
    organizationId: org.id,
  })

  return NextResponse.json(material)
})

export const PUT = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()

  const body: Record<string, unknown> = await request.json()
  const sku = body.sku as string
  const excludeId = body.excludeId as string | undefined

  const existing = await prisma.product.findFirst({
    where: {
      organizationId: org.id,
      sku,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  })

  return NextResponse.json({ exists: !!existing })
})
