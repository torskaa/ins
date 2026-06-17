import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrg, apiHandler, requirePermission } from "@/lib/middleware"
import { calculateFIFOCost, calculateWeightedAverage, snapshotCosts, recordLotReceipt } from "@/lib/costing"
import { validate, lotSchema } from "@/lib/validation"

export const GET = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get("productId")
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })
  const wac = await calculateWeightedAverage(productId, org.id)
  return NextResponse.json(wac)
})

export const POST = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()
  await requirePermission("products", "update")
  const body = await request.json()

  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  if (action === "fifo") {
    const result = await calculateFIFOCost(body.productId, body.quantity, org.id)
    return NextResponse.json(result)
  }

  if (action === "snapshot") {
    await snapshotCosts(body.orderId, org.id)
    return NextResponse.json({ success: true })
  }

  if (action === "receive-lot") {
    const data = validate(lotSchema, body)
    const lot = await recordLotReceipt({
      ...data,
      receivedDate: data.receivedDate ? new Date(data.receivedDate) : undefined,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
    }, org.id)
    await prisma.product.update({
      where: { id: data.productId },
      data: { stock: { increment: data.quantity } },
    })
    return NextResponse.json(lot)
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
})
