import { useState } from "react"

import { EstadoCarregamento } from "@/components/estado-carregamento"
import { Badge } from "@/components/ui/badge"
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
import { useApi, type LinhaMunicipio } from "@/lib/api"
import {
  type Nivel,
  type Periodo,
  TODOS,
  ANO_FIM,
  doRecorte,
  formatarDecimal,
  formatarInteiro,
  incidencia,
  nivel,
  rotuloPeriodo,
} from "@/lib/dengue"

type Ordem = "incidencia" | "casos"

const LIMITE_LINHAS = 15

const variantePorNivel: Record<Nivel, "destructive" | "secondary" | "outline"> =
  {
    alta: "destructive",
    média: "secondary",
    baixa: "outline",
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
  const [ordem, setOrdem] = useState<Ordem>("casos")
  const { dados, erro } = useApi<LinhaMunicipio[]>(`/api/municipios?ano=${ano}`)

  const municipios = doRecorte(dados ?? [], uf).map((m) => ({
    ...m,
    incidencia: incidencia(m.casos, m.pessoasAno),
  }))
  const linhas = [...municipios]
    .sort((a, b) => b[ordem] - a[ordem])
    .slice(0, LIMITE_LINHAS)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Municípios com mais dengue, {recorte}, {rotuloPeriodo(ano)}
        </CardTitle>
        <CardDescription>
          {LIMITE_LINHAS} primeiros de {formatarInteiro(municipios.length)}{" "}
          municípios
        </CardDescription>
        <CardAction>
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
                  <TableHead className="w-10 text-right">#</TableHead>
                  <TableHead>Município</TableHead>
                  <TableHead>UF</TableHead>
                  <TableHead className="text-right">
                    {ano === TODOS ? `População ${ANO_FIM}` : "População"}
                  </TableHead>
                  <TableHead className="text-right">Casos</TableHead>
                  <TableHead className="text-right">
                    {ano === TODOS ? "Por 100 mil/ano" : "Por 100 mil"}
                  </TableHead>
                  <TableHead>Nível</TableHead>
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
                    <TableCell className="text-right tabular-nums">
                      {formatarInteiro(m.populacao)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatarInteiro(m.casos)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatarDecimal(m.incidencia)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={variantePorNivel[nivel(m.incidencia)]}>
                        {nivel(m.incidencia)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {ano === TODOS
          ? "Incidência média anual: casos do período divididos pela soma da população de cada ano."
          : "Em municípios pequenos, poucos casos já geram incidência alta; compare com a população."}
      </CardFooter>
    </Card>
  )
}
