import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()
  const projects = await prisma.project.findMany({
    where: { organizationId: org.id, deletedAt: null },
    include: { _count: { select: { tasks: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(projects)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("settings", "create")
  const { org } = await requireOrg()
  const body = await request.json()
  const project = await prisma.project.create({
    data: { name: body.name, description: body.description, priority: body.priority || "medium", startDate: body.startDate ? new Date(body.startDate) : null, dueDate: body.dueDate ? new Date(body.dueDate) : null, budget: parseFloat(body.budget) || 0, organizationId: org.id },
  })
  await logAudit({ action: "created", entity: "Project", entityId: project.id, message: `Project "${project.name}" created`, organizationId: org.id })
  return NextResponse.json(project)
})
