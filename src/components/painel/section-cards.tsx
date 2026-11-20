import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Ajuda } from "@/components/painel/ajuda"
import { EstadoCarregamento } from "@/components/painel/estado-carregamento"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useApi, type LinhaInterior } from "@/lib/api"
import {
  CAPITAIS,
  NORDESTE,
  TODOS,
  type Periodo,
  type TotalAno,
  doRecorte,
  formatarDecimal,
  formatarInteiro,
  formatarPercentual,
  nivel,
  noPeriodo,
  parcelaForaDaCapital,
  rotuloPeriodo,
  totalDoPeriodo,
  variacao,
} from "@/lib/dengue"

type Props = {
  ano: Periodo
  uf: string
  totais: TotalAno[]
}

function BadgeVariacao({ valor }: { valor: number | null }) {
  if (valor === null) return null
  const Icone = valor >= 0 ? TrendingUpIcon : TrendingDownIcon
  return (
    <Badge variant="outline">
      <Icone />
      {formatarPercentual(valor)}
    </Badge>
  )
}

function Indicador({
  titulo,
  valor,
  acao,
  destaque,
  detalhe,
  ajuda,
}: {
  titulo: string
  valor: ReactNode
  acao?: ReactNode
  destaque: ReactNode
  detalhe: ReactNode
  ajuda: string
}) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription className="flex items-center gap-1">
          {titulo}
          <Ajuda texto={ajuda} rotulo={`Sobre ${titulo}`} />
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {valor}
        </CardTitle>
        {acao && <CardAction>{acao}</CardAction>}
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 font-medium">{destaque}</div>
        <div className="line-clamp-1 text-muted-foreground">{detalhe}</div>
      </CardFooter>
    </Card>
  )
}

function CasosForaDaCapital({ ano, uf }: { ano: Periodo; uf: string }) {
  const { dados } = useApi<LinhaInterior[]>("/api/interior")
  const nordeste = uf === NORDESTE
  const capital = CAPITAIS[uf]
  const linhas = doRecorte(dados ?? [], uf).filter((l) => noPeriodo(l.ano, ano))
  const casosCapital = linhas.reduce((s, l) => s + l.casosCapital, 0)
  const casosInterior = linhas.reduce((s, l) => s + l.casosInterior, 0)
  const total = casosCapital + casosInterior
  const percentual = parcelaForaDaCapital(casosCapital, casosInterior)
  const percentualCapital = total > 0 ? (casosCapital / total) * 100 : 0
  const fora = casosInterior
  const titulo = nordeste ? "Casos fora das capitais" : "Casos fora da capital"

  return (
    <Indicador
      titulo={titulo}
      valor={dados ? `${formatarDecimal(percentual)}%` : "…"}
      destaque={
        dados ? `${formatarInteiro(fora)} casos no interior` : "Carregando"
      }
      detalhe={
        dados
          ? nordeste
            ? `As nove capitais reúnem ${formatarDecimal(percentualCapital)}%`
            : `${capital?.nome ?? "A capital"} reúne ${formatarDecimal(percentualCapital)}%`
          : "Casos do interior ÷ casos do recorte"
      }
      ajuda={
        nordeste
          ? "Casos prováveis fora das nove capitais, divididos pelo total do recorte. Interior é todo município que não é capital. As capitais são São Luís, Teresina, Fortaleza, Natal, João Pessoa, Recife, Maceió, Aracaju e Salvador."
          : `Casos prováveis fora de ${capital?.nome ?? "a capital"}, divididos pelo total do estado. O restante fica no interior.`
      }
    />
  )
}

export function SectionCards({ ano, uf, totais }: Props) {
  const atual = totalDoPeriodo(totais, ano)
  const anterior =
    ano === TODOS ? undefined : totais.find((t) => t.ano === ano - 1)
  const pico = totais.reduce<TotalAno | undefined>(
    (maior, t) => (!maior || t.incidencia > maior.incidencia ? t : maior),
    undefined
  )
  const periodo = rotuloPeriodo(ano)
  const comparacao = (texto: string) =>
    ano === TODOS
      ? `Média de ${texto} por ano`
      : anterior
        ? `${texto} em ${ano - 1}`
        : "Primeiro ano da série"

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {!atual ? (
        Array.from({ length: 4 }, (_, i) => (
          <EstadoCarregamento key={i} className="h-37.5" />
        ))
      ) : (
        <>
          <Indicador
            titulo={`Casos prováveis, ${periodo}`}
            valor={formatarInteiro(atual.casos)}
            acao={
              <BadgeVariacao valor={variacao(atual.casos, anterior?.casos)} />
            }
            destaque={`${formatarInteiro(atual.confirmados)} confirmados (${formatarDecimal((atual.confirmados / Math.max(atual.casos, 1)) * 100)}%)`}
            detalhe={comparacao(
              formatarInteiro(
                ano === TODOS
                  ? atual.casos / totais.length
                  : (anterior?.casos ?? 0)
              )
            )}
            ajuda="Casos prováveis no período, sem duplicata. Confirmados são os que a ficha marca como confirmados. No período completo, a média divide o total pelo número de anos. A variação compara com o ano anterior."
          />
          <Indicador
            titulo={
              ano === TODOS
                ? "Incidência média anual"
                : "Incidência por 100 mil hab."
            }
            valor={formatarDecimal(atual.incidencia)}
            acao={
              <Badge variant="outline">nível {nivel(atual.incidencia)}</Badge>
            }
            destaque={
              ano === TODOS && pico
                ? `Pico em ${pico.ano}: ${formatarDecimal(pico.incidencia)}`
                : `${formatarInteiro(atual.populacao)} habitantes`
            }
            detalhe={
              ano === TODOS
                ? "Casos ÷ população de cada ano × 100 mil"
                : comparacao(formatarDecimal(anterior?.incidencia ?? 0))
            }
            ajuda={
              ano === TODOS
                ? "Média de casos novos por 100 mil habitantes em cada ano. Conta: (casos do período ÷ anos) ÷ população média × 100 mil. Baixa abaixo de 100, média de 100 a 299 e alta a partir de 300."
                : "Casos daquele ano ÷ população daquele ano × 100 mil. Baixa abaixo de 100, média de 100 a 299 e alta a partir de 300."
            }
          />
          <Indicador
            titulo={`Óbitos por dengue, ${periodo}`}
            valor={formatarInteiro(atual.obitos)}
            acao={
              <BadgeVariacao valor={variacao(atual.obitos, anterior?.obitos)} />
            }
            destaque={`${formatarInteiro(atual.alarme)} com sinais de alarme`}
            detalhe={`${formatarInteiro(atual.graves)} casos graves`}
            ajuda="Óbito é a evolução registrada na ficha. Sinais de alarme e dengue grave são a classificação clínica. Um óbito não se soma a esses casos: são informações diferentes."
          />
          <CasosForaDaCapital ano={ano} uf={uf} />
        </>
      )}
    </div>
  )
}
