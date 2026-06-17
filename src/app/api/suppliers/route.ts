import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"
import { validate, supplierSchema } from "@/lib/validation"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()

  const suppliers = await prisma.supplier.findMany({
    where: { organizationId: org.id, deletedAt: null },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(suppliers)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("suppliers", "create")
  const { org } = await requireOrg()

  const body = await request.json()
  const data = validate(supplierSchema, body)

  const supplier = await prisma.supplier.create({
    data: {
      ...data,
      organizationId: org.id,
    },
  })

  await logAudit({
    action: "created",
    entity: "Supplier",
    entityId: supplier.id,
    message: `Supplier "${supplier.name}" created`,
    organizationId: org.id,
  })

  return NextResponse.json(supplier)
})
