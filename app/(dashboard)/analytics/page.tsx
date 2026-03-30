'use client';

import { useState, useEffect } from 'react';
import { hostDashboard, listings as listingsApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Star } from 'lucide-react';
import type { ListingAnalytics, Listing } from '@/types';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<ListingAnalytics[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [listingId, setListingId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listingsApi.getAll({ limit: 50 }).then((res) => setMyListings(res.data.listings || res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const params = listingId ? { listingId } : undefined;
    hostDashboard
      .getAnalytics(params)
      .then((res) => setAnalytics(res.data.listings || res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [listingId]);

  const chartData = analytics.map((a) => ({
    name: a.title.length > 20 ? a.title.slice(0, 20) + '...' : a.title,
    earnings: a.totalEarnings,
    bookings: a.completedBookings,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Performance insights</p>
      </div>

      {/* Filter */}
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Listing</Label>
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

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : analytics.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No analytics data available
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Earnings chart */}
          {chartData.length > 1 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Earnings by Listing</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                    <Bar dataKey="earnings" fill="oklch(0.55 0.19 267)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Analytics table */}
          <Card className="overflow-hidden">
            <CardHeader><CardTitle className="text-base">Performance Summary</CardTitle></CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Nights</TableHead>
                  <TableHead className="text-right">Earnings</TableHead>
                  <TableHead className="text-right">ADR</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead className="text-right">Reviews</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.map((a) => (
                  <TableRow key={a.listingId}>
                    <TableCell className="font-medium max-w-60 truncate">{a.title}</TableCell>
                    <TableCell className="text-right">{a.completedBookings}</TableCell>
                    <TableCell className="text-right">{a.totalNights}</TableCell>
                    <TableCell className="text-right">₹{a.totalEarnings.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right">₹{a.adr.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {a.averageRating || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{a.totalReviews}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
