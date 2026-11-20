import { useState } from "react"
import { ArrowDownIcon, CircleHelpIcon } from "lucide-react"

import { EstadoCarregamento } from "@/components/painel/estado-carregamento"
import { Input } from "@/components/ui/input"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useApi, type LinhaMunicipio } from "@/lib/api"
import {
  type Periodo,
  TODOS,
  ANO_INICIO,
  ANO_FIM,
  POPULACAO_MINIMA,
  doRecorte,
  entraNoRankingDeIncidencia,
  formatarDecimal,
  formatarInteiro,
  incidencia,
  rotuloPeriodo,
} from "@/lib/dengue"

type Ordem = "incidencia" | "casos"

const LIMITE_LINHAS = 15

function semAcento(texto: string) {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
}

function TituloColuna({
  titulo,
  explicacao,
  alinharFim = false,
  ordenada = false,
}: {
  titulo: string
  explicacao: string
  alinharFim?: boolean
  ordenada?: boolean
}) {
  return (
    <TableHead
      className={alinharFim ? "text-right" : undefined}
      aria-sort={ordenada ? "descending" : undefined}
    >
      <span
        className={
          alinharFim
            ? "inline-flex w-full items-center justify-end gap-1"
            : "inline-flex items-center gap-1"
        }
      >
        {titulo}
        {ordenada ? <ArrowDownIcon className="size-3.5" /> : null}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label={`Sobre ${titulo}`}
                className="text-muted-foreground hover:text-foreground"
              />
            }
          >
            <CircleHelpIcon className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent className="max-w-80 text-left text-balance">
            {explicacao}
          </TooltipContent>
        </Tooltip>
      </span>
    </TableHead>
  )
}

