"use client"

import { useMemo, useRef, useEffect, useId } from "react"

function generateSmoothPath(points: number[], width: number, height: number) {
 if (!points || points.length < 2) return `M 0 ${height}`
 const xStep = width / (points.length - 1)
 const pathData = points.map((p, i) => {
 const x = i * xStep
 const y = height - (p / 100) * (height * 0.8) - height * 0.1
 return [x, y]
 })
 let path = `M ${pathData[0][0]} ${pathData[0][1]}`
 for (let i = 0; i < pathData.length - 1; i++) {
 const [x1, y1] = pathData[i]
 const [x2, y2] = pathData[i + 1]
 const midX = (x1 + x2) / 2
 path += ` C ${midX},${y1} ${midX},${y2} ${x2},${y2}`
 }
 return path
}

interface SparklineProps {
 data: number[]
 color?: string
 width?: number
 height?: number
}

export function Sparkline({ data, color, width = 150, height = 60 }: SparklineProps) {
 const linePathRef = useRef<SVGPathElement>(null)
 const areaPathRef = useRef<SVGPathElement>(null)

 const isPositive = color === undefined
 const strokeColor = color || "#22C55E"
 const gradientId = useId()

 const linePath = useMemo(() => generateSmoothPath(data, width, height), [data, width, height])
 const areaPath = useMemo(() => {
 if (!linePath.startsWith("M")) return ""
 return `${linePath} L ${width} ${height} L 0 ${height} Z`
 }, [linePath, width, height])

 useEffect(() => {
 const path = linePathRef.current
 const area = areaPathRef.current
 if (!path || !area) return
 const length = path.getTotalLength()
 path.style.transition = "none"
 path.style.strokeDasharray = `${length} ${length}`
 path.style.strokeDashoffset = `${length}`
 area.style.transition = "none"
 area.style.opacity = "0"
 path.getBoundingClientRect()
 path.style.transition = "stroke-dashoffset 0.8s ease-in-out"
 path.style.strokeDashoffset = "0"
 area.style.transition = "opacity 0.8s ease-in-out 0.2s"
 area.style.opacity = "1"
 }, [linePath])

 return (
 <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
 <defs>
 <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor={strokeColor} stopOpacity={isPositive ? 0.4 : 0.35} />
 <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
 </linearGradient>
 </defs>
 <path ref={areaPathRef} d={areaPath} fill={`url(#${gradientId})`} />
 <path
 ref={linePathRef}
 d={linePath}
 fill="none"
 stroke={strokeColor}
 strokeWidth="2.5"
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 </svg>
 )
}
