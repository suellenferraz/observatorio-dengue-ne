import { createServer } from "node:http"
import pg from "pg"

import { ANO_FIM, ANO_INICIO, consultas } from "./consultas.ts"

const pool = new pg.Pool({ max: 5 })
const cache = new Map<string, Promise<unknown[]>>()

function consultar(chave: string, sql: string, params: unknown[]) {
  const emCache = cache.get(chave)
  if (emCache) return emCache
  const promessa = pool.query(sql, params).then((r) => r.rows)
  promessa.catch(() => cache.delete(chave))
  cache.set(chave, promessa)
  return promessa
}

function periodo(valor: string | null): [number, number] | null {
  if (valor === "todos") return [ANO_INICIO, ANO_FIM]
  const ano = Number(valor)
  return Number.isInteger(ano) && ano >= ANO_INICIO && ano <= ANO_FIM
    ? [ano, ano]
    : null
}

const rotas: Record<string, (url: URL) => Promise<unknown[]> | null> = {
  "/api/uf-ano": () =>
    consultar("uf-ano", consultas.ufAno, [ANO_INICIO, ANO_FIM]),
  "/api/sazonalidade": () =>
    consultar("sazonalidade", consultas.sazonalidade, [ANO_INICIO, ANO_FIM]),
  "/api/perfil": () =>
    consultar("perfil", consultas.perfil, [ANO_INICIO, ANO_FIM]),
  "/api/criterio": () =>
    consultar("criterio", consultas.criterio, [ANO_INICIO, ANO_FIM]),
  "/api/municipios": (url) => {
    const intervalo = periodo(url.searchParams.get("ano"))
    return intervalo === null
      ? null
      : consultar(
          `municipios-${intervalo.join("-")}`,
          consultas.municipios,
          intervalo
        )
  },
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost")
  const rota = req.method === "GET" ? rotas[url.pathname] : undefined
  const responder = (status: number, corpo: unknown) => {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" })
    res.end(JSON.stringify(corpo))
  }

  if (!rota) return responder(404, { erro: "rota não encontrada" })

  try {
    const resultado = rota(url)
    if (resultado === null) {
      return responder(400, {
        erro: `informe ?ano= entre ${ANO_INICIO} e ${ANO_FIM}, ou ?ano=todos`,
      })
    }
    responder(200, await resultado)
  } catch (erro) {
    console.error(erro)
    responder(500, { erro: "falha ao consultar o banco" })
  }
})

const porta = Number(process.env.API_PORT ?? 3001)
servidor.listen(porta, () => {
  console.log(`API em http://localhost:${porta}`)
})
