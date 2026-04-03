"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LayoutDashboard, Users, Shield } from "lucide-react"
import type { SessionUser } from "@/lib/auth"
import { cn } from "@/lib/cn"

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["coach", "admin"] as const,
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Users,
    roles: ["coach", "admin"] as const,
  },
]

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

interface AppSidebarProps {
  user: SessionUser
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter((item) =>
    (item.roles as readonly string[]).includes(user.role)
  )

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg border-none bg-background overflow-hidden shrink-0">
            <Image
              src="/logos/vx-logo.webp"
              alt="Vx logo"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-none text-foreground tracking-tight">
              Vx Tracker
            </span>
            <span className="text-[10px] text-muted-foreground leading-none mt-1">
              Coach Portal
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-2 mb-1">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href))
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href as "/dashboard" | "/clients"} />}
                      isActive={isActive}
                      className={cn(
                        "gap-3 h-9 rounded-lg text-sm",
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-foreground/70 hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 px-1 py-1">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground font-bold">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate leading-none text-foreground">
              {user.fullName}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              {user.role === "admin" && (
                <Shield className="size-2.5 text-primary" />
              )}
              <span className="text-[11px] text-muted-foreground capitalize leading-none">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
