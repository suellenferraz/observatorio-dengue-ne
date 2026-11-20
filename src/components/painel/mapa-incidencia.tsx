import { useRef, useState, type MouseEvent } from "react"
import { cn } from "cn"

import { Ajuda } from "@/components/painel/ajuda"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { LinhaUfAno } from "@/lib/api"
import {
  NORDESTE,
  type Periodo,
  formatarDecimal,
  formatarInteiro,
  incidencia,
  noPeriodo,
  rotuloPeriodo,
} from "@/lib/dengue"
import {
  ESTADOS_NORDESTE,
  MAPA_ALTURA,
  MAPA_LARGURA,
} from "@/lib/nordeste-mapa"

const TETO = 1600
const PASSO = 400
const MARCAS = [0, 800, TETO]
const FAIXAS = [0, 400, 800, 1200]

function faixaDo(valor: number) {
  return Math.min(FAIXAS.length - 1, Math.floor(Math.min(valor, TETO) / PASSO))
}
const CORES: [number, string][] = [
  [0, "var(--muted-foreground)"],
  [400, "var(--chart-3)"],
  [800, "var(--chart-1)"],
  [1200, "var(--chart-2)"],
  [TETO, "var(--chart-2)"],
]

function cor(valor: number) {
  const limitado = Math.min(Math.max(valor, 0), TETO)
  let indice = 0
  while (indice < CORES.length - 2 && limitado > CORES[indice + 1][0]) {
    indice += 1
  }
  const [inicio, corInicio] = CORES[indice]
  const [fim, corFim] = CORES[indice + 1]
  const trecho = fim === inicio ? 1 : (limitado - inicio) / (fim - inicio)
  const parte = Math.round(trecho * 100)
  return `color-mix(in oklab, ${corFim} ${parte}%, ${corInicio})`
}

