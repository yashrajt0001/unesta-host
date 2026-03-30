"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { UserNav } from "./user-nav";
import { Search } from "lucide-react";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':      { title: 'Dashboard',      subtitle: 'Overview of your hosting activity' },
  '/listings':       { title: 'Listings',        subtitle: 'Manage your properties' },
  '/listings/new':   { title: 'New Listing',     subtitle: 'Create a new property listing' },
  '/bookings':       { title: 'Bookings',        subtitle: 'Track and manage guest bookings' },
  '/earnings':       { title: 'Earnings',        subtitle: 'Revenue and payout details' },
  '/analytics':      { title: 'Analytics',       subtitle: 'Performance insights' },
  '/messages':       { title: 'Messages',        subtitle: 'Guest conversations' },
  '/reviews':        { title: 'Reviews',         subtitle: 'Guest feedback on your listings' },
  '/notifications':  { title: 'Notifications',   subtitle: 'Updates and alerts' },
};

function getPageInfo(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/listings/') && pathname.endsWith('/edit')) return { title: 'Edit Listing', subtitle: '' };
  if (pathname.startsWith('/listings/')) return { title: 'Listing Details', subtitle: '' };
  if (pathname.startsWith('/bookings/')) return { title: 'Booking Details', subtitle: '' };
  return null;
}

export function Header() {
  const pathname = usePathname();
  const pageInfo = getPageInfo(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex flex-1 items-center justify-between">
        <div>
          {pageInfo && (
            <>
              <h1 className="text-sm font-semibold leading-tight">{pageInfo.title}</h1>
              {pageInfo.subtitle && (
                <p className="text-[11px] text-muted-foreground leading-tight">{pageInfo.subtitle}</p>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8 w-52 h-8 text-xs bg-muted/50 border-transparent focus:bg-background focus:border-input"
            />
          </div>
          <UserNav />
        </div>
      </div>
    </header>
  );
}
