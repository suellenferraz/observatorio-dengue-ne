import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

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
import { type Periodo, type TotalAno, formatarInteiro } from "@/lib/dengue"

const PRIMEIRO_ANO = 2014

const chartConfig = {
  alarme: { label: "Sinais de alarme", color: "var(--chart-1)" },
  graves: { label: "Dengue grave", color: "var(--chart-2)" },
} satisfies ChartConfig

const compacto = new Intl.NumberFormat("pt-BR", { notation: "compact" })

export function ChartGravidade({
  totais,
  ano,
  recorte,
}: {
  totais: TotalAno[]
  ano: Periodo
  recorte: string
}) {
  const dados = totais
    .filter((t) => t.ano >= PRIMEIRO_ANO)
    .map((t) => ({
      ano: t.ano,
      alarme: t.alarme,
      graves: t.graves,
      obitos: t.obitos,
    }))
  const selecionado =
    typeof ano === "number" && ano >= PRIMEIRO_ANO ? ano : null
  const opacidade = (a: number) =>
    selecionado !== null && a !== selecionado ? 0.45 : 1
  const doResumo = dados.filter(
    (d) => selecionado === null || d.ano === selecionado
  )
  const resumo = {
    rotulo: selecionado === null ? `${PRIMEIRO_ANO}–2025` : String(selecionado),
    alarme: doResumo.reduce((s, d) => s + d.alarme + d.graves, 0),
    obitos: doResumo.reduce((s, d) => s + d.obitos, 0),
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <span>Casos com sinais de alarme e graves, {recorte}</span>
          <Ajuda
            rotulo="Sobre sinais de alarme e dengue grave"
            texto="As barras empilham a classificação do SINAN a partir de 2014: sinais de alarme e dengue grave. O óbito vem do campo evolução e não entra na altura da barra. Antes de 2014 a ficha usava outra classificação, por isso a série começa em 2014."
          />
        </CardTitle>
        <CardDescription>
          Classificação do SINAN de {PRIMEIRO_ANO} a 2025. O óbito não entra na
          barra.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-75 w-full"
        >
          <BarChart data={dados} margin={{ left: 0, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="ano"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v) => compacto.format(Number(v))}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={formatadorTooltip(chartConfig, formatarInteiro)}
                />
              }
            />
            <Bar
              dataKey="alarme"
              stackId="g"
              fill="var(--color-alarme)"
              radius={[0, 0, 4, 4]}
            >
              {dados.map((d) => (
                <Cell key={d.ano} fillOpacity={opacidade(d.ano)} />
              ))}
            </Bar>
            <Bar
              dataKey="graves"
              stackId="g"
              fill="var(--color-graves)"
              radius={[4, 4, 0, 0]}
            >
              {dados.map((d) => (
                <Cell key={d.ano} fillOpacity={opacidade(d.ano)} />
              ))}
            </Bar>
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <div className="font-medium">
          {resumo.rotulo}: {formatarInteiro(resumo.alarme)} casos com alarme ou
          graves e {formatarInteiro(resumo.obitos)} óbitos
        </div>
        <div className="text-muted-foreground">
          O óbito é outra informação da ficha e não entra na altura da barra.
          Antes de {PRIMEIRO_ANO} a classificação era outra e a série não é
          comparável.
        </div>
      </CardFooter>
    </Card>
  )
}
