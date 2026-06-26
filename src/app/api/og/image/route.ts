import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 })

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get("content-type") || "image/png"
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 })
  }
}
