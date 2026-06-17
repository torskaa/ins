import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "50")
  const skip = (page - 1) * limit
  const [entries, total] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { organizationId: org.id },
      orderBy: { date: "desc" },
      skip, take: limit,
      include: { lines: { include: { account: true } } },
    }),
    prisma.journalEntry.count({ where: { organizationId: org.id } }),
  ])
  return NextResponse.json({ entries, total, page, totalPages: Math.ceil(total / limit) })
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("settings", "create")
  const { org } = await requireOrg()
  const body = await request.json()
  let totalDebit = 0, totalCredit = 0
  for (const line of body.lines) {
    totalDebit += line.debit || 0
    totalCredit += line.credit || 0
  }
  if (Math.abs(totalDebit - totalCredit) > 0.01) return NextResponse.json({ error: "Debit and credit must balance" }, { status: 400 })
  const entry = await prisma.journalEntry.create({
    data: {
      number: body.number || `JE-${Date.now()}`,
      date: new Date(body.date) || new Date(),
      description: body.description,
      referenceType: body.referenceType,
      referenceId: body.referenceId,
      totalDebit, totalCredit,
      status: "posted",
      organizationId: org.id,
      lines: { create: body.lines.map((l: any) => ({ accountId: l.accountId, debit: l.debit || 0, credit: l.credit || 0, description: l.description })) },
    },
    include: { lines: { include: { account: true } } },
  })
  for (const line of body.lines) {
    if (line.debit > 0) await prisma.chartOfAccount.update({ where: { id: line.accountId }, data: { currentBalance: { increment: line.debit } } })
    if (line.credit > 0) await prisma.chartOfAccount.update({ where: { id: line.accountId }, data: { currentBalance: { decrement: line.credit } } })
  }
  await logAudit({ action: "created", entity: "JournalEntry", entityId: entry.id, message: `Journal entry #${entry.number} posted`, organizationId: org.id })
  return NextResponse.json(entry)
})
