import type { ComponentProps } from "react"
import {
  BugIcon,
  CalendarRangeIcon,
  LayoutDashboardIcon,
  MapPinIcon,
  ShieldAlertIcon,
  UsersIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const secoes = [
  { title: "Visão geral", url: "#visao-geral", icon: <LayoutDashboardIcon /> },
  { title: "Sazonalidade", url: "#sazonalidade", icon: <CalendarRangeIcon /> },
  { title: "Perfil dos casos", url: "#perfil", icon: <UsersIcon /> },
  { title: "Gravidade", url: "#gravidade", icon: <ShieldAlertIcon /> },
  { title: "Municípios", url: "#municipios", icon: <MapPinIcon /> },
]

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#visao-geral" />}
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
