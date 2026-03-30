'use client';

import { useState, useEffect } from 'react';
import { hostDashboard } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  CalendarDays,
  DollarSign,
  MessageSquare,
  Clock,
  Star,
} from 'lucide-react';
import { format } from 'date-fns';
import type { DashboardOverview } from '@/types';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    hostDashboard
      .getOverview()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your hosting activity</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-3 w-20" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-28" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your hosting activity</p>
        </div>
        <p className="text-muted-foreground">Failed to load dashboard data.</p>
      </div>
    );
  }

  const stats = [
    {
      title: 'MONTHLY EARNINGS',
      value: `\u20B9${data.monthlyEarnings.toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
      accent: 'border-l-emerald-500',
    },
    {
      title: 'TOTAL LISTINGS',
      value: data.totalListings,
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-500/10',
      accent: 'border-l-blue-500',
    },
    {
      title: 'PENDING BOOKINGS',
      value: data.pendingBookingsCount,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
      accent: 'border-l-amber-500',
    },
    {
      title: 'UNREAD MESSAGES',
      value: data.unreadMessagesCount,
      icon: MessageSquare,
      color: 'text-violet-600',
      bg: 'bg-violet-500/10',
      accent: 'border-l-violet-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your hosting activity</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className={`overflow-hidden border-l-[3px] ${stat.accent}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-semibold tracking-widest text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              Upcoming Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming bookings</p>
            ) : (
              <div className="space-y-3">
                {data.upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {booking.guest?.firstName} {booking.guest?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {booking.listing?.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(booking.checkInDate), 'MMM d')} \u2013 {format(new Date(booking.checkOutDate), 'MMM d')}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[11px]">{booking.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-amber-500" />
              Recent Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No reviews yet</p>
            ) : (
              <div className="space-y-3">
                {data.recentReviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">
                        {review.reviewer?.firstName} {review.reviewer?.lastName}
                      </p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-semibold">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {review.listing?.title}
                    </p>
                    <p className="text-sm mt-1 line-clamp-2 text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
