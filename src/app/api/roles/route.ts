import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"
import { AppError } from "@/lib/errors"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()
  const roles = await prisma.role.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(roles)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("roles", "create")
  const { org } = await requireOrg()
  const body = await request.json()
  const { name, description, permissions } = body
  if (!name || typeof name !== "string") throw new AppError("Name is required", 400)
  const existing = await prisma.role.findFirst({ where: { name, organizationId: org.id } })
  if (existing) throw new AppError("Role with this name already exists", 409)
  const role = await prisma.role.create({
    data: {
      name,
      description: description || undefined,
      permissions: permissions ? JSON.stringify(permissions) : "{}",
      organizationId: org.id,
    },
  })
  await logAudit({ action: "created", entity: "Role", entityId: role.id, message: `Role "${role.name}" created`, organizationId: org.id })
  return NextResponse.json(role, { status: 201 })
})
