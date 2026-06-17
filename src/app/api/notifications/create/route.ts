import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("settings", "create")
  const { org } = await requireOrg()
  const body = await request.json()
  const notification = await prisma.notification.create({
    data: {
      title: body.title,
      message: body.message || body.title,
      type: body.type || "info",
      userId: body.userId || "",
      organizationId: org.id,
    },
  })
  await logAudit({ action: "created", entity: "Notification", entityId: notification.id, message: `Notification "${notification.title}" sent`, organizationId: org.id })
  return NextResponse.json(notification)
})
