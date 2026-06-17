import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params
  const entry = await prisma.journalEntry.findFirst({ where: { id, organizationId: org.id }, include: { lines: { include: { account: { include: { group: true } } } } } })
  if (!entry) return NextResponse.json({ error: "Journal entry not found" }, { status: 404 })
  return NextResponse.json(entry)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("settings", "delete")
  const { org } = await requireOrg()
  const { id } = await params
  const entry = await prisma.journalEntry.findFirst({ where: { id, organizationId: org.id }, include: { lines: true } })
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 })
  for (const line of entry.lines) {
    if (line.debit > 0) await prisma.chartOfAccount.update({ where: { id: line.accountId }, data: { currentBalance: { decrement: line.debit } } })
    if (line.credit > 0) await prisma.chartOfAccount.update({ where: { id: line.accountId }, data: { currentBalance: { increment: line.credit } } })
  }
  await prisma.journalEntry.delete({ where: { id } })
  return NextResponse.json({ success: true })
})
