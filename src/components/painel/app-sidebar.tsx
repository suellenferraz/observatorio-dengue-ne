import type { ComponentProps } from "react"
import {
  BugIcon,
  CalendarRangeIcon,
  LayoutDashboardIcon,
  MapIcon,
  MapPinIcon,
  ShieldAlertIcon,
  UsersIcon,
} from "lucide-react"

import { NavMain } from "@/components/painel/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const secoes = [
  { title: "Visão geral", url: "#visao-geral", icon: <LayoutDashboardIcon /> },
  { title: "Mapa", url: "#mapa", icon: <MapIcon /> },
  { title: "Sazonalidade", url: "#sazonalidade", icon: <CalendarRangeIcon /> },
  { title: "Perfil dos casos", url: "#perfil", icon: <UsersIcon /> },
  { title: "Gravidade", url: "#gravidade", icon: <ShieldAlertIcon /> },
  { title: "Municípios", url: "#municipios", icon: <MapPinIcon /> },
]

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#visao-geral" />}
              onClick={() => setOpenMobile(false)}
            >
              <BugIcon className="size-5!" />
              <span className="text-base font-semibold">
                Observatório Dengue NE
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={secoes} />
      </SidebarContent>
      <SidebarFooter>
        <p className="px-2 text-xs leading-relaxed text-muted-foreground">
          Dengue no Nordeste, 2000–2025. Fontes: SINAN e IBGE.
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
