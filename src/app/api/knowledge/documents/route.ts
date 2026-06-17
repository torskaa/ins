import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg } from "@/lib/middleware"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()
  const docs = await prisma.knowledgeDocument.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(docs)
})

export const POST = apiHandler(async (request: Request) => {
  const { org, userId } = await requireOrg()

  const contentType = request.headers.get("content-type") || ""
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData()
    const name = formData.get("name") as string
    const type = (formData.get("type") as string) || "Other"
    const notes = (formData.get("notes") as string) || ""
    const file = formData.get("file") as File | null

    let filePath = ""
    let fileSize = "0 KB"
    let fileType = "other"

    if (file && file.size > 0) {
      const ext = file.name.split(".").pop()?.toLowerCase() || ""
      const extMap: Record<string, string> = {
        pdf: "pdf", xls: "spreadsheet", xlsx: "spreadsheet",
        csv: "spreadsheet", png: "image", jpg: "image",
        jpeg: "image", gif: "image", webp: "image",
        zip: "archive", rar: "archive", "7z": "archive",
        doc: "doc", docx: "doc",
      }
      fileType = extMap[ext] || "other"

      const uploadsDir = join(process.cwd(), "public", "uploads")
      await mkdir(uploadsDir, { recursive: true })
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
      filePath = `/uploads/${safeName}`
      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(join(uploadsDir, safeName), buffer)

      const kb = file.size / 1024
      fileSize = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`
    }

    const doc = await prisma.knowledgeDocument.create({
      data: {
        name: name || file?.name || "Untitled",
        type,
        fileType,
        size: fileSize,
        filePath,
        uploadedBy: "Admin",
        uploadedAt: new Date().toISOString().split("T")[0],
        notes,
        organizationId: org.id,
      },
    })
    return NextResponse.json(doc)
  }

  const body = await request.json()
  const doc = await prisma.knowledgeDocument.create({
    data: {
      name: body.name || "Untitled",
      type: body.type || "Other",
      fileType: body.fileType || "other",
      size: body.size || "1 KB",
      filePath: body.filePath || body.file || "",
      uploadedBy: "Admin",
      uploadedAt: new Date().toISOString().split("T")[0],
      notes: body.notes || "",
      organizationId: org.id,
    },
  })
  return NextResponse.json(doc)
})
