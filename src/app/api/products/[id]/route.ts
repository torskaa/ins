import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit, withSoftDelete } from "@/lib/middleware"
import { validate, productUpdateSchema } from "@/lib/validation"

export const GET = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { org } = await requireOrg()

  const product = await prisma.product.findFirst({
    where: { id, organizationId: org.id, deletedAt: null },
    include: { category: true, supplier: true, warehouse: true },
  })
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [movements, lots, supplierPrices, bomAsFinished, bomAsMaterial, orderItems, invoiceItems] = await Promise.all([
    prisma.stockMovement.findMany({ where: { productId: id }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.lot.findMany({ where: { productId: id, organizationId: org.id, deletedAt: null }, orderBy: { receivedDate: "desc" }, take: 20 }),
    prisma.supplierPrice.findMany({ where: { productId: id }, include: { supplier: { select: { id: true, name: true } } } }),
    prisma.billOfMaterial.findMany({ where: { finishedGoodId: id, organizationId: org.id }, include: { material: { select: { id: true, name: true, sku: true } } }, orderBy: { version: "desc" } }),
    prisma.billOfMaterial.findMany({ where: { materialId: id, organizationId: org.id, status: { not: "archived" } }, include: { finishedGood: { select: { id: true, name: true, sku: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.orderItem.findMany({ where: { productId: id }, include: { order: { select: { id: true, number: true, type: true, status: true, total: true, createdAt: true } } }, orderBy: { order: { createdAt: "desc" } }, take: 20 }),
    prisma.invoiceItem.findMany({ where: { productId: id }, include: { invoice: { select: { id: true, number: true, status: true, total: true, createdAt: true } } }, orderBy: { invoice: { createdAt: "desc" } }, take: 20 }),
  ])

  return NextResponse.json({
    ...product,
    movements,
    lots,
    supplierPrices,
    bomAsFinished,
    bomAsMaterial,
    orderItems,
    invoiceItems,
  })
})

export const PUT = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requirePermission("products", "update")
  const { id } = await params
  const { org } = await requireOrg()
  const body = await request.json()
  const data = validate(productUpdateSchema, body)
  const existing = await prisma.product.findFirst({ where: { id, organizationId: org.id, deletedAt: null }, select: { name: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.product.update({ where: { id }, data })
  await logAudit({ action: "updated", entity: "Product", entityId: id, message: `Product "${existing.name}" updated`, organizationId: org.id })
  return NextResponse.json({ success: true })
})

export const DELETE = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requirePermission("products", "delete")
  const { id } = await params
  const { org } = await requireOrg()
  const product = await withSoftDelete(prisma.product, id, org.id)
  await logAudit({ action: "deleted", entity: "Product", entityId: id, message: `Product "${product.name}" deleted`, organizationId: org.id })
  return NextResponse.json({ success: true })
})
