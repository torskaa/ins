import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()
  const notifications = await prisma.notification.findMany({
    where: { organizationId: org.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  return NextResponse.json(notifications)
})

export const PUT = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()
  const body = await request.json()
  const { ids, action } = body
  if (action === "markAllRead") {
    await prisma.notification.updateMany({
      where: { organizationId: org.id, read: false, deletedAt: null },
      data: { read: true },
    })
    return NextResponse.json({ success: true })
  }
  if (action === "markRead" && Array.isArray(ids)) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, organizationId: org.id },
      data: { read: true },
    })
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
})
