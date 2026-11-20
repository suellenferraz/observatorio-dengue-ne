import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises"
import { createServer, type ServerResponse } from "node:http"
import { extname, join, normalize, sep } from "node:path"

import { tratarApi } from "./api.ts"

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
  const resposta = await tratarApi(req.method ?? "GET", url)
  if (resposta) {
    res.writeHead(resposta.status, {
      "Content-Type": "application/json; charset=utf-8",
    })
    res.end(JSON.stringify(resposta.corpo))
    return
  }
  if (req.method === "GET") return servirArquivo(url, res)
  res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" })
  res.end(JSON.stringify({ erro: "rota não encontrada" }))
})

const porta = Number(process.env.API_PORT ?? 3001)
servidor.listen(porta, () => {
  console.log(`API em http://localhost:${porta}`)
})
