'use client';

import { useState, useEffect } from 'react';
import { reviews as reviewsApi, listings as listingsApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PaginationControls } from '@/components/pagination-controls';
import { Star, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Review, Listing, Pagination } from '@/types';

export default function ReviewsPage() {
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [selectedListingId, setSelectedListingId] = useState('');
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Response form
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    listingsApi
      .getAll({ limit: 50 })
      .then((res) => {
        const items = res.data.listings || res.data || [];
        setMyListings(items);
        if (items.length > 0 && !selectedListingId) {
          setSelectedListingId(items[0].id);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!selectedListingId) setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedListingId) return;
    fetchReviews(1);
  }, [selectedListingId]);

  const fetchReviews = async (page: number) => {
    setIsLoading(true);
    try {
      const res = await reviewsApi.getByListing(selectedListingId, { page, limit: 10 });
      setReviewsList(res.data.reviews || res.data || []);
      setAverageRating(res.data.averageRating ?? null);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await reviewsApi.respond(reviewId, responseText.trim());
      setReviewsList((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, hostResponse: res.data.hostResponse } : r))
      );
      setRespondingTo(null);
      setResponseText('');
      toast.success('Response posted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to post response');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground mt-1">Guest feedback on your listings</p>
      </div>

      {/* Listing selector */}
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Listing</Label>
          <Select value={selectedListingId} onValueChange={setSelectedListingId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a listing" />
            </SelectTrigger>
            <SelectContent>
              {myListings.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {averageRating !== null && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{averageRating}</span>
            <span className="text-muted-foreground">({pagination.total} review{pagination.total !== 1 ? 's' : ''})</span>
          </div>
        )}
      </div>

      {/* Reviews list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !selectedListingId ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Select a listing to view reviews
          </CardContent>
        </Card>
      ) : reviewsList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No reviews for this listing yet
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {reviewsList.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4 space-y-3">
                  {/* Review header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {review.reviewer?.firstName?.[0]}{review.reviewer?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {review.reviewer?.firstName} {review.reviewer?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(review.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Review text */}
                  <p className="text-sm">{review.comment}</p>

                  {/* Host response */}
                  {review.hostResponse ? (
                    <div className="bg-muted rounded-md p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Your response</p>
                      <p className="text-sm">{review.hostResponse}</p>
                    </div>
                  ) : (
                    <>
                      {respondingTo === review.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Write your response..."
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleRespond(review.id)}
                              disabled={isSubmitting || !responseText.trim()}
                            >
                              {isSubmitting ? 'Posting...' : 'Post Response'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setRespondingTo(null); setResponseText(''); }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setRespondingTo(review.id)}
                        >
                          <MessageSquare className="mr-1 h-3 w-3" />
                          Respond
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <PaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(p) => fetchReviews(p)}
          />
        </>
      )}
    </div>
  );
}
