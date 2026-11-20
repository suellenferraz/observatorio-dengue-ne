import { CircleHelpIcon } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function Ajuda({ texto, rotulo }: { texto: string; rotulo: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={rotulo}
            className="inline-flex text-muted-foreground hover:text-foreground"
          />
        }
      >
        <CircleHelpIcon className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent className="max-w-80 text-left text-balance">
        {texto}
      </TooltipContent>
    </Tooltip>
  )
}
