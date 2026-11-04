import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"
import type { ReactNode } from "react"

import { EstadoCarregamento } from "@/components/estado-carregamento"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useApi, type LinhaMunicipio, type LinhaUfAno } from "@/lib/api"
import {
  LIMITE_ALTA,
  NORDESTE,
  TODOS,
  type Periodo,
  type TotalAno,
  doRecorte,
  formatarDecimal,
  formatarInteiro,
  formatarPercentual,
  incidencia,
  nivel,
  rotuloPeriodo,
  totalDoPeriodo,
  variacao,
} from "@/lib/dengue"

type Props = {
  ano: Periodo
  uf: string
  totais: TotalAno[]
  linhas: LinhaUfAno[]
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
}: {
  titulo: string
  valor: ReactNode
  acao?: ReactNode
  destaque: ReactNode
  detalhe: ReactNode
}) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
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

function AnosEmNivelAlto({ totais }: { totais: TotalAno[] }) {
  const altos = totais.filter((t) => t.incidencia >= LIMITE_ALTA)
  const ultimo = altos[altos.length - 1]
  return (
    <Indicador
      titulo="Anos em nível alto"
      valor={`${altos.length} de ${totais.length}`}
      destaque={ultimo ? `Último: ${ultimo.ano}` : "Nenhum ano"}
      detalhe={`Incidência ≥ ${LIMITE_ALTA} por 100 mil`}
    />
  )
}

function EmNivelAlto({
  ano,
  uf,
  linhas,
}: {
  ano: number
  uf: string
  linhas: LinhaUfAno[]
}) {
  const municipios = useApi<LinhaMunicipio[]>(`/api/municipios?ano=${ano}`)

  if (uf === NORDESTE) {
    const estados = linhas.filter((l) => l.ano === ano)
    const altos = estados
      .filter((l) => incidencia(l.casos, l.populacao) >= LIMITE_ALTA)
      .map((l) => l.sigla)
    return (
      <Indicador
        titulo="Estados em nível alto"
        valor={`${altos.length} de ${estados.length}`}
        destaque={altos.length ? altos.join(", ") : "Nenhum estado"}
        detalhe={`Incidência ≥ ${LIMITE_ALTA} por 100 mil`}
      />
    )
  }

  const doEstado = doRecorte(municipios.dados ?? [], uf)
  const altos = doEstado.filter(
    (m) => incidencia(m.casos, m.pessoasAno) >= LIMITE_ALTA
  )
  return (
    <Indicador
      titulo="Municípios em nível alto"
      valor={municipios.dados ? `${altos.length} de ${doEstado.length}` : "…"}
      destaque={
        municipios.dados
          ? `${formatarDecimal((altos.length / Math.max(doEstado.length, 1)) * 100)}% dos municípios`
          : "Carregando"
      }
      detalhe={`Incidência ≥ ${LIMITE_ALTA} por 100 mil`}
    />
  )
}

export function SectionCards({ ano, uf, totais, linhas }: Props) {
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
          <EstadoCarregamento key={i} className="h-[150px]" />
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
                ? "Por 100 mil habitantes, ao ano"
                : comparacao(formatarDecimal(anterior?.incidencia ?? 0))
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
          />
          {ano === TODOS ? (
            <AnosEmNivelAlto totais={totais} />
          ) : (
            <EmNivelAlto ano={ano} uf={uf} linhas={linhas} />
          )}
        </>
      )}
    </div>
  )
}
