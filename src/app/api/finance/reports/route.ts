import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()
  const { searchParams } = new URL(request.url)
  const reportType = searchParams.get("type") || "balance-sheet"
  const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : new Date()
  const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : new Date(endDate.getFullYear(), endDate.getMonth(), 1)

  const accounts = await prisma.chartOfAccount.findMany({
    where: { organizationId: org.id, isActive: true },
    include: { group: true },
    orderBy: { code: "asc" },
  })

  if (reportType === "balance-sheet") {
    const assets = accounts.filter(a => a.type === "asset" || a.type === "contra_asset")
    const liabilities = accounts.filter(a => a.type === "liability" || a.type === "contra_liability")
    const equity = accounts.filter(a => a.type === "equity" || a.type === "contra_equity")
    const totalAssets = assets.reduce((s, a) => s + a.currentBalance, 0)
    const totalLiabilities = liabilities.reduce((s, a) => s + a.currentBalance, 0)
    const totalEquity = equity.reduce((s, a) => s + a.currentBalance, 0)
    return NextResponse.json({ reportType, date: endDate, assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity })
  }

  if (reportType === "profit-loss") {
    const revenue = accounts.filter(a => a.type === "revenue")
    const expenses = accounts.filter(a => a.type === "expense")
    const totalRevenue = revenue.reduce((s, a) => s + a.currentBalance, 0)
    const totalExpenses = expenses.reduce((s, a) => s + a.currentBalance, 0)
    const netIncome = totalRevenue - totalExpenses
    return NextResponse.json({ reportType, startDate, endDate, revenue, expenses, totalRevenue, totalExpenses, netIncome })
  }

  if (reportType === "trial-balance") {
    const totalDebit = accounts.reduce((s, a) => s + (a.currentBalance > 0 ? a.currentBalance : 0), 0)
    const totalCredit = accounts.reduce((s, a) => s + (a.currentBalance < 0 ? Math.abs(a.currentBalance) : 0), 0)
    return NextResponse.json({ reportType, date: endDate, accounts: accounts.filter(a => a.currentBalance !== 0), totalDebit, totalCredit })
  }

  const totalRevenue = accounts.filter(a => a.type === "revenue").reduce((s, a) => s + a.currentBalance, 0)
  const totalExpenses = accounts.filter(a => a.type === "expense").reduce((s, a) => s + a.currentBalance, 0)
  const totalAssets = accounts.filter(a => a.type === "asset").reduce((s, a) => s + a.currentBalance, 0)
  const totalLiabilities = accounts.filter(a => a.type === "liability").reduce((s, a) => s + a.currentBalance, 0)
  const totalEquity = accounts.filter(a => a.type === "equity").reduce((s, a) => s + a.currentBalance, 0)

  const entries = await prisma.journalEntry.findMany({
    where: { organizationId: org.id, date: { gte: startDate, lte: endDate } },
    orderBy: { date: "desc" },
    include: { lines: { include: { account: true } } },
  })

  const revenueByMonth: Record<string, number> = {}
  const expenseByMonth: Record<string, number> = {}
  for (const entry of entries) {
    const month = entry.date.toISOString().slice(0, 7)
    for (const line of entry.lines) {
      if (line.account.type === "revenue") revenueByMonth[month] = (revenueByMonth[month] || 0) + line.credit - line.debit
      if (line.account.type === "expense") expenseByMonth[month] = (expenseByMonth[month] || 0) + line.debit - line.credit
    }
  }

  return NextResponse.json({
    reportType: "summary",
    totalRevenue, totalExpenses, netIncome: totalRevenue - totalExpenses,
    totalAssets, totalLiabilities, totalEquity,
    revenueByMonth: Object.entries(revenueByMonth).map(([month, amount]) => ({ month, amount })),
    expenseByMonth: Object.entries(expenseByMonth).map(([month, amount]) => ({ month, amount })),
  })
})
