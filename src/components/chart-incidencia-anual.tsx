import { useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { formatadorTooltip } from "@/components/tooltip-valor"
import {
  Card,
  CardAction,
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  ANO_EM_REVISAO,
  LIMITE_ALTA,
  LIMITE_MEDIA,
  type Periodo,
  type TotalAno,
  formatarDecimal,
  formatarInteiro,
} from "@/lib/dengue"

type Medida = "incidencia" | "casos"

const chartConfig = {
  incidencia: { label: "Incidência por 100 mil", color: "var(--chart-1)" },
  casos: { label: "Casos prováveis", color: "var(--chart-1)" },
} satisfies ChartConfig

const compacto = new Intl.NumberFormat("pt-BR", { notation: "compact" })

export function ChartIncidenciaAnual({
  totais,
  ano,
  recorte,
  onAno,
}: {
  totais: TotalAno[]
  ano: Periodo
  recorte: string
  onAno: (ano: Periodo) => void
}) {
  const [medida, setMedida] = useState<Medida>("incidencia")
  const dados = totais.map((t) => ({
    ano: t.ano,
    incidencia: Math.round(t.incidencia * 10) / 10,
    casos: t.casos,
  }))
  const pico = totais.reduce<TotalAno | null>(
    (maior, t) => (!maior || t.incidencia > maior.incidencia ? t : maior),
    null
  )
  const anosAltos = totais.filter((t) => t.incidencia >= LIMITE_ALTA).length
  const formatar = medida === "incidencia" ? formatarDecimal : formatarInteiro

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>
          {medida === "incidencia" ? "Incidência" : "Casos prováveis"} por ano,{" "}
          {recorte}
        </CardTitle>
        <CardDescription>
          2000 a 2025. Clique num ano para filtrar o painel.
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={[medida]}
            onValueChange={(valor) => valor[0] && setMedida(valor[0] as Medida)}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="incidencia">Incidência</ToggleGroupItem>
            <ToggleGroupItem value="casos">Casos</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <AreaChart
            data={dados}
            margin={{ left: 0, right: 12, top: 8 }}
            onClick={(estado) => {
              const valor = Number(estado?.activeLabel)
              if (Number.isInteger(valor) && valor > 0) onAno(valor)
            }}
            className="cursor-pointer"
          >
            <defs>
              <linearGradient
                id="preenchimentoSerie"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={`var(--color-${medida})`}
                  stopOpacity={0.6}
                />
                <stop
                  offset="95%"
                  stopColor={`var(--color-${medida})`}
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="ano"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v) => compacto.format(Number(v))}
            />
            {medida === "incidencia" && (
              <>
                <ReferenceLine
                  y={LIMITE_MEDIA}
                  strokeDasharray="4 4"
                  className="stroke-muted-foreground/50"
                  label={{
                    value: "média",
                    position: "insideTopLeft",
                    className: "fill-muted-foreground text-[10px]",
                  }}
                />
                <ReferenceLine
                  y={LIMITE_ALTA}
                  strokeDasharray="4 4"
                  className="stroke-muted-foreground/50"
                  label={{
                    value: "alta",
                    position: "insideTopLeft",
                    className: "fill-muted-foreground text-[10px]",
                  }}
                />
              </>
            )}
            {typeof ano === "number" && (
              <ReferenceLine x={ano} className="stroke-foreground/40" />
            )}
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const a = payload?.[0]?.payload?.ano
                    return a === ANO_EM_REVISAO ? `${a} (sujeito a revisão)` : a
                  }}
                  formatter={formatadorTooltip(chartConfig, formatar)}
                />
              }
            />
            <Area
              dataKey={medida}
              type="monotone"
              fill="url(#preenchimentoSerie)"
              stroke={`var(--color-${medida})`}
              strokeWidth={2}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      {pico && (
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="font-medium">
            Pico em {pico.ano}: {formatarDecimal(pico.incidencia)} por 100 mil
          </div>
          <div className="text-muted-foreground">
            {anosAltos} de {totais.length} anos em nível alto (≥ {LIMITE_ALTA}).
            Linhas tracejadas: limites de {LIMITE_MEDIA} e {LIMITE_ALTA} por 100
            mil.
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
