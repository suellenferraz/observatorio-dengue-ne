import { CircleAlertIcon } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function EstadoCarregamento({
  erro,
  className,
}: {
  erro?: string | null
  className?: string
}) {
  if (erro) {
    return (
      <div
        className={cn(
          "flex h-[260px] w-full items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground",
          className
        )}
      >
        <CircleAlertIcon className="size-4 shrink-0" />
        {erro}
      </div>
    )
  }
  return <Skeleton className={cn("h-[260px] w-full", className)} />
}
