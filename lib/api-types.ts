/**
 * Minimal shapes for JSON payloads returned by this app's API routes.
 * MongoDB documents are serialized to JSON, so `_id` arrives as a string.
 */

export type ApiEquipment = {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  category?: string;
  location?: string;
  rentalPrice?: number | string;
  price?: number | string;
  rentalType?: string;
  availableQuantity?: number | string;
  condition?: string;
  brand?: string;
  model?: string;
  image?: string;
  img?: string;
  terms?: string;
  status?: string;
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  rating?: number;
  reviewCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiReview = {
  _id?: string;
  id?: string;
  equipmentId?: string;
  bookingId?: string;
  renterId?: string;
  renterEmail?: string;
  renterName?: string;
  renterImage?: string;
  rating?: number;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiReviewStats = {
  averageRating?: number;
  totalReviews?: number;
  ratingBreakdown?: Record<number, number>;
};

export type ApiBooking = {
  _id?: string;
  id?: string;
  renterId?: string;
  ownerId?: string;
  renterName?: string;
  ownerName?: string;
  equipmentId?: string;
  equipmentName?: string;
  equipmentImage?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  quantity?: number | string;
  contactNumber?: string;
  deliveryAddress?: string;
  amount?: number | string;
  /** Total price for newer records (amount kept for backward compatibility). */
  totalPrice?: number | string;
  notes?: string;
  paymentStatus?: string;
  status?: string;
  stripeSessionId?: string;
  createdAt?: string;
};

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "active";

export type ApiFavorite = {
  _id?: string;
  id?: string;
  equipmentId?: string;
  equipmentName?: string;
  createdAt?: string;
};

export type ApiUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  activeRole?: string;
  roles?: string[];
  createdAt?: string;
};
