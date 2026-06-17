import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg } from "@/lib/middleware"

function getWeek(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const year = d.getFullYear()
  const week = Math.floor(
    (d.getTime() - new Date(year, 0, 4).getTime()) / 86400000 / 7 + 1
  )
  return `${year}-W${String(week).padStart(2, "0")}`
}

function linearRegression(values: { weekIndex: number; demand: number }[]) {
  const n = values.length
  if (n < 2) return { slope: 0, intercept: values[0]?.demand ?? 0 }

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (const v of values) {
    sumX += v.weekIndex
    sumY += v.demand
    sumXY += v.weekIndex * v.demand
    sumX2 += v.weekIndex * v.weekIndex
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

export const GET = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get("productId")
  const period = parseInt(searchParams.get("period") || "30")

  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 })
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, organizationId: org.id, deletedAt: null },
  })
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })

  const since = new Date()
  since.setDate(since.getDate() - period)

  const orderItems = await prisma.orderItem.findMany({
    where: {
      productId,
      order: {
        organizationId: org.id,
        status: "delivered",
        deliveredAt: { gte: since },
      },
    },
    include: { order: { select: { deliveredAt: true } } },
  })

  const weekMap = new Map<string, number>()
  for (const item of orderItems) {
    if (!item.order.deliveredAt) continue
    const week = getWeek(item.order.deliveredAt)
    weekMap.set(week, (weekMap.get(week) || 0) + item.quantity)
  }

  const sortedWeeks = Array.from(weekMap.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  )
  const history = sortedWeeks.map(([week, demand]) => ({ week, demand }))
  const regressionInput = sortedWeeks.map(([_, demand], i) => ({
    weekIndex: i,
    demand,
  }))

  const { slope, intercept } = linearRegression(regressionInput)
  const lastIndex = regressionInput.length
  const forecast = Array.from({ length: 4 }, (_, i) => {
    const weekIndex = lastIndex + i
    const predicted = Math.max(0, Math.round(intercept + slope * weekIndex))
    return { week: `forecast-${i + 1}`, predicted }
  })

  const avgWeekly =
    regressionInput.length > 0
      ? Math.round(regressionInput.reduce((s, v) => s + v.demand, 0) / regressionInput.length)
      : 0

  const nextMonthDemand = forecast.reduce((s, f) => s + f.predicted, 0)

  return NextResponse.json({ product, history, forecast, avgWeekly, trend: Math.round(slope * 100) / 100, nextMonthDemand })
})

export const POST = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()
  const body: Record<string, unknown> = await request.json()

  if (body.id) {
    const existing = await prisma.forecastEntry.findFirst({
      where: { id: body.id as string, organizationId: org.id },
    })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const fq = typeof body.forecastQuantity === "string" ? parseInt(body.forecastQuantity) : (body.forecastQuantity as number)
    const aq = typeof body.actualQuantity === "string" ? parseInt(body.actualQuantity) : (body.actualQuantity as number)
    const conf = body.confidence != null ? (typeof body.confidence === "string" ? parseFloat(body.confidence) : (body.confidence as number)) : undefined

    const entry = await prisma.forecastEntry.update({
      where: { id: body.id as string },
      data: {
        forecastQuantity: fq ?? existing.forecastQuantity,
        actualQuantity: aq ?? existing.actualQuantity,
        confidence: conf != null ? conf : existing.confidence,
        notes: body.notes !== undefined ? (body.notes as string) : existing.notes,
      },
    })
    return NextResponse.json(entry)
  }

  const fq = typeof body.forecastQuantity === "string" ? parseInt(body.forecastQuantity) : (body.forecastQuantity as number) || 0
  const aq = typeof body.actualQuantity === "string" ? parseInt(body.actualQuantity) : (body.actualQuantity as number) || 0
  const conf = body.confidence != null ? (typeof body.confidence === "string" ? parseFloat(body.confidence) : (body.confidence as number)) : null

  const entry = await prisma.forecastEntry.create({
    data: {
      productId: body.productId as string,
      date: body.date ? new Date(body.date as string) : new Date(),
      forecastQuantity: fq,
      actualQuantity: aq,
      confidence: conf,
      notes: body.notes as string | undefined,
      organizationId: org.id,
    },
  })

  return NextResponse.json(entry)
})