export function TabelaMunicipios({
  ano,
  uf,
  recorte,
}: {
  ano: Periodo
  uf: string
  recorte: string
}) {
  const [ordem, setOrdem] = useState<Ordem>("incidencia")
  const [busca, setBusca] = useState("")
  const { dados, erro } = useApi<LinhaMunicipio[]>(`/api/municipios?ano=${ano}`)
  const anos = ano === TODOS ? ANO_FIM - ANO_INICIO + 1 : 1
  const termo = semAcento(busca.trim())

  const municipios = doRecorte(dados ?? [], uf).map((m) => ({
    ...m,
    incidencia: incidencia(m.casos, m.pessoasAno),
    populacaoMedia: m.pessoasAno / anos,
  }))
  const buscando = termo.length > 0
  const ordenaveis = buscando
    ? municipios.filter((m) => semAcento(m.nome).includes(termo))
    : ordem === "incidencia"
      ? municipios.filter((m) => entraNoRankingDeIncidencia(m.populacaoMedia))
      : municipios
  const classificados = [...ordenaveis].sort((a, b) => b[ordem] - a[ordem])
  const linhas = buscando
    ? classificados
    : classificados.slice(0, LIMITE_LINHAS)
  const quantidade = Math.min(LIMITE_LINHAS, ordenaveis.length)
  const rotuloTaxa = ano === TODOS ? "Por 100 mil/ano" : "Por 100 mil"
  const rotuloPopulacao = ano === TODOS ? "População média" : "População"
  const contaTaxa =
    ano === TODOS
      ? `(casos ÷ ${anos}) ÷ população média × 100 mil`
      : "casos ÷ população × 100 mil"
  const faixas =
    "Baixa abaixo de 100, média de 100 a 299 e alta a partir de 300."

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Municípios com mais dengue, {recorte}, {rotuloPeriodo(ano)}
        </CardTitle>
        <CardDescription>
          {buscando
            ? ordenaveis.length === 0
              ? "Nenhum município com esse nome"
              : ordenaveis.length === 1
                ? "1 município com esse nome"
                : `${formatarInteiro(ordenaveis.length)} municípios com esse nome`
            : ordem === "incidencia"
              ? `${quantidade} primeiros em taxa por 100 mil${ano === TODOS ? "/ano" : ""}, entre os ${formatarInteiro(ordenaveis.length)} municípios com ${formatarInteiro(POPULACAO_MINIMA)} habitantes ou mais`
              : `${quantidade} primeiros pelo total de casos, entre ${formatarInteiro(municipios.length)} municípios`}
        </CardDescription>
        <CardAction>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar município"
              aria-label="Buscar município"
              className="w-40"
            />
            <ToggleGroup
              multiple={false}
              value={[ordem]}
              onValueChange={(valor) => valor[0] && setOrdem(valor[0] as Ordem)}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="casos">Casos</ToggleGroupItem>
              <ToggleGroupItem value="incidencia">Incidência</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {!dados ? (
          <EstadoCarregamento erro={erro} />
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TituloColuna
                    titulo="#"
                    explicacao={
                      ordem === "incidencia"
                        ? `Posição pela taxa ${rotuloTaxa}, da maior para a menor.`
                        : "Posição pelo total de casos, do maior para o menor."
                    }
                    alinharFim
                  />
                  <TituloColuna
                    titulo="Município"
                    explicacao="Cidade de residência do caso notificado."
                  />
                  <TituloColuna titulo="UF" explicacao="Estado dessa cidade." />
                  <TituloColuna
                    titulo="Casos"
                    explicacao={
                      ano === TODOS
                        ? `Casos prováveis de ${ANO_INICIO} a ${ANO_FIM}, sem duplicata. Esse total entra na taxa. Quem tem mais casos não tem, necessariamente, a maior taxa.`
                        : "Casos prováveis naquele ano, sem duplicata. Esse total entra na taxa. Quem tem mais casos não tem, necessariamente, a maior taxa."
                    }
                    alinharFim
                    ordenada={ordem === "casos"}
                  />
                  <TituloColuna
                    titulo={rotuloPopulacao}
                    explicacao={
                      ano === TODOS
                        ? `Soma da população de cada ano, de ${ANO_INICIO} a ${ANO_FIM}, dividida por ${anos}. A taxa divide os casos por esse número de habitantes.`
                        : "Habitantes naquele ano. A taxa divide os casos por esse número."
                    }
                    alinharFim
                  />
                  <TituloColuna
                    titulo={rotuloTaxa}
                    explicacao={`Conta: ${contaTaxa}. ${faixas}`}
                    alinharFim
                    ordenada={ordem === "incidencia"}
                  />
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.map((m, i) => (
                  <TableRow key={m.codigo}>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium">{m.nome}</TableCell>
                    <TableCell>{m.sigla}</TableCell>
                    <TableCell
                      className={
                        ordem === "casos"
                          ? "text-right font-medium tabular-nums"
                          : "text-right tabular-nums"
                      }
                    >
                      {formatarInteiro(m.casos)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {anos > 1
                        ? formatarDecimal(m.populacaoMedia)
                        : formatarInteiro(m.populacaoMedia)}
                    </TableCell>
                    <TableCell
                      className={
                        ordem === "incidencia"
                          ? "text-right font-medium tabular-nums"
                          : "text-right tabular-nums"
                      }
                    >
                      {formatarDecimal(m.incidencia)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {buscando
          ? `A busca olha todos os municípios do recorte, também os com menos de ${formatarInteiro(POPULACAO_MINIMA)} habitantes. A posição segue ${ordem === "incidencia" ? contaTaxa : "o total de casos"}.`
          : ordem === "incidencia"
            ? `A posição segue ${contaTaxa}. Entram municípios com ${ano === TODOS ? "população média de " : ""}${formatarInteiro(POPULACAO_MINIMA)} habitantes ou mais. Abaixo disso, poucos casos já produzem uma taxa muito alta, e uma cidade com menos casos pode ficar na frente.`
            : `A posição segue o total de casos. ${rotuloTaxa} usa ${contaTaxa}, então essa coluna não acompanha a posição.`}
      </CardFooter>
    </Card>
  )
}
