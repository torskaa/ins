import { healthCheck } from "@/lib/infrastructure"

export const GET = async () => {
  const result = await healthCheck()
  return Response.json(result, {
    status: result.status === "healthy" ? 200 : 503,
  })
}
