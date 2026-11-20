import { lazy, Suspense, useMemo, useState, type CSSProperties } from "react"

import { AppSidebar } from "@/components/painel/app-sidebar"
import { EstadoCarregamento } from "@/components/painel/estado-carregamento"
import { QuandoVisivel } from "@/components/painel/quando-visivel"
import { SectionCards } from "@/components/painel/section-cards"
import { SiteHeader } from "@/components/painel/site-header"
import { TabelaMunicipios } from "@/components/painel/tabela-municipios"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useApi, type LinhaUfAno } from "@/lib/api"
import {
  NORDESTE,
  TODOS,
  type Periodo,
  nomeDoRecorte,
  totaisPorAno,
} from "@/lib/dengue"

const carregarGraficos = () => import("@/dashboard/graficos")

const ChartIncidenciaAnual = lazy(() =>
  carregarGraficos().then((m) => ({ default: m.ChartIncidenciaAnual }))
)
const MapaIncidencia = lazy(() =>
  carregarGraficos().then((m) => ({ default: m.MapaIncidencia }))
)
const ChartRankingEstados = lazy(() =>
  carregarGraficos().then((m) => ({ default: m.ChartRankingEstados }))
)
const ChartSazonalidade = lazy(() =>
  carregarGraficos().then((m) => ({ default: m.ChartSazonalidade }))
)
const ChartPiramide = lazy(() =>
  carregarGraficos().then((m) => ({ default: m.ChartPiramide }))
)
const ChartCriterio = lazy(() =>
  carregarGraficos().then((m) => ({ default: m.ChartCriterio }))
)
const ChartGravidade = lazy(() =>
  carregarGraficos().then((m) => ({ default: m.ChartGravidade }))
)

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
            <SectionCards ano={ano} uf={uf} totais={totais} />
            <div className="px-4 lg:px-6">
              {dados ? (
                <Suspense
                  fallback={<EstadoCarregamento erro={erro} className="h-95" />}
                >
                  <ChartIncidenciaAnual
                    totais={totais}
                    ano={ano}
                    recorte={recorte}
                    onAno={setAno}
                  />
                </Suspense>
              ) : (
                <EstadoCarregamento erro={erro} className="h-95" />
              )}
            </div>
          </section>
          <section id="mapa" className="scroll-mt-4 px-4 lg:px-6">
            {dados ? (
              <Suspense fallback={<EstadoCarregamento className="h-128" />}>
                <MapaIncidencia
                  linhas={linhas}
                  ano={ano}
                  uf={uf}
                  onUf={setUf}
                />
              </Suspense>
            ) : (
              <EstadoCarregamento erro={erro} className="h-128" />
            )}
          </section>
          <div className="grid grid-cols-1 gap-4 px-4 md:gap-6 lg:px-6 @5xl/main:grid-cols-2">
            {dados && (
              <Suspense fallback={<EstadoCarregamento className="h-80" />}>
                <ChartRankingEstados
                  linhas={linhas}
                  ano={ano}
                  uf={uf}
                  onUf={setUf}
                />
              </Suspense>
            )}
            <section id="sazonalidade" className="scroll-mt-4">
              <Suspense fallback={<EstadoCarregamento className="h-80" />}>
                <ChartSazonalidade ano={ano} uf={uf} recorte={recorte} />
              </Suspense>
            </section>
          </div>
          <section
            id="perfil"
            className="grid scroll-mt-4 grid-cols-1 gap-4 px-4 md:gap-6 lg:px-6 @5xl/main:grid-cols-2"
          >
            <QuandoVisivel reserva="min-h-105">
              <Suspense fallback={<EstadoCarregamento className="h-105" />}>
                <ChartPiramide ano={ano} uf={uf} recorte={recorte} />
              </Suspense>
            </QuandoVisivel>
            <QuandoVisivel reserva="min-h-60">
              <Suspense fallback={<EstadoCarregamento className="h-60" />}>
                <ChartCriterio ano={ano} uf={uf} recorte={recorte} />
              </Suspense>
            </QuandoVisivel>
          </section>
          <section id="gravidade" className="scroll-mt-4 px-4 lg:px-6">
            <QuandoVisivel reserva="min-h-80">
              {dados && (
                <Suspense fallback={<EstadoCarregamento className="h-75" />}>
                  <ChartGravidade totais={totais} ano={ano} recorte={recorte} />
                </Suspense>
              )}
            </QuandoVisivel>
          </section>
          <section id="municipios" className="scroll-mt-4 px-4 lg:px-6">
            <QuandoVisivel reserva="min-h-96">
              <TabelaMunicipios ano={ano} uf={uf} recorte={recorte} />
            </QuandoVisivel>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
