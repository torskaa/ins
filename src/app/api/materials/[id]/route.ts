import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit, withSoftDelete } from "@/lib/middleware"
import { validate, productUpdateSchema } from "@/lib/validation"

export const GET = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { org } = await requireOrg()

  const material = await prisma.product.findFirst({
    where: { id, organizationId: org.id, type: "raw_material", deletedAt: null },
    include: {
      category: true,
      supplier: true,
      warehouse: true,
      movements: { orderBy: { createdAt: "desc" } },
      bomComponents: {
        where: { organizationId: org.id },
        include: { finishedGood: { select: { id: true, name: true, sku: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!material) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(material)
})

export const PATCH = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requirePermission("materials", "update")
  const { id } = await params
  const { org } = await requireOrg()

  const existing = await prisma.product.findFirst({
    where: { id, organizationId: org.id, type: "raw_material" },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await request.json()
  const data = validate(productUpdateSchema, body)

  const material = await prisma.product.update({
    where: { id },
    data,
  })

  await logAudit({
    action: "updated",
    entity: "Material",
    entityId: id,
    message: `Material "${material.name}" updated`,
    organizationId: org.id,
  })

  return NextResponse.json(material)
})

export const DELETE = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requirePermission("materials", "delete")
  const { id } = await params
  const { org } = await requireOrg()

  const existing = await prisma.product.findFirst({
    where: { id, organizationId: org.id, type: "raw_material" },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const material = await withSoftDelete(prisma.product, id, org.id)
  await logAudit({
    action: "deleted",
    entity: "Material",
    entityId: id,
    message: `Material "${material.name}" deleted`,
    organizationId: org.id,
  })

  return NextResponse.json({ success: true })
})
