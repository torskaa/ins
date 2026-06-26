import { NextRequest, NextResponse } from "next/server"

function extractMeta(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`, "i"),
    new RegExp(`<meta[^>]+(?:property|name)='${name}'[^>]+content='([^']+)'`, "i"),
    new RegExp(`<meta[^>]+content='([^']+)'[^>]+(?:property|name)='${name}'`, "i"),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return match[1]
  }
  return null
}

function absoluteUrl(src: string, base: string): string {
  try {
    return new URL(src, base).href
  } catch {
    return src
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 })

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LinkPreview/1.0)" },
    })
    const buffer = await res.arrayBuffer()
    const decoder = new TextDecoder("utf-8")
    const html = decoder.decode(buffer)

    let ogImage = extractMeta(html, "og:image") || extractMeta(html, "twitter:image")
    if (ogImage) ogImage = absoluteUrl(ogImage, url)

    const ogTitle = extractMeta(html, "og:title")
    const ogDescription = extractMeta(html, "og:description")
    const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]
    const faviconMatch = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i)
    const faviconUrl = faviconMatch
      ? absoluteUrl(faviconMatch[1], url)
      : `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`

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
