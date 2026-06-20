import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler } from "@/lib/middleware"

export const GET = apiHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const movement = await prisma.stockMovement.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      warehouse: { select: { id: true, name: true } },
      lot: { select: { id: true, number: true } },
      delivery: { select: { id: true, number: true } },
    },
  })
  if (!movement) {
    return NextResponse.json({ success: false, error: "Stock movement not found" }, { status: 404 })
  }
  return NextResponse.json({ success: true, data: movement })
})
