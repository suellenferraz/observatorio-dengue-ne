import type { LinhaUfAno } from "@/lib/api"

export const NORDESTE = "NE"
export const TODOS = "todos"
export const ANO_INICIO = 2000
export const ANO_FIM = 2025
export const ANO_EM_REVISAO = 2025
export const LIMITE_MEDIA = 100
export const LIMITE_ALTA = 300

export const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
]

export type Periodo = number | typeof TODOS

export function noPeriodo(ano: number, periodo: Periodo) {
  return periodo === TODOS || ano === periodo
}

export function rotuloPeriodo(periodo: Periodo) {
  return periodo === TODOS ? `${ANO_INICIO}–${ANO_FIM}` : String(periodo)
}

export type Nivel = "baixa" | "média" | "alta"

export type TotalAno = {
  ano: number
  populacao: number
  casos: number
  confirmados: number
  alarme: number
  graves: number
  obitos: number
  incidencia: number
}

const inteiro = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 })

export function formatarInteiro(valor: number) {
  return inteiro.format(valor)
}

export function formatarDecimal(valor: number) {
  return decimal.format(valor)
}

export function formatarPercentual(valor: number) {
  return `${valor > 0 ? "+" : ""}${decimal.format(valor)}%`
}

export function incidencia(casos: number, populacao: number) {
  return populacao > 0 ? (casos * 100_000) / populacao : 0
}

export function nivel(valor: number): Nivel {
  if (valor >= LIMITE_ALTA) return "alta"
  if (valor >= LIMITE_MEDIA) return "média"
  return "baixa"
}

export function variacao(atual: number, anterior: number | undefined) {
  if (anterior === undefined || anterior === 0) return null
  return ((atual - anterior) / anterior) * 100
}

export function doRecorte<T extends { sigla: string }>(
  linhas: T[],
  uf: string
) {
  return uf === NORDESTE ? linhas : linhas.filter((l) => l.sigla === uf)
}

export function nomeDoRecorte(uf: string, linhas: LinhaUfAno[]) {
  if (uf === NORDESTE) return "Nordeste"
  return linhas.find((l) => l.sigla === uf)?.nome ?? uf
}

export function totaisPorAno(linhas: LinhaUfAno[], uf: string): TotalAno[] {
  const porAno = new Map<number, TotalAno>()
  for (const l of doRecorte(linhas, uf)) {
    const t = porAno.get(l.ano) ?? {
      ano: l.ano,
      populacao: 0,
      casos: 0,
      confirmados: 0,
      alarme: 0,
      graves: 0,
      obitos: 0,
      incidencia: 0,
    }
    t.populacao += l.populacao
    t.casos += l.casos
    t.confirmados += l.confirmados
    t.alarme += l.alarme
    t.graves += l.graves
    t.obitos += l.obitos
    porAno.set(l.ano, t)
  }
  return [...porAno.values()]
    .map((t) => ({ ...t, incidencia: incidencia(t.casos, t.populacao) }))
    .sort((a, b) => a.ano - b.ano)
}

export function totalDoPeriodo(
  totais: TotalAno[],
  periodo: Periodo
): TotalAno | undefined {
  if (periodo !== TODOS) return totais.find((t) => t.ano === periodo)
  if (!totais.length) return undefined
  const soma = totais.reduce(
    (s, t) => ({
      ...s,
      populacao: s.populacao + t.populacao,
      casos: s.casos + t.casos,
      confirmados: s.confirmados + t.confirmados,
      alarme: s.alarme + t.alarme,
      graves: s.graves + t.graves,
      obitos: s.obitos + t.obitos,
    }),
    {
      ano: 0,
      populacao: 0,
      casos: 0,
      confirmados: 0,
      alarme: 0,
      graves: 0,
      obitos: 0,
      incidencia: 0,
    }
  )
  return { ...soma, incidencia: incidencia(soma.casos, soma.populacao) }
}
