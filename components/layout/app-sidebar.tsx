"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  DollarSign,
  BarChart3,
  MessageSquare,
  Star,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  title: string;
  icon: LucideIcon;
  href: string;
}

const navItems: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { title: "Listings", icon: Building2, href: "/listings" },
  { title: "Bookings", icon: CalendarDays, href: "/bookings" },
  { title: "Earnings", icon: DollarSign, href: "/earnings" },
  { title: "Analytics", icon: BarChart3, href: "/analytics" },
  { title: "Messages", icon: MessageSquare, href: "/messages" },
  { title: "Reviews", icon: Star, href: "/reviews" },
  { title: "Notifications", icon: Bell, href: "/notifications" },
];


export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
            U
          </div>
          <div>
            <div className="font-semibold text-sm text-sidebar-accent-foreground leading-tight">Unesta</div>
            <div className="text-[11px] text-sidebar-foreground/60 leading-tight">Host Dashboard</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest font-semibold">
            Manage
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href || pathname.startsWith(item.href + '/')}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter>
        <div className="px-4 py-3 text-[10px] text-sidebar-foreground/30">
          Unesta v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
