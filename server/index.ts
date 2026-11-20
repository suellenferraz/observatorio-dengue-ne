import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises"
import { createServer, type ServerResponse } from "node:http"
import { extname, join, normalize, sep } from "node:path"
import pg from "pg"

import { ANO_FIM, ANO_INICIO } from "../src/lib/anos.ts"
import { CODIGOS_CAPITAIS } from "../src/lib/capitais.ts"

import { consultas } from "./consultas.ts"

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
  "/api/interior": () =>
    consultar("interior", consultas.interior, [
      ANO_INICIO,
      ANO_FIM,
      CODIGOS_CAPITAIS,
    ]),
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

const dist = join(import.meta.dirname, "../dist")

const tipos: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
  ".webp": "image/webp",
}

function dentroDaDist(caminho: string) {
  const base = normalize(dist + sep)
  const alvo = normalize(caminho)
  return alvo === normalize(dist) || alvo.startsWith(base)
}

async function servirArquivo(url: URL, res: ServerResponse) {
  const relativo = decodeURIComponent(url.pathname).replace(/^\/+/, "")
  let arquivo = join(dist, relativo)
  if (!dentroDaDist(arquivo)) {
    res.writeHead(403)
    res.end()
    return
  }
  const existe = async (caminho: string) => {
    try {
      return (await stat(caminho)).isFile()
    } catch {
      return false
    }
  }
  try {
    if ((await stat(arquivo)).isDirectory())
      arquivo = join(arquivo, "index.html")
  } catch {
    arquivo = join(dist, "index.html")
  }
  if (!(await existe(arquivo))) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
    res.end("Build ausente. Rode npm run build.")
    return
  }
  res.writeHead(200, {
    "Content-Type": tipos[extname(arquivo)] ?? "application/octet-stream",
  })
  createReadStream(arquivo).pipe(res)
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost")
  const responder = (status: number, corpo: unknown) => {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" })
    res.end(JSON.stringify(corpo))
  }

  if (req.method === "GET" && url.pathname === "/api/saude") {
    try {
      await pool.query("select 1")
      return responder(200, { ok: true })
    } catch (erro) {
      console.error(erro)
      return responder(500, { erro: "falha ao consultar o banco" })
    }
  }

  const rota = req.method === "GET" ? rotas[url.pathname] : undefined
  if (!rota) {
    if (req.method === "GET" && !url.pathname.startsWith("/api")) {
      return servirArquivo(url, res)
    }
    return responder(404, { erro: "rota não encontrada" })
  }

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
