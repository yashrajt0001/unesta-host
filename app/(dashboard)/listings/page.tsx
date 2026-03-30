'use client';

import { useState, useEffect, useCallback } from 'react';
import { listings as listingsApi } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PaginationControls } from '@/components/pagination-controls';
import { Plus, MapPin, Users, Bed } from 'lucide-react';
import Link from 'next/link';
import type { Listing, Pagination, ListingStatus } from '@/types';

const statusStyle: Record<ListingStatus, string> = {
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200/60',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  UNLISTED: 'bg-slate-100 text-slate-600 border-slate-200/60',
  SUSPENDED: 'bg-red-50 text-red-700 border-red-200/60',
};

export default function ListingsPage() {
  const [listingsList, setListingsList] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchListings = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params: { page: number; limit: number; status?: string } = { page, limit: 10 };
      if (status) params.status = status;
      const res = await listingsApi.getAll(params);
      setListingsList(res.data.listings || []);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchListings(1);
  }, [fetchListings]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Listings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your properties</p>
        </div>
        <Button asChild>
          <Link href="/listings/new">
            <Plus className="mr-2 h-4 w-4" />
            New Listing
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={status} onValueChange={(v) => setStatus(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="UNLISTED">Unlisted</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Listings grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-44 w-full rounded-b-none" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : listingsList.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground font-medium">No listings found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Create your first property listing to get started</p>
            <Button asChild className="mt-4">
              <Link href="/listings/new">Create your first listing</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listingsList.map((listing) => {
              const cover = listing.images?.find((img) => img.isCover) || listing.images?.[0];
              return (
                <Link key={listing.id} href={`/listings/${listing.id}`}>
                  <Card className="overflow-hidden group cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)] transition-shadow duration-200">
                    <div className="relative h-44 bg-muted overflow-hidden">
                      {cover ? (
                        <img
                          src={cover.url}
                          alt={listing.title}
                          className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                          No image
                        </div>
                      )}
                      <span className={`absolute top-2.5 right-2.5 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-none ${statusStyle[listing.status]}`}>
                        {listing.status}
                      </span>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate">{listing.title}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{listing.city}, {listing.state}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2.5 pt-2.5 border-t">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {listing.maxGuests}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bed className="h-3 w-3" />
                          {listing.beds}
                        </span>
                        <span className="ml-auto font-semibold text-foreground">
                          {'\u20B9'}{listing.basePrice.toLocaleString('en-IN')}<span className="text-xs font-normal text-muted-foreground">/night</span>
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
          <PaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(p) => fetchListings(p)}
          />
        </>
      )}
    </div>
  );
}
