import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

import { EstadoCarregamento } from "@/components/estado-carregamento"
import { formatadorTooltip } from "@/components/tooltip-valor"
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
      label: geral ? "Média 2000–2025" : String(ano),
      color: "var(--chart-1)",
    },
    historico: { label: "Média 2000–2025", color: "var(--chart-2)" },
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
  }))
  const mesPico = doAno.indexOf(Math.max(...doAno))
  const marAMai = historico[2] + historico[3] + historico[4]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sazonalidade, {recorte}</CardTitle>
        <CardDescription>
          % dos casos por mês dos primeiros sintomas
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        {!dados ? (
          <EstadoCarregamento erro={erro} className="h-[300px]" />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[300px] w-full"
          >
            <RadarChart data={serie}>
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
              <PolarAngleAxis dataKey="mes" />
              <PolarGrid />
              {!geral && (
                <Radar
                  dataKey="historico"
                  fill="var(--color-historico)"
                  fillOpacity={0.15}
                  stroke="var(--color-historico)"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                />
              )}
              <Radar
                dataKey="ano"
                fill="var(--color-ano)"
                fillOpacity={0.45}
                stroke="var(--color-ano)"
                strokeWidth={2}
              />
              {!geral && <ChartLegend content={<ChartLegendContent />} />}
            </RadarChart>
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
            Na média histórica, março a maio concentram{" "}
            {formatarDecimal(marAMai)}%
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
