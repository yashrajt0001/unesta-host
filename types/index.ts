// ─── User / Auth ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  avatarUrl: string | null;
  bio: string | null;
  dateOfBirth: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null;
  role: string;
  isPhoneVerified: boolean;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Listings ────────────────────────────────────────────────────────────────

export type PropertyType = 'APARTMENT' | 'HOUSE' | 'VILLA' | 'COTTAGE' | 'CABIN' | 'STUDIO' | 'HOTEL' | 'UNIQUE';
export type RoomType = 'ENTIRE_PLACE' | 'PRIVATE_ROOM' | 'SHARED_ROOM';
export type ListingStatus = 'DRAFT' | 'PUBLISHED' | 'UNLISTED' | 'SUSPENDED';
export type CancellationPolicy = 'FLEXIBLE' | 'MODERATE' | 'FIRM';

export interface ListingImage {
  id: string;
  url: string;
  sortOrder: number;
  isCover: boolean;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string | null;
  category: string;
}

export interface HouseRule {
  id: string;
  ruleText: string;
}

export interface Listing {
  id: string;
  hostId: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  roomType: RoomType;
  status: ListingStatus;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  checkInTime: string | null;
  checkOutTime: string | null;
  basePrice: number;
  cleaningFee: number;
  minimumStay: number;
  cancellationPolicy: CancellationPolicy;
  instantBook: boolean;
  images: ListingImage[];
  amenities: Amenity[];
  houseRules: HouseRule[];
  createdAt: string;
  updatedAt: string;
}

export interface ListingAvailability {
  date: string;
  isAvailable: boolean;
  customPrice: number | null;
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'DECLINED';

export interface Booking {
  id: string;
  listingId: string;
  guestId: string;
  hostId: string;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number;
  numNights: number;
  basePrice: number;
  cleaningFee: number;
  serviceFee: number;
  hostServiceFee: number;
  totalPrice: number;
  hostPayout: number;
  status: BookingStatus;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  listing?: {
    id: string;
    title: string;
    city: string;
    state: string;
    images: ListingImage[];
  };
  guest?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    phone: string;
  };
}

// ─── Host Dashboard ──────────────────────────────────────────────────────────

export interface DashboardOverview {
  upcomingBookings: Booking[];
  pendingBookingsCount: number;
  unreadMessagesCount: number;
  recentReviews: Review[];
  monthlyEarnings: number;
  totalListings: number;
}

export interface EarningsSummary {
  totalBookings: number;
  grossRevenue: number;
  platformFees: number;
  netEarnings: number;
}

export interface EarningsData {
  bookings: Booking[];
  summary: EarningsSummary;
}

export interface ListingAnalytics {
  listingId: string;
  title: string;
  completedBookings: number;
  totalNights: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
  adr: number;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  listingId: string;
  rating: number;
  comment: string;
  hostResponse: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  reviewer?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  listing?: {
    id: string;
    title: string;
  };
}

// ─── Messages ────────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  participants: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  }[];
  lastMessage?: Message;
  isArchived: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
