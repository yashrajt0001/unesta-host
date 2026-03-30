'use client';

import { useState, useEffect, useCallback } from 'react';
import { hostDashboard, listings as listingsApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, TrendingUp, Receipt, Minus } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { EarningsData, Listing } from '@/types';

export default function EarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [from, setFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [listingId, setListingId] = useState('');

  useEffect(() => {
    listingsApi.getAll({ limit: 50 }).then((res) => setMyListings(res.data.listings || res.data || [])).catch(() => {});
  }, []);

  const fetchEarnings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: { from?: string; to?: string; listingId?: string } = {};
      if (from) params.from = from;
      if (to) params.to = to;
      if (listingId) params.listingId = listingId;
      const res = await hostDashboard.getEarnings(params);
      setData(res.data);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [from, to, listingId]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const summary = data?.summary;

  const summaryCards = summary
    ? [
        {
          title: 'GROSS REVENUE',
          value: `\u20B9${summary.grossRevenue.toLocaleString('en-IN')}`,
          icon: DollarSign,
          color: 'text-emerald-600',
          bg: 'bg-emerald-500/10',
          accent: 'border-l-emerald-500',
        },
        {
          title: 'PLATFORM FEES',
          value: `\u20B9${summary.platformFees.toLocaleString('en-IN')}`,
          icon: Minus,
          color: 'text-red-500',
          bg: 'bg-red-500/10',
          accent: 'border-l-red-400',
          valueClass: 'text-destructive',
        },
        {
          title: 'NET EARNINGS',
          value: `\u20B9${summary.netEarnings.toLocaleString('en-IN')}`,
          icon: TrendingUp,
          color: 'text-blue-600',
          bg: 'bg-blue-500/10',
          accent: 'border-l-blue-500',
        },
        {
          title: 'TOTAL BOOKINGS',
          value: summary.totalBookings,
          icon: Receipt,
          color: 'text-violet-600',
          bg: 'bg-violet-500/10',
          accent: 'border-l-violet-500',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
        <p className="text-sm text-muted-foreground mt-1">Revenue and payout details</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Listing</Label>
          <Select value={listingId} onValueChange={(v) => setListingId(v === 'ALL' ? '' : v)}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All listings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All listings</SelectItem>
              {myListings.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-3 w-20" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-28" /></CardContent>
            </Card>
          ))}
        </div>
      ) : summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.title} className={`overflow-hidden border-l-[3px] ${card.accent}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-semibold tracking-widest text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold tracking-tight ${(card as any).valueClass || ''}`}>
                  {card.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bookings table */}
      <Card className="overflow-hidden">
        <CardHeader><CardTitle className="text-base">Booking Breakdown</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Listing</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Nights</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Fee</TableHead>
              <TableHead className="text-right">Payout</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data?.bookings?.length ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No earnings in this period
                </TableCell>
              </TableRow>
            ) : (
              data.bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium text-sm">{b.guest?.firstName} {b.guest?.lastName}</TableCell>
                  <TableCell className="max-w-40 truncate text-sm">{b.listing?.title}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                    {format(new Date(b.checkInDate), 'MMM d')} {'\u2013'} {format(new Date(b.checkOutDate), 'MMM d')}
                  </TableCell>
                  <TableCell className="text-sm">{b.numNights}</TableCell>
                  <TableCell className="text-right text-sm">{'\u20B9'}{b.totalPrice.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right text-sm text-destructive">{'\u20B9'}{b.hostServiceFee.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{'\u20B9'}{b.hostPayout.toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[11px]">{b.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
