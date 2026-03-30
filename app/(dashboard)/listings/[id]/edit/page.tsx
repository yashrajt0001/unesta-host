'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createListingSchema, type CreateListingFormValues } from '@/lib/validations/listing';
import { listings as listingsApi } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FloatingInput } from '@/components/ui/floating-input';
import { FloatingTextarea } from '@/components/ui/floating-textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, X, Plus, Home, MapPin, Users, IndianRupee, Sparkles, ScrollText } from 'lucide-react';
import Link from 'next/link';
import type { Listing, Amenity, PropertyType, RoomType, CancellationPolicy } from '@/types';

const propertyTypes: PropertyType[] = ['APARTMENT', 'HOUSE', 'VILLA', 'COTTAGE', 'CABIN', 'STUDIO', 'HOTEL', 'UNIQUE'];
const roomTypes: RoomType[] = ['ENTIRE_PLACE', 'PRIVATE_ROOM', 'SHARED_ROOM'];
const cancellationPolicies: CancellationPolicy[] = ['FLEXIBLE', 'MODERATE', 'FIRM'];
const formatLabel = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ruleInput, setRuleInput] = useState('');
  const [isAddingRule, setIsAddingRule] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateListingFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createListingSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      propertyType: undefined as unknown as 'APARTMENT',
      roomType: undefined as unknown as 'ENTIRE_PLACE',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      latitude: '',
      longitude: '',
      maxGuests: 1,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      checkInTime: '',
      checkOutTime: '',
      basePrice: 0,
      cleaningFee: 0,
      minimumStay: 1,
      cancellationPolicy: 'FLEXIBLE',
      instantBook: false,
    },
  });

  const propertyType = watch('propertyType');
  const roomType = watch('roomType');
  const cancellationPolicy = watch('cancellationPolicy');
  const instantBook = watch('instantBook');

  useEffect(() => {
    Promise.all([listingsApi.getById(id), listingsApi.getAmenities()])
      .then(([listingRes, amenitiesRes]) => {
        const l: Listing = listingRes.data;
        setListing(l);
        setAllAmenities(amenitiesRes.data);
        setSelectedAmenities(l.amenities?.map((a) => a.id) || []);
        reset({
          title: l.title,
          description: l.description,
          propertyType: l.propertyType,
          roomType: l.roomType,
          addressLine1: l.addressLine1,
          addressLine2: l.addressLine2 || '',
          city: l.city,
          state: l.state,
          country: l.country,
          postalCode: l.postalCode || '',
          latitude: l.latitude?.toString() || '',
          longitude: l.longitude?.toString() || '',
          maxGuests: l.maxGuests,
          bedrooms: l.bedrooms,
          beds: l.beds,
          bathrooms: l.bathrooms,
          checkInTime: l.checkInTime || '',
          checkOutTime: l.checkOutTime || '',
          basePrice: l.basePrice,
          cleaningFee: l.cleaningFee,
          minimumStay: l.minimumStay,
          cancellationPolicy: l.cancellationPolicy,
          instantBook: l.instantBook,
        });
      })
      .catch(() => toast.error('Failed to load listing'))
      .finally(() => setIsLoading(false));
  }, [id, reset]);

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId) ? prev.filter((a) => a !== amenityId) : [...prev, amenityId]
    );
  };

  const handleAddRule = async () => {
    const trimmed = ruleInput.trim();
    if (!trimmed) return;
    setIsAddingRule(true);
    try {
      const res = await listingsApi.addHouseRules(id, [{ ruleText: trimmed }]);
      setListing((prev) => prev ? { ...prev, houseRules: res.data } : prev);
      setRuleInput('');
      toast.success('Rule added');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add rule');
    } finally {
      setIsAddingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await listingsApi.deleteHouseRule(id, ruleId);
      setListing((prev) =>
        prev ? { ...prev, houseRules: prev.houseRules.filter((r) => r.id !== ruleId) } : prev
      );
      toast.success('Rule removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove rule');
    }
  };

  const onSubmit = async (data: CreateListingFormValues) => {
    try {
      const payload: Record<string, unknown> = {
        title: data.title,
        description: data.description,
        propertyType: data.propertyType,
        roomType: data.roomType,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || undefined,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode || undefined,
        maxGuests: data.maxGuests,
        bedrooms: data.bedrooms,
        beds: data.beds,
        bathrooms: data.bathrooms,
        basePrice: data.basePrice,
        cleaningFee: data.cleaningFee,
        minimumStay: data.minimumStay,
        cancellationPolicy: data.cancellationPolicy,
        instantBook: data.instantBook,
        amenityIds: selectedAmenities,
      };

      if (data.latitude && data.latitude !== '') payload.latitude = Number(data.latitude);
      if (data.longitude && data.longitude !== '') payload.longitude = Number(data.longitude);
      if (data.checkInTime) payload.checkInTime = data.checkInTime;
      if (data.checkOutTime) payload.checkOutTime = data.checkOutTime;

      await listingsApi.update(id, payload);
      toast.success('Listing updated');
      router.push(`/listings/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update listing');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <Link href="/listings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <p className="text-muted-foreground">Listing not found.</p>
      </div>
    );
  }

  const amenitiesByCategory = allAmenities.reduce<Record<string, Amenity[]>>((acc, a) => {
    const cat = a.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <Link href={`/listings/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Listing</h1>
          <p className="text-sm text-muted-foreground">Update your property details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="flex items-center gap-2.5 border-b bg-muted/30 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Home className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Basic Information</h2>
              <p className="text-xs text-muted-foreground">Tell guests about your property</p>
            </div>
          </div>
          <CardContent className="space-y-5 p-6">
            <FloatingInput label="Title" {...register('title')} error={errors.title?.message} />
            <FloatingTextarea label="Description" rows={4} {...register('description')} error={errors.description?.message} />
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 text-xs font-medium text-muted-foreground">Property Type</Label>
                <Select value={propertyType} onValueChange={(v) => setValue('propertyType', v as PropertyType, { shouldValidate: true })}>
                  <SelectTrigger className="w-full h-[3.25rem]" aria-invalid={!!errors.propertyType || undefined}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((t) => (
                      <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.propertyType && <p className="mt-1.5 text-sm text-destructive">{errors.propertyType.message}</p>}
              </div>
              <div>
                <Label className="mb-1.5 text-xs font-medium text-muted-foreground">Room Type</Label>
                <Select value={roomType} onValueChange={(v) => setValue('roomType', v as RoomType, { shouldValidate: true })}>
                  <SelectTrigger className="w-full h-[3.25rem]" aria-invalid={!!errors.roomType || undefined}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((t) => (
                      <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.roomType && <p className="mt-1.5 text-sm text-destructive">{errors.roomType.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="flex items-center gap-2.5 border-b bg-muted/30 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Location</h2>
              <p className="text-xs text-muted-foreground">Where is your property located?</p>
            </div>
          </div>
          <CardContent className="space-y-5 p-6">
            <FloatingInput label="Address Line 1" {...register('addressLine1')} error={errors.addressLine1?.message} />
            <FloatingInput label="Address Line 2 (optional)" {...register('addressLine2')} />
            <div className="grid gap-5 sm:grid-cols-2">
              <FloatingInput label="City" {...register('city')} error={errors.city?.message} />
              <FloatingInput label="State" {...register('state')} error={errors.state?.message} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <FloatingInput label="Country" {...register('country')} error={errors.country?.message} />
              <FloatingInput label="Postal Code (optional)" {...register('postalCode')} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FloatingInput label="Latitude (optional)" type="number" step="any" {...register('latitude')} error={errors.latitude?.message} />
              <FloatingInput label="Longitude (optional)" type="number" step="any" {...register('longitude')} error={errors.longitude?.message} />
            </div>
          </CardContent>
        </Card>

        {/* Capacity & Layout */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="flex items-center gap-2.5 border-b bg-muted/30 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Capacity & Layout</h2>
              <p className="text-xs text-muted-foreground">How many guests can you accommodate?</p>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <FloatingInput label="Max Guests" type="number" min="1" {...register('maxGuests')} error={errors.maxGuests?.message} />
              <FloatingInput label="Bedrooms" type="number" min="0" {...register('bedrooms')} error={errors.bedrooms?.message} />
              <FloatingInput label="Beds" type="number" min="1" {...register('beds')} error={errors.beds?.message} />
              <FloatingInput label="Bathrooms" type="number" min="0" step="0.5" {...register('bathrooms')} error={errors.bathrooms?.message} />
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Policies */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="flex items-center gap-2.5 border-b bg-muted/30 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IndianRupee className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Pricing & Policies</h2>
              <p className="text-xs text-muted-foreground">Set your rates and booking rules</p>
            </div>
          </div>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <FloatingInput label="Base Price (per night)" type="number" min="1" {...register('basePrice')} error={errors.basePrice?.message} />
              <FloatingInput label="Cleaning Fee" type="number" min="0" {...register('cleaningFee')} error={errors.cleaningFee?.message} />
              <FloatingInput label="Minimum Stay (nights)" type="number" min="1" {...register('minimumStay')} error={errors.minimumStay?.message} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label className="mb-1.5 text-xs font-medium text-muted-foreground">Check-in Time</Label>
                <Input type="time" className="h-[3.25rem]" {...register('checkInTime')} />
              </div>
              <div>
                <Label className="mb-1.5 text-xs font-medium text-muted-foreground">Check-out Time</Label>
                <Input type="time" className="h-[3.25rem]" {...register('checkOutTime')} />
              </div>
              <div>
                <Label className="mb-1.5 text-xs font-medium text-muted-foreground">Cancellation Policy</Label>
                <Select value={cancellationPolicy} onValueChange={(v) => setValue('cancellationPolicy', v as CancellationPolicy, { shouldValidate: true })}>
                  <SelectTrigger className="w-full h-[3.25rem]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cancellationPolicies.map((p) => (
                      <SelectItem key={p} value={p}>{formatLabel(p)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-input bg-muted/20 px-4 py-3.5 transition-colors hover:bg-muted/40">
              <input
                type="checkbox"
                checked={instantBook}
                onChange={(e) => setValue('instantBook', e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <div>
                <span className="text-sm font-medium">Allow instant booking</span>
                <p className="text-xs text-muted-foreground">Guests can book without waiting for your approval</p>
              </div>
            </label>
          </CardContent>
        </Card>

        {/* Amenities */}
        {Object.keys(amenitiesByCategory).length > 0 && (
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="flex items-center gap-2.5 border-b bg-muted/30 px-6 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Amenities</h2>
                <p className="text-xs text-muted-foreground">What does your place offer?</p>
              </div>
            </div>
            <CardContent className="space-y-5 p-6">
              {Object.entries(amenitiesByCategory).map(([category, items]) => (
                <div key={category}>
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{category}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((amenity) => (
                      <Badge
                        key={amenity.id}
                        variant={selectedAmenities.includes(amenity.id) ? 'default' : 'outline'}
                        className="cursor-pointer px-3 py-1.5 text-sm transition-all hover:shadow-sm"
                        onClick={() => toggleAmenity(amenity.id)}
                      >
                        {amenity.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* House Rules (live CRUD) */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="flex items-center gap-2.5 border-b bg-muted/30 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ScrollText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">House Rules</h2>
              <p className="text-xs text-muted-foreground">Set expectations for your guests</p>
            </div>
          </div>
          <CardContent className="space-y-4 p-6">
            <div className="flex gap-2">
              <FloatingInput
                label="Add a rule (e.g. No smoking)"
                value={ruleInput}
                onChange={(e) => setRuleInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRule(); } }}
                className="flex-1"
              />
              <Button type="button" variant="outline" className="h-[3.25rem] px-5" onClick={handleAddRule} disabled={isAddingRule}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {listing.houseRules && listing.houseRules.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {listing.houseRules.map((rule) => (
                  <Badge key={rule.id} variant="secondary" className="gap-1.5 py-1.5 pl-3 pr-2">
                    {rule.ruleText}
                    <button type="button" onClick={() => handleDeleteRule(rule.id)} className="rounded-full p-0.5 hover:bg-muted-foreground/20">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" size="lg" disabled={isSubmitting} className="px-8">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" size="lg" asChild>
            <Link href={`/listings/${id}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
