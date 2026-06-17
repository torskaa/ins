import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()
  const settings = await prisma.organizationSetting.findUnique({
    where: { organizationId: org.id },
  })
  return NextResponse.json({
    org: await prisma.organization.findUnique({ where: { id: org.id } }),
    settings,
    onboardingCompleted: settings?.onboardingCompleted ?? false,
  })
})

export const POST = apiHandler(async (request: Request) => {
  const { org, userId } = await requireOrg()
  const body = await request.json()

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      name: body.orgName || undefined,
    },
  })

  await prisma.organizationSetting.upsert({
    where: { organizationId: org.id },
    update: {
      currency: body.currency || undefined,
      taxRate: body.taxRate ? parseFloat(body.taxRate) : undefined,
      timezone: body.timezone || undefined,
      lowStockThreshold: body.lowStockThreshold ? parseInt(body.lowStockThreshold) : undefined,
      onboardingCompleted: true,
    },
    create: {
      organizationId: org.id,
      currency: body.currency || "THB",
      taxRate: body.taxRate ? parseFloat(body.taxRate) : 7,
      timezone: body.timezone || "Asia/Bangkok",
      lowStockThreshold: body.lowStockThreshold ? parseInt(body.lowStockThreshold) : 10,
      onboardingCompleted: true,
    },
  })

  if (body.invites?.length > 0 && process.env.SMTP_HOST) {
    const nodemailer = await import("nodemailer")
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
    for (const email of body.invites) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || "noreply@ins.app",
        to: email,
        subject: `You've been invited to join ${body.orgName || "Ins"}`,
        text: `You've been invited to join ${body.orgName || "Ins"} on Ins ERP. Sign up at ${process.env.NEXTAUTH_URL}/register to get started.`,
      }).catch(() => {})
    }
  }

  return NextResponse.json({ success: true })
})

export const dynamic = "force-dynamic"
