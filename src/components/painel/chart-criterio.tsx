import { Label, Pie, PieChart } from "recharts"

import { EstadoCarregamento } from "@/components/painel/estado-carregamento"
import { formatadorTooltip } from "@/components/painel/tooltip-valor"
import { Ajuda } from "@/components/painel/ajuda"
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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useApi, type Criterio, type LinhaCriterio } from "@/lib/api"
import {
  type Periodo,
  doRecorte,
  formatarDecimal,
  formatarInteiro,
  noPeriodo,
  rotuloPeriodo,
} from "@/lib/dengue"

const ORDEM: Criterio[] = [
  "clinico",
  "laboratorial",
  "investigacao",
  "naoInformado",
]

const chartConfig = {
  clinico: { label: "Clínico-epidemiológico", color: "var(--chart-1)" },
  laboratorial: { label: "Laboratorial", color: "var(--chart-2)" },
  investigacao: { label: "Em investigação", color: "var(--chart-3)" },
  naoInformado: { label: "Não informado", color: "var(--muted-foreground)" },
} satisfies ChartConfig

export function ChartCriterio({
  ano,
  uf,
  recorte,
}: {
  ano: Periodo
  uf: string
  recorte: string
}) {
  const { dados, erro } = useApi<LinhaCriterio[]>("/api/criterio")

  const linhas = doRecorte(dados ?? [], uf).filter((l) => noPeriodo(l.ano, ano))
  const serie = ORDEM.map((criterio) => ({
    criterio,
    casos: linhas
      .filter((l) => l.criterio === criterio)
      .reduce((s, l) => s + l.casos, 0),
    fill: `var(--color-${criterio})`,
  }))
  const total = serie.reduce((s, l) => s + l.casos, 0)
  const percentual = (casos: number) => (total ? (casos / total) * 100 : 0)
  const casosDe = (c: Criterio) =>
    serie.find((s) => s.criterio === c)?.casos ?? 0

  return (
    <Card className="@container/criterio flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <span>
            Critério de confirmação, {recorte}, {rotuloPeriodo(ano)}
          </span>
          <Ajuda
            rotulo="Sobre o critério de confirmação"
            texto="Cada fatia é casos daquele critério ÷ casos prováveis. Clínico-epidemiológico confirma pela ficha, sem exame. Laboratorial usa resultado de exame. Em investigação ainda não fechou o critério. Não informado ficou em branco."
          />
        </CardTitle>
        <CardDescription>
          Casos de cada critério ÷ casos prováveis do período.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center">
        {!dados ? (
          <EstadoCarregamento erro={erro} className="h-60" />
        ) : (
          <div className="flex w-full flex-col items-center gap-6 @md/criterio:flex-row @md/criterio:justify-center">
            <ChartContainer
              config={chartConfig}
              className="aspect-square h-55 w-55 shrink-0"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      nameKey="criterio"
                      formatter={formatadorTooltip(
                        chartConfig,
                        (v) =>
                          `${formatarInteiro(v)} (${formatarDecimal(percentual(v))}%)`
                      )}
                    />
                  }
                />
                <Pie
                  data={serie}
                  dataKey="casos"
                  nameKey="criterio"
                  innerRadius={68}
                  outerRadius={104}
                  strokeWidth={2}
                  stroke="var(--card)"
                >
                  <Label
                    content={({ viewBox }) => {
                      if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox))
                        return null
                      const cx = viewBox.cx ?? 0
                      const cy = viewBox.cy ?? 0
                      return (
                        <text
                          x={cx}
                          y={cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={cx}
                            y={cy - 6}
                            className="fill-foreground text-xl font-bold"
                          >
                            {formatarInteiro(total)}
                          </tspan>
                          <tspan
                            x={cx}
                            y={cy + 16}
                            className="fill-muted-foreground text-xs"
                          >
                            casos prováveis
                          </tspan>
                        </text>
                      )
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="grid w-full max-w-sm gap-2.5 text-sm">
              {serie.map((s) => (
                <li key={s.criterio} className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-xs"
                    style={{ background: chartConfig[s.criterio].color }}
                  />
                  <span className="truncate text-muted-foreground">
                    {chartConfig[s.criterio].label}
                  </span>
                  <span className="ml-auto font-medium tabular-nums">
                    {formatarDecimal(percentual(s.casos))}%
                  </span>
                  <span className="w-16 text-right text-muted-foreground tabular-nums">
                    {formatarInteiro(s.casos)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      {dados && (
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="font-medium">
            {formatarDecimal(percentual(casosDe("laboratorial")))}% confirmados
            por laboratório
          </div>
          <div className="text-muted-foreground">
            {formatarDecimal(percentual(casosDe("naoInformado")))}% sem critério
            na ficha. Clínico-epidemiológico confirma sem exame; laboratorial
            usa exame.
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
