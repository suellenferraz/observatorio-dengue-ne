import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { LinhaUfAno } from "@/lib/api"
import {
  LIMITE_ALTA,
  NORDESTE,
  type Periodo,
  formatarDecimal,
  formatarInteiro,
  incidencia,
  noPeriodo,
  rotuloPeriodo,
} from "@/lib/dengue"

const chartConfig = {
  incidencia: { label: "Incidência por 100 mil", color: "var(--chart-1)" },
} satisfies ChartConfig

export function ChartRankingEstados({
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
  const porEstado = new Map<
    string,
    { sigla: string; nome: string; casos: number; populacao: number }
  >()
  for (const l of linhas.filter((l) => noPeriodo(l.ano, ano))) {
    const e = porEstado.get(l.sigla) ?? {
      sigla: l.sigla,
      nome: l.nome,
      casos: 0,
      populacao: 0,
    }
    e.casos += l.casos
    e.populacao += l.populacao
    porEstado.set(l.sigla, e)
  }
  const dados = [...porEstado.values()]
    .map((e) => ({
      sigla: e.sigla,
      nome: e.nome,
      incidencia: Math.round(incidencia(e.casos, e.populacao) * 10) / 10,
    }))
    .sort((a, b) => b.incidencia - a.incidencia)
  const maior = dados[0]
  const menor = dados[dados.length - 1]

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {typeof ano === "number"
            ? `Incidência por estado em ${ano}`
            : `Incidência média anual por estado, ${rotuloPeriodo(ano)}`}
        </CardTitle>
        <CardDescription>
          Casos prováveis por 100 mil habitantes. Clique num estado para
          filtrar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <BarChart
            data={dados}
            layout="vertical"
            margin={{ left: 0, right: 48 }}
          >
            <YAxis
              dataKey="sigla"
              type="category"
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <XAxis type="number" dataKey="incidencia" hide />
            <ReferenceLine
              x={LIMITE_ALTA}
              strokeDasharray="4 4"
              className="stroke-muted-foreground/50"
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.nome}
                  formatter={formatadorTooltip(chartConfig, formatarDecimal)}
                />
              }
            />
            <Bar
              dataKey="incidencia"
              fill="var(--color-incidencia)"
              radius={4}
              className="cursor-pointer"
              onClick={(item) => {
                const sigla = (item?.payload as { sigla?: string } | undefined)
                  ?.sigla
                if (sigla) onUf(sigla === uf ? NORDESTE : sigla)
              }}
            >
              {dados.map((d) => (
                <Cell
                  key={d.sigla}
                  fillOpacity={uf === NORDESTE || uf === d.sigla ? 1 : 0.35}
                />
              ))}
              <LabelList
                dataKey="incidencia"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                formatter={(v) => formatarInteiro(Number(v))}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      {maior && menor && (
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="font-medium">
            {maior.nome} tem{" "}
            {formatarDecimal(
              maior.incidencia / Math.max(menor.incidencia, 0.1)
            )}
            × a incidência de {menor.nome}
          </div>
          <div className="text-muted-foreground">
            Linha tracejada: nível alto ({LIMITE_ALTA} por 100 mil)
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
