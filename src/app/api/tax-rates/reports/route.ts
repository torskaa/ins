import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()
  const { searchParams } = new URL(request.url)
  const period = searchParams.get("period") || "monthly"
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1))

  const startDate = period === "yearly" ? new Date(year, 0, 1) : new Date(year, month - 1, 1)
  const endDate = period === "yearly" ? new Date(year, 11, 31) : new Date(year, month, 0)

  const invoices = await prisma.invoice.findMany({
    where: { organizationId: org.id, createdAt: { gte: startDate, lte: endDate } },
    select: { number: true, subtotal: true, tax: true, total: true, status: true, createdAt: true, customer: { select: { name: true, taxId: true } } },
  })

  const taxRates = await prisma.taxRate.findMany({ where: { organizationId: org.id, type: "vat", isActive: true } })

  const totalSales = invoices.filter(i => i.status !== "cancelled").reduce((s, i) => s + i.subtotal, 0)
  const totalVat = invoices.filter(i => i.status !== "cancelled").reduce((s, i) => s + i.tax, 0)
  const totalInvoices = invoices.length

  return NextResponse.json({ period, year, month, startDate, endDate, taxRates, invoices, totalSales, totalVat, totalInvoices })
})
