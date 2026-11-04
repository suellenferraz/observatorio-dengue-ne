import { useMemo, useState, type CSSProperties } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { ChartCriterio } from "@/components/chart-criterio"
import { ChartGravidade } from "@/components/chart-gravidade"
import { ChartIncidenciaAnual } from "@/components/chart-incidencia-anual"
import { ChartPiramide } from "@/components/chart-piramide"
import { ChartRankingEstados } from "@/components/chart-ranking-estados"
import { ChartSazonalidade } from "@/components/chart-sazonalidade"
import { EstadoCarregamento } from "@/components/estado-carregamento"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { TabelaMunicipios } from "@/components/tabela-municipios"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useApi, type LinhaUfAno } from "@/lib/api"
import {
  NORDESTE,
  TODOS,
  type Periodo,
  nomeDoRecorte,
  totaisPorAno,
} from "@/lib/dengue"

export default function DashboardPage() {
  const { dados, erro } = useApi<LinhaUfAno[]>("/api/uf-ano")
  const linhas = useMemo(() => dados ?? [], [dados])
  const [uf, setUf] = useState(NORDESTE)
  const [ano, setAno] = useState<Periodo>(TODOS)

  const anos = useMemo(
    () => [...new Set(linhas.map((l) => l.ano))].sort((a, b) => b - a),
    [linhas]
  )
  const estados = useMemo(() => {
    const porSigla = new Map(linhas.map((l) => [l.sigla, l.nome]))
    return [...porSigla].map(([sigla, nome]) => ({ sigla, nome }))
  }, [linhas])
  const totais = useMemo(() => totaisPorAno(linhas, uf), [linhas, uf])

  const recorte = nomeDoRecorte(uf, linhas)

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="min-w-0">
        <SiteHeader
          ano={ano}
          anos={anos}
          uf={uf}
          estados={estados}
          onAno={setAno}
          onUf={setUf}
        />
        <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
          <section
            id="visao-geral"
            className="flex scroll-mt-4 flex-col gap-4 md:gap-6"
          >
            <SectionCards ano={ano} uf={uf} totais={totais} linhas={linhas} />
            <div className="px-4 lg:px-6">
              {dados ? (
                <ChartIncidenciaAnual
                  totais={totais}
                  ano={ano}
                  recorte={recorte}
                  onAno={setAno}
                />
              ) : (
                <EstadoCarregamento erro={erro} className="h-[380px]" />
              )}
            </div>
          </section>
          <div className="grid grid-cols-1 gap-4 px-4 md:gap-6 lg:px-6 @5xl/main:grid-cols-2">
            {dados && (
              <ChartRankingEstados
                linhas={linhas}
                ano={ano}
                uf={uf}
                onUf={setUf}
              />
            )}
            <section id="sazonalidade" className="scroll-mt-4">
              <ChartSazonalidade ano={ano} uf={uf} recorte={recorte} />
            </section>
          </div>
          <section
            id="perfil"
            className="grid scroll-mt-4 grid-cols-1 gap-4 px-4 md:gap-6 lg:px-6 @5xl/main:grid-cols-2"
          >
            <ChartPiramide ano={ano} uf={uf} recorte={recorte} />
            <ChartCriterio ano={ano} uf={uf} recorte={recorte} />
          </section>
          <section id="gravidade" className="scroll-mt-4 px-4 lg:px-6">
            {dados && (
              <ChartGravidade totais={totais} ano={ano} recorte={recorte} />
            )}
          </section>
          <section id="municipios" className="scroll-mt-4 px-4 lg:px-6">
            <TabelaMunicipios ano={ano} uf={uf} recorte={recorte} />
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
