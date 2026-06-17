import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()

  const distributors = await prisma.distributor.findMany({
    where: { organizationId: org.id, deletedAt: null },
    include: { _count: { select: { deliveries: true } } },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(distributors)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("suppliers", "create")
  const { org } = await requireOrg()

  const body = await request.json()
  const distributor = await prisma.distributor.create({
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      taxId: body.taxId,
      contactPerson: body.contactPerson,
      territory: body.territory,
      route: body.route,
      contractStart: body.contractStart ? new Date(body.contractStart) : undefined,
      contractEnd: body.contractEnd ? new Date(body.contractEnd) : undefined,
      status: body.status || "active",
      notes: body.notes,
      organizationId: org.id,
    },
  })

  await logAudit({
    action: "created",
    entity: "Distributor",
    entityId: distributor.id,
    message: `Distributor "${distributor.name}" created`,
    organizationId: org.id,
  })

  return NextResponse.json(distributor)
})
