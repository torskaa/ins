import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  await requirePermission("users", "read")
  const { org } = await requireOrg()
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: org.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(members.map((m) => ({ id: m.user.id, name: m.user.name, email: m.user.email, role: m.role })))
})
