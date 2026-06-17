import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"
import { auth } from "@/lib/auth"
import { ProductStatus } from "@/generated/prisma/enums"
import { validate, productSchema } from "@/lib/validation"

export const GET = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()

  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get("categoryId")
  const search = searchParams.get("search")

  const where: any = { organizationId: org.id, deletedAt: null }
  if (categoryId) where.categoryId = categoryId
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
    ]
  }

  const products = await prisma.product.findMany({
    where,
    include: { category: { select: { name: true } }, supplier: { select: { name: true } }, warehouse: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(products)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("products", "create")
  const { org } = await requireOrg()

  const session = await auth()
  const body = await request.json()
  const data = validate(productSchema, body)

  const product = await prisma.product.create({
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
      type: data.type,
      organizationId: org.id,
      createdById: session?.user?.id,
    },
  })

  await logAudit({
    action: "created",
    entity: "Product",
    entityId: product.id,
    message: `Product "${product.name}" created`,
    organizationId: org.id,
  })

  return NextResponse.json(product)
})

export const PUT = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()

  const body = await request.json()
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
