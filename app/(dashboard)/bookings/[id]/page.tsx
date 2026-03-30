'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { bookings as bookingsApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  CalendarDays,
  Users,
  IndianRupee,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Booking, BookingStatus } from '@/types';

const statusVariant: Record<BookingStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'outline',
  CONFIRMED: 'default',
  CHECKED_IN: 'default',
  COMPLETED: 'secondary',
  CANCELLED: 'destructive',
  DECLINED: 'destructive',
};

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  // Decline/cancel dialog
  const [reasonDialog, setReasonDialog] = useState<'decline' | 'cancel' | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    bookingsApi
      .getById(id)
      .then((res) => setBooking(res.data))
      .catch(() => toast.error('Failed to load booking'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleAction = async (action: string) => {
    setActionLoading(action);
    try {
      let res;
      switch (action) {
        case 'accept':
          res = await bookingsApi.accept(id);
          break;
        case 'check-in':
          res = await bookingsApi.checkIn(id);
          break;
        case 'check-out':
          res = await bookingsApi.checkOut(id);
          break;
        default:
          return;
      }
      setBooking(res.data);
      toast.success(`Booking ${action === 'accept' ? 'accepted' : action === 'check-in' ? 'checked in' : 'checked out'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setActionLoading('');
    }
  };

  const handleReasonSubmit = async () => {
    if (!reason.trim() || !reasonDialog) return;
    setActionLoading(reasonDialog);
    try {
      const res = reasonDialog === 'decline'
        ? await bookingsApi.decline(id, reason)
        : await bookingsApi.cancel(id, reason);
      setBooking(res.data);
      toast.success(`Booking ${reasonDialog === 'decline' ? 'declined' : 'cancelled'}`);
      setReasonDialog(null);
      setReason('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${reasonDialog}`);
    } finally {
      setActionLoading('');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/bookings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <p className="text-muted-foreground">Booking not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/bookings"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">Booking Details</h1>
          <Badge variant={statusVariant[booking.status]}>
            {booking.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {booking.status === 'PENDING' && (
            <>
              <Button
                size="sm"
                onClick={() => handleAction('accept')}
                disabled={!!actionLoading}
              >
                <CheckCircle className="mr-1 h-4 w-4" />
                {actionLoading === 'accept' ? 'Accepting...' : 'Accept'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setReasonDialog('decline')}
                disabled={!!actionLoading}
              >
                <XCircle className="mr-1 h-4 w-4" />
                Decline
              </Button>
            </>
          )}
          {booking.status === 'CONFIRMED' && (
            <>
              <Button
                size="sm"
                onClick={() => handleAction('check-in')}
                disabled={!!actionLoading}
              >
                <LogIn className="mr-1 h-4 w-4" />
                {actionLoading === 'check-in' ? 'Processing...' : 'Check In'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setReasonDialog('cancel')}
                disabled={!!actionLoading}
              >
                <XCircle className="mr-1 h-4 w-4" />
                Cancel
              </Button>
            </>
          )}
          {booking.status === 'CHECKED_IN' && (
            <Button
              size="sm"
              onClick={() => handleAction('check-out')}
              disabled={!!actionLoading}
            >
              <LogOut className="mr-1 h-4 w-4" />
              {actionLoading === 'check-out' ? 'Processing...' : 'Check Out'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guest info */}
          <Card>
            <CardHeader><CardTitle>Guest</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {booking.guest?.firstName?.[0]}{booking.guest?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-medium">{booking.guest?.firstName} {booking.guest?.lastName}</p>
                  <p className="text-sm text-muted-foreground">{booking.guest?.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stay details */}
          <Card>
            <CardHeader><CardTitle>Stay Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(booking.checkInDate), 'EEEE, MMM d, yyyy')} — {format(new Date(booking.checkOutDate), 'EEEE, MMM d, yyyy')}
                </span>
              </div>
              <div className="flex gap-6 text-sm">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {booking.numGuests} guest{booking.numGuests > 1 ? 's' : ''}
                </span>
                <span>{booking.numNights} night{booking.numNights > 1 ? 's' : ''}</span>
              </div>
              {booking.listing && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Listing</p>
                    <Link
                      href={`/listings/${booking.listingId}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {booking.listing.title}
                    </Link>
                    {booking.listing.city && (
                      <p className="text-xs text-muted-foreground">{booking.listing.city}, {booking.listing.state}</p>
                    )}
                  </div>
                </>
              )}
              {booking.cancellationReason && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Cancellation Reason</p>
                    <p className="text-sm">{booking.cancellationReason}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pricing sidebar */}
        <div>
          <Card>
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Base price x {booking.numNights} night{booking.numNights > 1 ? 's' : ''}
                </span>
                <span className="flex items-center"><IndianRupee className="h-3 w-3" />{booking.basePrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cleaning fee</span>
                <span className="flex items-center"><IndianRupee className="h-3 w-3" />{booking.cleaningFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Service fee</span>
                <span className="flex items-center"><IndianRupee className="h-3 w-3" />{booking.serviceFee.toLocaleString('en-IN')}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium flex items-center"><IndianRupee className="h-3 w-3" />{booking.totalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Host service fee</span>
                <span className="text-destructive flex items-center">-<IndianRupee className="h-3 w-3" />{booking.hostServiceFee.toLocaleString('en-IN')}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-medium">
                <span>Your payout</span>
                <span className="flex items-center text-lg"><IndianRupee className="h-4 w-4" />{booking.hostPayout.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Booked on {format(new Date(booking.createdAt), 'MMM d, yyyy')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Decline / Cancel reason dialog */}
      <Dialog open={!!reasonDialog} onOpenChange={(open) => { if (!open) { setReasonDialog(null); setReason(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reasonDialog === 'decline' ? 'Decline Booking' : 'Cancel Booking'}
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for {reasonDialog === 'decline' ? 'declining' : 'cancelling'} this booking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter your reason..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReasonDialog(null); setReason(''); }} disabled={!!actionLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReasonSubmit}
              disabled={!reason.trim() || !!actionLoading}
            >
              {actionLoading ? 'Please wait...' : reasonDialog === 'decline' ? 'Decline' : 'Cancel Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
