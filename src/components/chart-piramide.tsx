import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

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
import { useApi, type LinhaPerfil } from "@/lib/api"
import {
  type Periodo,
  doRecorte,
  formatarDecimal,
  noPeriodo,
  rotuloPeriodo,
} from "@/lib/dengue"

const FAIXAS = [
  "70+",
  "60-69",
  "50-59",
  "40-49",
  "30-39",
  "20-29",
  "10-19",
  "0-9",
]

const chartConfig = {
  feminino: { label: "Feminino", color: "var(--chart-1)" },
  masculino: { label: "Masculino", color: "var(--chart-2)" },
} satisfies ChartConfig

export function ChartPiramide({
  ano,
  uf,
  recorte,
}: {
  ano: Periodo
  uf: string
  recorte: string
}) {
  const { dados, erro } = useApi<LinhaPerfil[]>("/api/perfil")

  const linhas = doRecorte(dados ?? [], uf).filter((l) => noPeriodo(l.ano, ano))
  const total = linhas.reduce((s, l) => s + l.casos, 0) || 1
  const serie = FAIXAS.map((faixa) => {
    const soma = (sexo: "F" | "M") =>
      linhas
        .filter((l) => l.faixa === faixa && l.sexo === sexo)
        .reduce((s, l) => s + l.casos, 0)
    return {
      faixa: faixa.replace("-", "–"),
      feminino: Math.round((soma("F") / total) * 1000) / 10,
      masculino: -Math.round((soma("M") / total) * 1000) / 10,
    }
  })
  const mulheres = serie.reduce((s, l) => s + l.feminino, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Faixa etária e sexo, {recorte}, {rotuloPeriodo(ano)}
        </CardTitle>
        <CardDescription>
          % dos casos prováveis com idade e sexo informados
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!dados ? (
          <EstadoCarregamento erro={erro} className="h-[300px]" />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <BarChart
              data={serie}
              layout="vertical"
              stackOffset="sign"
              margin={{ left: 0, right: 8 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="faixa"
                type="category"
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  `${formatarDecimal(Math.abs(Number(v)))}%`
                }
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={formatadorTooltip(
                      chartConfig,
                      (v) => `${formatarDecimal(Math.abs(v))}%`
                    )}
                  />
                }
              />
              <Bar
                dataKey="masculino"
                stackId="sexo"
                fill="var(--color-masculino)"
                radius={[4, 0, 0, 4]}
              />
              <Bar
                dataKey="feminino"
                stackId="sexo"
                fill="var(--color-feminino)"
                radius={[0, 4, 4, 0]}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      {dados && (
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="font-medium">
            Mulheres: {formatarDecimal(mulheres)}% dos casos
          </div>
          <div className="text-muted-foreground">
            Homens à esquerda, mulheres à direita
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
