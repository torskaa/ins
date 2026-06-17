import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { AppError, UnauthorizedError, handleApiError } from "@/lib/errors"

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new UnauthorizedError()

    const body = await request.json()
    const { currentPassword, newPassword } = body
    if (!currentPassword || !newPassword) throw new AppError("Current and new password required", 400)
    if (newPassword.length < 6) throw new AppError("New password must be at least 6 characters", 400)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    })
    if (!user?.passwordHash) throw new AppError("No password set", 400)

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) throw new AppError("Current password is incorrect", 400)

    const newHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash: newHash } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
