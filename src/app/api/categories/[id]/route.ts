import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit, withSoftDelete } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params

  const category = await prisma.category.findFirst({
    where: { id, organizationId: org.id, deletedAt: null },
    include: {
      _count: { select: { products: true } },
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true } },
    },
  })
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 })

  return NextResponse.json(category)
})

export const PUT = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("categories", "update")
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      slug: body.name?.toLowerCase().replace(/\s+/g, "-"),
      parentId: body.parentId || null,
    },
  })

  await logAudit({ action: "updated", entity: "Category", entityId: id, message: `Category "${category.name}" updated`, organizationId: org.id })
  return NextResponse.json(category)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("categories", "delete")
  const { org } = await requireOrg()
  const { id } = await params
  const category = await withSoftDelete(prisma.category, id, org.id)
  await logAudit({ action: "deleted", entity: "Category", entityId: id, message: `Category "${category.name}" deleted`, organizationId: org.id })
  return NextResponse.json({ success: true })
})
