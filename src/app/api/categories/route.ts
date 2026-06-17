import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()

  const categories = await prisma.category.findMany({
    where: { organizationId: org.id, deletedAt: null },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(categories)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("categories", "create")
  const { org } = await requireOrg()

  const body = await request.json()
  const category = await prisma.category.create({
    data: {
      name: body.name,
      description: body.description,
      slug: body.name.toLowerCase().replace(/\s+/g, "-"),
      organizationId: org.id,
    },
  })

  await logAudit({
    action: "created",
    entity: "Category",
    entityId: category.id,
    message: `Category "${category.name}" created`,
    organizationId: org.id,
  })

  return NextResponse.json(category)
})
