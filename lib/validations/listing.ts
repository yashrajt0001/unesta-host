import { z } from 'zod';

const propertyTypes = ['APARTMENT', 'HOUSE', 'VILLA', 'COTTAGE', 'CABIN', 'STUDIO', 'HOTEL', 'UNIQUE'] as const;
const roomTypes = ['ENTIRE_PLACE', 'PRIVATE_ROOM', 'SHARED_ROOM'] as const;
const cancellationPolicies = ['FLEXIBLE', 'MODERATE', 'FIRM'] as const;

export const createListingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(50, 'Title must be at most 50 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(500, 'Description must be at most 500 characters'),
  propertyType: z.enum(propertyTypes, { message: 'Select a property type' }),
  roomType: z.enum(roomTypes, { message: 'Select a room type' }),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  postalCode: z.string().optional(),
  latitude: z.string(),
  longitude: z.string(),
  maxGuests: z.coerce.number().int().positive('Max guests must be at least 1'),
  bedrooms: z.coerce.number().int().min(0, 'Bedrooms cannot be negative'),
  beds: z.coerce.number().int().positive('Beds must be at least 1'),
  bathrooms: z.coerce.number().positive('Bathrooms must be at least 1'),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  basePrice: z.coerce.number().positive('Base price must be greater than 0'),
  cleaningFee: z.coerce.number().min(0, 'Cleaning fee cannot be negative'),
  minimumStay: z.coerce.number().int().positive('Minimum stay must be at least 1'),
  cancellationPolicy: z.enum(cancellationPolicies),
  instantBook: z.boolean(),
});

export type CreateListingFormValues = z.infer<typeof createListingSchema>;
