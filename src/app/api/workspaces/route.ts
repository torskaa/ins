import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, logAudit } from "@/lib/middleware"
import { requireAuth } from "@/lib/middleware"
import { AppError } from "@/lib/errors"

export const GET = apiHandler(async () => {
  const session = await requireAuth()
  const memberships = await prisma.organizationMember.findMany({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  })
  const workspaces = memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    role: m.role,
    createdAt: m.organization.createdAt,
  }))
  return NextResponse.json(workspaces)
})

export const POST = apiHandler(async (request: Request) => {
  const session = await requireAuth()
  const { name } = await request.json()
  if (!name || typeof name !== "string") throw new AppError("Workspace name is required", 400)

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now()

  const org = await prisma.$transaction(async (tx) => {
    const o = await tx.organization.create({
      data: {
        name,
        slug,
        settings: { create: { currency: "THB", taxRate: 7, dateFormat: "DD/MM/YYYY", timezone: "Asia/Bangkok", lowStockThreshold: 10 } },
      },
    })
    await tx.organizationMember.create({
      data: { userId: session.user.id, organizationId: o.id, role: "owner" },
    })
    return o
  })

  await logAudit({ action: "created", entity: "Organization", entityId: org.id, message: `Workspace "${org.name}" created`, organizationId: org.id })
  return NextResponse.json({ id: org.id, name: org.name, slug: org.slug }, { status: 201 })
})
