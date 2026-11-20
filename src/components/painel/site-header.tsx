import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NORDESTE, TODOS, type Periodo, rotuloPeriodo } from "@/lib/dengue"

type Props = {
  ano: Periodo
  anos: number[]
  uf: string
  estados: { sigla: string; nome: string }[]
  onAno: (ano: Periodo) => void
  onUf: (uf: string) => void
}

export function SiteHeader({ ano, anos, uf, estados, onAno, onUf }: Props) {
  const regioes = [
    { value: NORDESTE, label: "Nordeste" },
    ...estados.map((e) => ({ value: e.sigla, label: e.nome })),
  ]
  const opcoesAno = [
    { value: TODOS, label: rotuloPeriodo(TODOS) },
    ...anos.map((a) => ({ value: String(a), label: String(a) })),
  ]

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        <h1 className="hidden text-base font-medium sm:block">
          {ano === TODOS ? "Visão geral" : `Ano de ${ano}`}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Select
            items={regioes}
            value={uf}
            onValueChange={(valor) => valor && onUf(valor)}
          >
            <SelectTrigger size="sm" className="w-40" aria-label="Região">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {regioes.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            items={opcoesAno}
            value={String(ano)}
            onValueChange={(valor) =>
              valor && onAno(valor === TODOS ? TODOS : Number(valor))
            }
          >
            <SelectTrigger size="sm" className="w-32" aria-label="Período">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {opcoesAno.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  )
}
