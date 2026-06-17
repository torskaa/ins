import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { AppError, handleApiError } from "@/lib/errors"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, orgName } = body
    if (!name || !email || !password || !orgName) {
      throw new AppError("All fields are required", 400)
    }
    if (password.length < 6) {
      throw new AppError("Password must be at least 6 characters", 400)
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw new AppError("Email already registered", 409)

    const passwordHash = await bcrypt.hash(password, 12)

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug: orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now(),
          settings: { create: { currency: "THB", taxRate: 7, dateFormat: "DD/MM/YYYY", timezone: "Asia/Bangkok", lowStockThreshold: 10 } },
        },
      })

      const user = await tx.user.create({
        data: { name, email, passwordHash },
      })

      await tx.organizationMember.create({
        data: { userId: user.id, organizationId: org.id, role: "owner" },
      })

      return { user, org }
    })

    return NextResponse.json({ success: true, org: result.org.name }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
