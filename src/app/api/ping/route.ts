export const GET = () => {
  return new Response(JSON.stringify({ hello: "world" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
}
