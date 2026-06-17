import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"
import { validate, customerSchema } from "@/lib/validation"

export const GET = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()

  const search = new URL(request.url).searchParams.get("search")
  const where: any = { organizationId: org.id, deletedAt: null }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { company: { contains: search } },
    ]
  }

  const customers = await prisma.customer.findMany({
    where,
    include: { _count: { select: { orders: true, invoices: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(customers)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("customers", "create")
  const { org } = await requireOrg()

  const body = await request.json()
  const data = validate(customerSchema, body)

  const customer = await prisma.customer.create({
    data: { ...data, organizationId: org.id },
  })

  await logAudit({
    action: "created",
    entity: "Customer",
    entityId: customer.id,
    message: `Customer "${customer.name}" created`,
    organizationId: org.id,
  })

  return NextResponse.json(customer)
})
