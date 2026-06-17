import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit, withSoftDelete } from "@/lib/middleware"
import { validate, supplierUpdateSchema } from "@/lib/validation"

export const GET = apiHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { org } = await requireOrg()

  const supplier = await prisma.supplier.findFirst({
    where: { id, organizationId: org.id, deletedAt: null },
    include: { _count: { select: { products: true } } },
  })
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [products, purchaseOrders, lots, supplierPrices] = await Promise.all([
    prisma.product.findMany({ where: { supplierId: id, organizationId: org.id, deletedAt: null }, select: { id: true, name: true, sku: true, unitPrice: true, stock: true, status: true }, orderBy: { name: "asc" }, take: 50 }),
    prisma.order.findMany({ where: { supplierId: id, organizationId: org.id }, include: { items: { select: { quantity: true, total: true, product: { select: { name: true } } } } }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.lot.findMany({ where: { supplierId: id, organizationId: org.id, deletedAt: null }, include: { product: { select: { name: true, sku: true } } }, orderBy: { receivedDate: "desc" }, take: 20 }),
    prisma.supplierPrice.findMany({ where: { supplierId: id }, include: { product: { select: { name: true, sku: true } } } }),
  ])

  const deliveredOrders = purchaseOrders.filter((o) => o.status === "delivered").length
  const onTimeDelivered = purchaseOrders.filter((o) => o.status === "delivered" && o.deliveredAt && o.expectedDate && o.deliveredAt <= o.expectedDate).length
  const onTimeDeliveryRate = purchaseOrders.length > 0 ? Math.round((onTimeDelivered / purchaseOrders.length) * 100 * 10) / 10 : null

  return NextResponse.json({
    ...supplier,
    products,
    purchaseOrders,
    lots,
    supplierPrices,
    performance: {
      totalOrders: purchaseOrders.length,
      deliveredOrders,
      onTimeDeliveryRate,
      totalProducts: products.length,
      totalLots: lots.length,
    },
  })
})

export const PUT = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requirePermission("suppliers", "update")
  const { id } = await params
  const { org } = await requireOrg()
  const body = await request.json()
  const data = validate(supplierUpdateSchema, body)
  const supplier = await prisma.supplier.update({ where: { id }, data })
  await logAudit({ action: "updated", entity: "Supplier", entityId: id, message: `Supplier "${supplier.name}" updated`, organizationId: org.id })
  return NextResponse.json(supplier)
})

export const DELETE = apiHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requirePermission("suppliers", "delete")
  const { id } = await params
  const { org } = await requireOrg()
  const supplier = await withSoftDelete(prisma.supplier, id, org.id)
  await logAudit({ action: "deleted", entity: "Supplier", entityId: id, message: `Supplier "${supplier.name}" deleted`, organizationId: org.id })
  return NextResponse.json({ success: true })
})
