/**
 * Minimal shapes for JSON payloads returned by this app's API routes.
 * MongoDB documents are serialized to JSON, so `_id` arrives as a string.
 */

export type ApiEquipment = {
  _id?: string;
  id?: string;
  name?: string;
  category?: string;
  price?: number | string;
  availableQuantity?: number | string;
  status?: string;
  ownerId?: string;
  ownerName?: string;
  createdAt?: string;
};

export type ApiBooking = {
  _id?: string;
  id?: string;
  renterId?: string;
  ownerId?: string;
  renterName?: string;
  ownerName?: string;
  equipmentName?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  amount?: number | string;
  paymentStatus?: string;
  status?: string;
  createdAt?: string;
};

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
