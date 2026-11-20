import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

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
      feminino: -Math.round((soma("F") / total) * 1000) / 10,
      masculino: Math.round((soma("M") / total) * 1000) / 10,
    }
  })
  const mulheres = serie.reduce((s, l) => s + Math.abs(l.feminino), 0)
  const extremo = Math.max(
    ...serie.flatMap((l) => [Math.abs(l.feminino), l.masculino])
  )
  const limite = Math.ceil(extremo * 1.15) || 1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <span>
            Faixa etária e sexo, {recorte}, {rotuloPeriodo(ano)}
          </span>
          <Ajuda
            rotulo="Sobre faixa etária e sexo"
            texto="Cada barra é casos daquela faixa e daquele sexo ÷ casos com idade e sexo informados. Casos sem idade ou sem sexo ficam de fora. As duas barras de uma faixa somam a parcela daquela idade."
          />
        </CardTitle>
        <CardDescription>
          Parcela dos casos com idade e sexo informados. Mulheres à esquerda,
          homens à direita.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!dados ? (
          <EstadoCarregamento erro={erro} className="h-105" />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-105 w-full"
          >
            <BarChart
              data={serie}
              layout="vertical"
              stackOffset="sign"
              barCategoryGap="12%"
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="faixa"
                type="category"
                tickLine={false}
                axisLine={false}
                width={52}
              />
              <XAxis
                type="number"
                domain={[-limite, limite]}
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
                dataKey="feminino"
                stackId="sexo"
                fill="var(--color-feminino)"
                radius={4}
              />
              <Bar
                dataKey="masculino"
                stackId="sexo"
                fill="var(--color-masculino)"
                radius={4}
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
            Mulheres à esquerda e homens à direita. As duas barras de uma faixa
            somam a parcela daquela idade.
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
