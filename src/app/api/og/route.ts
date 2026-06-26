import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 })

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    const html = await res.text()

    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
    const ogDescription = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]
    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]
    const favicon = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i)?.[1]
    const faviconUrl = favicon ? new URL(favicon, url).href : `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`

    return NextResponse.json({
      title: ogTitle || title || null,
      description: ogDescription || null,
      image: ogImage || null,
      favicon: faviconUrl,
    })
  } catch {
    const hostname = new URL(url).hostname
    return NextResponse.json({
      title: hostname,
      description: null,
      image: null,
      favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
    })
  }
}
