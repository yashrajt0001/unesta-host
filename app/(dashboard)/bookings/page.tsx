'use client';

import { useState, useEffect, useCallback } from 'react';
import { bookings as bookingsApi } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { PaginationControls } from '@/components/pagination-controls';
import { format } from 'date-fns';
import Link from 'next/link';
import type { Booking, BookingStatus, Pagination } from '@/types';

const STATUS_STYLE: Record<string, string> = {
  PENDING:     'bg-amber-50 text-amber-700 border-amber-200/60',
  CONFIRMED:   'bg-blue-50 text-blue-700 border-blue-200/60',
  CHECKED_IN:  'bg-violet-50 text-violet-700 border-violet-200/60',
  COMPLETED:   'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  CANCELLED:   'bg-red-50 text-red-600 border-red-200/60',
  DECLINED:    'bg-slate-100 text-slate-600 border-slate-200/60',
};

export default function BookingsPage() {
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params: { page: number; limit: number; status?: string } = { page, limit: 10 };
      if (status) params.status = status;
      const res = await bookingsApi.getAll(params);
      setBookingsList(res.data.bookings || res.data || []);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchBookings(1);
  }, [fetchBookings]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">Track and manage guest bookings</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={status} onValueChange={(v) => setStatus(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="CHECKED_IN">Checked In</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="DECLINED">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Listing</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Guests</TableHead>
              <TableHead className="text-right">Payout</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : bookingsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No bookings found
                </TableCell>
              </TableRow>
            ) : (
              bookingsList.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium text-sm">
                    {booking.guest?.firstName} {booking.guest?.lastName}
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-sm">
                    {booking.listing?.title}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                    {format(new Date(booking.checkInDate), 'MMM d')} {'\u2013'} {format(new Date(booking.checkOutDate), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-sm">{booking.numGuests}</TableCell>
                  <TableCell className="text-right whitespace-nowrap text-sm font-medium">
                    {'\u20B9'}{booking.hostPayout.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-none ${STATUS_STYLE[booking.status] ?? 'bg-slate-100 text-slate-600 border-slate-200/60'}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild className="text-xs">
                      <Link href={`/bookings/${booking.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!isLoading && bookingsList.length > 0 && (
          <PaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(p) => fetchBookings(p)}
          />
        )}
      </Card>
    </div>
  );
}
