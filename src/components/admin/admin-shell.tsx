import { type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-store";
import { api } from "@/lib/api-client";
import { ADMIN_COLLECTIONS } from "@/lib/admin/collections";
import { Bell, Image, LayoutDashboard, ListChecks, LogOut, Settings, Users } from "lucide-react";

const NAV_SECTIONS: {
  label: string;
  items: { to: string; label: string; icon: typeof LayoutDashboard }[];
}[] = [
  {
    label: "Overview",
    items: [
      { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/leads", label: "Leads", icon: Users },
    ],
  },
  {
    label: "Content",
    items: ADMIN_COLLECTIONS.map((c) => ({
      to: `/admin/${c.routeSegment}`,
      label: c.title,
      icon: ListChecks,
    })),
  },
  {
    label: "Library",
    items: [
      { to: "/admin/media", label: "Media", icon: Image },
      { to: "/admin/activity-log", label: "Activity log", icon: ListChecks },
      { to: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

function NotificationBell() {
  // No admin "unread notification count" endpoint is wired up yet — the
  // backend `notifications` collection exists (see repositories/notifications.py)
  // but nothing writes to it except a new lead, and there's no admin read
  // route yet. Shown as a quiet placeholder rather than faking a number.
  return (
    <Button variant="ghost" size="icon" title="Notifications">
      <Bell className="h-4 w-4" />
    </Button>
  );
}

function useLeadKpis() {
  return useQuery({
    queryKey: ["admin-leads-kpis"],
    queryFn: () =>
      api.get<{ byStatus: Record<string, number>; newLeads: number }>("/admin/leads/kpis"),
    staleTime: 30_000,
  });
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { data: kpis } = useLeadKpis();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              M
            </div>
            <div className="text-sm font-semibold tracking-tight">Mirabilis Admin</div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {NAV_SECTIONS.map((section) => (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={currentPath === item.to}>
                        <Link to={item.to}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                          {item.to === "/admin/leads" && kpis?.newLeads ? (
                            <Badge variant="secondary" className="ml-auto">
                              {kpis.newLeads}
                            </Badge>
                          ) : null}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="justify-start gap-2 px-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {user?.email?.[0]?.toUpperCase() ?? "?"}
                </div>
                <span className="truncate text-sm">{user?.email ?? "Admin"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>{user?.role ?? "admin"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <span className="text-sm text-muted-foreground">{currentPath}</span>
          </div>
          <NotificationBell />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
