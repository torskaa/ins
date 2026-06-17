import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()

  const warehouses = await prisma.warehouse.findMany({
    where: { organizationId: org.id, deletedAt: null },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(warehouses)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("warehouses", "create")
  const { org } = await requireOrg()

  const body = await request.json()
  const warehouse = await prisma.warehouse.create({
    data: { ...body, organizationId: org.id },
  })

  await logAudit({
    action: "created",
    entity: "Warehouse",
    entityId: warehouse.id,
    message: `Warehouse "${warehouse.name}" created`,
    organizationId: org.id,
  })

  return NextResponse.json(warehouse)
})
