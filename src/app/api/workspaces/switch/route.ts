import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler } from "@/lib/middleware"
import { requireAuth } from "@/lib/middleware"
import { AppError } from "@/lib/errors"

export const POST = apiHandler(async (request: Request) => {
  const session = await requireAuth()
  const { organizationId } = await request.json()
  if (!organizationId) throw new AppError("organizationId is required", 400)

  const member = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id, organizationId },
    include: { organization: true },
  })
  if (!member) throw new AppError("Workspace not found", 404)

  return NextResponse.json({
    id: member.organization.id,
    name: member.organization.name,
    slug: member.organization.slug,
    role: member.role,
  })
})
