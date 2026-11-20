import { tratarApi } from "../server/api.ts"

export const maxDuration = 60

export async function GET(request: Request) {
  const resposta = await tratarApi("GET", new URL(request.url))
  const status = resposta?.status ?? 404
  const corpo = resposta?.corpo ?? { erro: "rota não encontrada" }
  return Response.json(corpo, { status })
}
