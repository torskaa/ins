import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit, withSoftDelete } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params

  const warehouse = await prisma.warehouse.findFirst({
    where: { id, organizationId: org.id, deletedAt: null },
    include: {
      _count: { select: { products: true, stockMovements: true } },
      stockMovements: { take: 20, orderBy: { createdAt: "desc" }, include: { product: { select: { name: true, sku: true } } } },
    },
  })
  if (!warehouse) return NextResponse.json({ error: "Warehouse not found" }, { status: 404 })
  return NextResponse.json(warehouse)
})

export const PUT = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("warehouses", "update")
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()
  const warehouse = await prisma.warehouse.update({ where: { id }, data: body })
  await logAudit({ action: "updated", entity: "Warehouse", entityId: id, message: `Warehouse "${warehouse.name}" updated`, organizationId: org.id })
  return NextResponse.json(warehouse)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("warehouses", "delete")
  const { org } = await requireOrg()
  const { id } = await params
  const warehouse = await withSoftDelete(prisma.warehouse, id, org.id)
  await logAudit({ action: "deleted", entity: "Warehouse", entityId: id, message: `Warehouse "${warehouse.name}" deleted`, organizationId: org.id })
  return NextResponse.json({ success: true })
})
