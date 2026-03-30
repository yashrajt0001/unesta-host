'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { listings as listingsApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/confirm-dialog';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MapPin,
  Users,
  Bed,
  Bath,
  Clock,
  IndianRupee,
  Plus,
  Star as StarIcon,
  X,
  ImagePlus,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Listing, ListingStatus } from '@/types';

const statusColors: Record<ListingStatus, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  UNLISTED: 'bg-gray-100 text-gray-800',
  SUSPENDED: 'bg-red-100 text-red-800',
};

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Image management
  const [isAddingImage, setIsAddingImage] = useState(false);

  useEffect(() => {
    listingsApi
      .getById(id)
      .then((res) => setListing(res.data))
      .catch(() => toast.error('Failed to load listing'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleStatusToggle = async () => {
    if (!listing || listing.status === 'SUSPENDED') return;
    const newStatus = listing.status === 'PUBLISHED' ? 'UNLISTED' : 'PUBLISHED';
    setIsTogglingStatus(true);
    try {
      await listingsApi.updateStatus(id, newStatus);
      setListing((prev) => prev ? { ...prev, status: newStatus } : prev);
      toast.success(`Listing ${newStatus === 'PUBLISHED' ? 'published' : 'unlisted'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await listingsApi.delete(id);
      toast.success('Listing deleted');
      router.push('/listings');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete listing');
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsAddingImage(true);
    try {
      for (const file of Array.from(files)) {
        const res = await listingsApi.addImage(id, file);
        setListing((prev) => prev ? { ...prev, images: [...(prev.images || []), res.data] } : prev);
      }
      toast.success(`${files.length} image${files.length > 1 ? 's' : ''} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsAddingImage(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await listingsApi.deleteImage(id, imageId);
      setListing((prev) => {
        if (!prev) return prev;
        const remaining = prev.images.filter((img) => img.id !== imageId);
        // If the deleted image was the cover and there are remaining images,
        // the API auto-promotes the first one
        if (remaining.length > 0 && !remaining.some((img) => img.isCover)) {
          remaining[0].isCover = true;
        }
        return { ...prev, images: remaining };
      });
      toast.success('Image deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete image');
    }
  };

  const handleSetCover = async (imageId: string) => {
    try {
      await listingsApi.setCoverImage(id, imageId);
      setListing((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          images: prev.images.map((img) => ({ ...img, isCover: img.id === imageId })),
        };
      });
      toast.success('Cover image updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to set cover');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/listings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <p className="text-muted-foreground">Listing not found.</p>
      </div>
    );
  }

  const cover = listing.images?.find((img) => img.isCover) || listing.images?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/listings"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          <Badge className={statusColors[listing.status]}>{listing.status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {listing.status !== 'SUSPENDED' && (
            <Button variant="outline" size="sm" onClick={handleStatusToggle} disabled={isTogglingStatus}>
              {listing.status === 'PUBLISHED' ? (
                <><EyeOff className="mr-1 h-4 w-4" /> Unlist</>
              ) : (
                <><Eye className="mr-1 h-4 w-4" /> Publish</>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/listings/${id}/edit`}>
              <Edit className="mr-1 h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Images section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4" />
            Images
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload images */}
          <div>
            <label className="cursor-pointer inline-flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                disabled={isAddingImage}
                className="hidden"
              />
              <Button type="button" variant="outline" disabled={isAddingImage} asChild>
                <span>
                  <Plus className="mr-1 h-4 w-4" />
                  {isAddingImage ? 'Uploading...' : 'Upload Images'}
                </span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-1">Max 5MB per image. JPG, PNG, WebP.</p>
          </div>

          {/* Image grid */}
          {listing.images && listing.images.length > 0 ? (
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {listing.images.map((img) => (
                <div key={img.id} className="relative group rounded-lg overflow-hidden border">
                  <img src={img.url} alt="" className="h-36 w-full object-cover" />
                  {img.isCover && (
                    <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs">
                      Cover
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {!img.isCover && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs"
                        onClick={() => handleSetCover(img.id)}
                      >
                        <StarIcon className="mr-1 h-3 w-3" />
                        Set Cover
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={() => handleDeleteImage(img.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No images yet. Add at least one image before publishing.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{listing.description}</p>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{listing.addressLine1}, {listing.city}, {listing.state}, {listing.country}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{listing.propertyType.replace(/_/g, ' ')} / {listing.roomType.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                <span className="flex items-center gap-1"><Users className="h-4 w-4 text-muted-foreground" /> {listing.maxGuests} guests</span>
                <span className="flex items-center gap-1"><Bed className="h-4 w-4 text-muted-foreground" /> {listing.bedrooms} bedrooms, {listing.beds} beds</span>
                <span className="flex items-center gap-1"><Bath className="h-4 w-4 text-muted-foreground" /> {listing.bathrooms} bath</span>
              </div>
              {(listing.checkInTime || listing.checkOutTime) && (
                <div className="flex gap-6 text-sm">
                  {listing.checkInTime && (
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-muted-foreground" /> Check-in: {listing.checkInTime}</span>
                  )}
                  {listing.checkOutTime && (
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-muted-foreground" /> Check-out: {listing.checkOutTime}</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Amenities</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map((a) => (
                    <Badge key={a.id} variant="secondary">{a.name}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* House rules */}
          {listing.houseRules && listing.houseRules.length > 0 && (
            <Card>
              <CardHeader><CardTitle>House Rules</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {listing.houseRules.map((rule) => (
                    <li key={rule.id}>{rule.ruleText}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pricing sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Base price</span>
                <span className="font-medium flex items-center"><IndianRupee className="h-3 w-3" />{listing.basePrice.toLocaleString('en-IN')}/night</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cleaning fee</span>
                <span className="font-medium flex items-center"><IndianRupee className="h-3 w-3" />{listing.cleaningFee.toLocaleString('en-IN')}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Minimum stay</span>
                <span className="font-medium">{listing.minimumStay} night{listing.minimumStay > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cancellation</span>
                <span className="font-medium">{listing.cancellationPolicy}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Instant book</span>
                <span className="font-medium">{listing.instantBook ? 'Yes' : 'No'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Listing"
        description="This action cannot be undone. Are you sure you want to delete this listing?"
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
