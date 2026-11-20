import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts"

import { Ajuda } from "@/components/painel/ajuda"
import { EstadoCarregamento } from "@/components/painel/estado-carregamento"
import { formatadorTooltip } from "@/components/painel/tooltip-valor"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useApi, type LinhaSazonalidade } from "@/lib/api"
import {
  MESES,
  TODOS,
  type Periodo,
  doRecorte,
  formatarDecimal,
} from "@/lib/dengue"

const MESES_DA_TEMPORADA = new Set([2, 3, 4])

function percentuaisPorMes(linhas: LinhaSazonalidade[]) {
  const porMes = Array.from({ length: 12 }, () => 0)
  for (const l of linhas) porMes[l.mes - 1] += l.casos
  const total = porMes.reduce((a, b) => a + b, 0)
  return porMes.map((v) => (total ? Math.round((v / total) * 1000) / 10 : 0))
}

export function ChartSazonalidade({
  ano,
  uf,
  recorte,
}: {
  ano: Periodo
  uf: string
  recorte: string
}) {
  const { dados, erro } = useApi<LinhaSazonalidade[]>("/api/sazonalidade")
  const geral = ano === TODOS

  const chartConfig = {
    ano: {
      label: geral ? "2000–2025" : String(ano),
      color: "var(--chart-1)",
    },
    historico: { label: "2000–2025", color: "var(--chart-2)" },
  } satisfies ChartConfig

  const linhas = doRecorte(dados ?? [], uf)
  const historico = percentuaisPorMes(linhas)
  const doAno = geral
    ? historico
    : percentuaisPorMes(linhas.filter((l) => l.ano === ano))
  const serie = MESES.map((mes, i) => ({
    mes,
    ano: doAno[i],
    historico: historico[i],
    temporada: MESES_DA_TEMPORADA.has(i),
  }))
  const mesPico = doAno.indexOf(Math.max(...doAno))
  const soma = (valores: number[]) => valores[2] + valores[3] + valores[4]
  const marAMai = soma(historico)
  const marAMaiAno = soma(doAno)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <span>Sazonalidade, {recorte}</span>
          <Ajuda
            rotulo="Sobre a sazonalidade"
            texto="Cada coluna é casos daquele mês ÷ casos com mês do primeiro sintoma informado. Março, abril e maio ficam em destaque. No ano isolado, a linha é essa mesma parcela em 2000–2025."
          />
        </CardTitle>
        <CardDescription>
          Casos do mês ÷ casos com mês do primeiro sintoma informado. Março a
          maio em destaque.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!dados ? (
          <EstadoCarregamento erro={erro} className="h-75" />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-75 w-full"
          >
            <ComposedChart data={serie} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={48}
                domain={[0, "auto"]}
                tickFormatter={(v) => `${formatarDecimal(Number(v))}%`}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={formatadorTooltip(
                      chartConfig,
                      (v) => `${formatarDecimal(v)}%`
                    )}
                  />
                }
              />
              <Bar dataKey="ano" fill="var(--color-ano)" radius={4}>
                {serie.map((d) => (
                  <Cell
                    key={d.mes}
                    fillOpacity={d.temporada ? 1 : 0.4}
                  />
                ))}
              </Bar>
              {!geral && (
                <Line
                  dataKey="historico"
                  stroke="var(--color-historico)"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 3"
                />
              )}
              {!geral && <ChartLegend content={<ChartLegendContent />} />}
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
      {dados && (
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="font-medium">
            Pico {geral ? "histórico" : `de ${ano}`} em {MESES[mesPico]} (
            {formatarDecimal(doAno[mesPico])}% dos casos)
          </div>
          <div className="text-muted-foreground">
            {geral
              ? `Março a maio concentram ${formatarDecimal(marAMai)}% dos casos com mês informado.`
              : `Em ${ano}, março a maio concentram ${formatarDecimal(marAMaiAno)}%. Na série de 2000–2025, ${formatarDecimal(marAMai)}%.`}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
