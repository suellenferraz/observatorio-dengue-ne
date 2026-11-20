import { attachDatabasePool } from "@vercel/functions"
import pg from "pg"

import { ANO_FIM, ANO_INICIO } from "../src/lib/anos.ts"
import { CODIGOS_CAPITAIS } from "../src/lib/capitais.ts"

import { consultas } from "./consultas.ts"

const pool = process.env.DATABASE_URL
  ? new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new pg.Pool({ max: 5 })

if (process.env.DATABASE_URL) attachDatabasePool(pool)

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

export async function tratarApi(
  metodo: string,
  url: URL
): Promise<{ status: number; corpo: unknown } | null> {
  if (!url.pathname.startsWith("/api")) return null
  if (metodo !== "GET") {
    return { status: 404, corpo: { erro: "rota não encontrada" } }
  }

  if (url.pathname === "/api/saude") {
    try {
      await pool.query("select 1")
      return { status: 200, corpo: { ok: true } }
    } catch (erro) {
      console.error(erro)
      return { status: 500, corpo: { erro: "falha ao consultar o banco" } }
    }
  }

  const rota = rotas[url.pathname]
  if (!rota) return { status: 404, corpo: { erro: "rota não encontrada" } }

  try {
    const resultado = rota(url)
    if (resultado === null) {
      return {
        status: 400,
        corpo: {
          erro: `informe ?ano= entre ${ANO_INICIO} e ${ANO_FIM}, ou ?ano=todos`,
        },
      }
    }
    return { status: 200, corpo: await resultado }
  } catch (erro) {
    console.error(erro)
    return { status: 500, corpo: { erro: "falha ao consultar o banco" } }
  }
}