export function MapaIncidencia({
  linhas,
  ano,
  uf,
  onUf,
}: {
  linhas: LinhaUfAno[]
  ano: Periodo
  uf: string
  onUf: (uf: string) => void
}) {
  const areaRef = useRef<HTMLDivElement>(null)
  const [faixa, setFaixa] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{
    nome: string
    x: number
    y: number
  } | null>(null)
  const porEstado = new Map<
    string,
    { nome: string; incidencia: number }
  >()
  const acumulado = new Map<
    string,
    { nome: string; casos: number; populacao: number }
  >()
  for (const linha of linhas.filter((l) => noPeriodo(l.ano, ano))) {
    const atual = acumulado.get(linha.sigla) ?? {
      nome: linha.nome,
      casos: 0,
      populacao: 0,
    }
    atual.casos += linha.casos
    atual.populacao += linha.populacao
    acumulado.set(linha.sigla, atual)
  }
  for (const [sigla, estado] of acumulado) {
    porEstado.set(sigla, {
      nome: estado.nome,
      incidencia:
        Math.round(incidencia(estado.casos, estado.populacao) * 10) / 10,
    })
  }

  const escolhido = uf === NORDESTE ? undefined : porEstado.get(uf)
  const marcarTooltip = (nome: string, evento: MouseEvent) => {
    const area = areaRef.current?.getBoundingClientRect()
    if (!area) return
    setTooltip({
      nome,
      x: evento.clientX - area.left,
      y: evento.clientY - area.top,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <span>
            {typeof ano === "number"
              ? `Incidência no Nordeste em ${ano}`
              : `Incidência média anual no Nordeste, ${rotuloPeriodo(ano)}`}
          </span>
          <Ajuda
            rotulo="Sobre o mapa de incidência"
            texto="Cada estado é casos do período × 100 mil ÷ soma da população de cada ano. No período completo, isso é a média anual. A escala fica fixa de 0 a 1.600 para um ano continuar comparável ao outro. Acima de 1.600 a cor para no laranja. Clique num estado para filtrar o painel."
          />
        </CardTitle>
        <CardDescription>
          Casos × 100 mil ÷ soma da população de cada ano. Clique num estado
          para filtrar e numa cor da escala para ver só esses estados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-5 md:flex-row md:justify-center md:gap-10">
          <div ref={areaRef} className="relative">
          <svg
            viewBox={`0 0 ${MAPA_LARGURA} ${MAPA_ALTURA}`}
            role="group"
            aria-label={`Mapa da incidência no Nordeste em ${rotuloPeriodo(ano)}`}
            className="h-auto w-full max-w-72 md:h-112 md:w-auto md:max-w-none"
            onMouseLeave={() => setTooltip(null)}
            style={{ aspectRatio: `${MAPA_LARGURA} / ${MAPA_ALTURA}` }}
          >
            {ESTADOS_NORDESTE.map((estado) => {
                const valor = porEstado.get(estado.sigla)?.incidencia ?? 0
                const nome = porEstado.get(estado.sigla)?.nome ?? estado.sigla
                const selecionado = uf === estado.sigla
                const fora =
                  faixa !== null && faixaDo(valor) !== faixa
                return (
                  <g
                    key={estado.sigla}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selecionado}
                    aria-label={`${nome}, ${formatarDecimal(valor)} casos por 100 mil habitantes`}
                    className={cn(
                      "cursor-pointer outline-none focus-visible:[&>path]:stroke-foreground focus-visible:[&>path]:[stroke-width:2.5px]",
                      fora && "opacity-15"
                    )}
                    onMouseDown={(evento) => evento.preventDefault()}
                    onClick={() => onUf(selecionado ? NORDESTE : estado.sigla)}
                    onKeyDown={(evento) => {
                      if (evento.key !== "Enter" && evento.key !== " ") return
                      evento.preventDefault()
                      onUf(selecionado ? NORDESTE : estado.sigla)
                    }}
                    onMouseEnter={(evento) => marcarTooltip(nome, evento)}
                    onMouseMove={(evento) => marcarTooltip(nome, evento)}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <path
                      d={estado.d}
                      fill={cor(valor)}
                      stroke="currentColor"
                      strokeWidth={1}
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      className="text-card transition-colors duration-200"
                    />
                    <text
                      x={estado.x}
                      y={estado.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={
                        estado.sigla === "SE" || estado.sigla === "AL" ? 18 : 22
                      }
                      fontWeight={600}
                      fill="currentColor"
                      stroke="var(--card)"
                      strokeWidth={4}
                      strokeLinejoin="round"
                      paintOrder="stroke"
                      className="pointer-events-none text-foreground"
                    >
                      {estado.sigla}
                    </text>
                  </g>
                )
              })}
            {ESTADOS_NORDESTE.filter((estado) => estado.sigla === uf).map(
              (estado) => (
                <path
                  key={`${estado.sigla}-selecao`}
                  d={estado.d}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  className="pointer-events-none text-foreground"
                />
              )
            )}
          </svg>
          {tooltip && (
            <div
              role="tooltip"
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background"
              style={{ left: tooltip.x, top: tooltip.y - 10 }}
            >
              {tooltip.nome}
            </div>
          )}
          </div>
          <div className="w-full max-w-72 space-y-1 md:w-52">
            <p className="text-sm">
              {escolhido ? (
                <span className="font-medium">
                  {escolhido.nome}: {formatarDecimal(escolhido.incidencia)} por
                  100 mil
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Incidência por 100 mil
                </span>
              )}
            </p>
            <div className="relative pt-2">
              {escolhido && (
                <span
                  className="absolute top-0 size-2.5 -translate-x-1/2 rounded-full border-2 border-foreground bg-background"
                  style={{
                    left: `${(Math.min(escolhido.incidencia, TETO) / TETO) * 100}%`,
                  }}
                />
              )}
              <div
                className="flex h-2.5 overflow-hidden rounded-full"
                role="group"
                aria-label="Escala de 0 a 1.600 casos por 100 mil habitantes, nas cores do critério de confirmação."
              >
                {FAIXAS.map((inicio, indice) => {
                  const fim = indice === FAIXAS.length - 1 ? TETO : inicio + PASSO
                  const ativa = faixa === indice
                  return (
                    <button
                      key={inicio}
                      type="button"
                      aria-pressed={ativa}
                      aria-label={
                        indice === FAIXAS.length - 1
                          ? `${formatarInteiro(inicio)} ou mais por 100 mil`
                          : `${formatarInteiro(inicio)} a ${formatarInteiro(fim)} por 100 mil`
                      }
                      className={cn(
                        "h-full flex-1 cursor-pointer",
                        faixa !== null && !ativa && "opacity-30"
                      )}
                      style={{
                        background: `linear-gradient(to right, ${cor(inicio)}, ${cor(fim)})`,
                      }}
                      onClick={() => setFaixa(ativa ? null : indice)}
                    />
                  )
                })}
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              {MARCAS.map((marca) => (
                <span key={marca}>
                  {marca === TETO
                    ? `${formatarInteiro(marca)}+`
                    : formatarInteiro(marca)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        A cor é a taxa do estado inteiro, nas cores do critério de
        confirmação. Acima de 1.600 por 100 mil ela para no laranja.
      </CardFooter>
    </Card>
  )
}
