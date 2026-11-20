import type { ReactNode } from "react"

import type { ChartConfig } from "@/components/ui/chart"

type Item = { color?: string; payload?: { fill?: string } }

export function formatadorTooltip(
  config: ChartConfig,
  formatar: (valor: number) => ReactNode
) {
  return (valor: unknown, nome: unknown, item: Item) => (
    <div className="flex w-full items-center gap-2">
      <span
        className="size-2.5 shrink-0 rounded-xs"
        style={{ background: item.payload?.fill ?? item.color }}
      />
      <span className="text-muted-foreground">
        {config[String(nome)]?.label ?? String(nome)}
      </span>
      <span className="ml-auto pl-3 font-mono font-medium text-foreground tabular-nums">
        {formatar(Number(valor))}
      </span>
    </div>
  )
}
