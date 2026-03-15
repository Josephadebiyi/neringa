import z from "zod";

// User schemas
export const UserSchema = z.object({
  id: z.number(),
  email: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  phone: z.string().nullable(),
  country: z.string().nullable(),
  age: z.number().nullable(),
  gender: z.string().nullable(),
  is_active: z.boolean(),
  is_verified: z.boolean(),
  user_type: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const TravelerSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  rating: z.number(),
  total_trips: z.number(),
  verification_status: z.string(),
  travel_preferences: z.string().nullable(),
  is_available: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ItemSchema = z.object({
  id: z.number(),
  sender_id: z.number(),
  traveler_id: z.number().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  weight: z.number().nullable(),
  dimensions: z.string().nullable(),
  category: z.string().nullable(),
  estimated_value: z.number().nullable(),
  pickup_address: z.string().nullable(),
  delivery_address: z.string().nullable(),
  pickup_country: z.string().nullable(),
  delivery_country: z.string().nullable(),
  status: z.string(),
  tracking_number: z.string().nullable(),
  price: z.number().nullable(),
  commission_rate: z.number(),
  commission_amount: z.number().nullable(),
  special_instructions: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const SupportTicketSchema = z.object({
  id: z.number(),
  user_id: z.number().nullable(),
  subject: z.string(),
  description: z.string(),
  status: z.string(),
  priority: z.string(),
  assigned_to: z.number().nullable(),
  category: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const WithdrawalRequestSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  amount: z.number(),
  payment_method: z.string().nullable(),
  payment_details: z.string().nullable(),
  status: z.string(),
  processed_by: z.number().nullable(),
  processed_at: z.string().nullable(),
  failure_reason: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const DashboardStatsSchema = z.object({
  totalUsers: z.number(),
  totalTravelers: z.number(),
  totalItems: z.number(),
  totalOrders: z.number(),
  totalCommission: z.number(),
  totalIncome: z.number(),
  pendingTickets: z.number(),
  pendingWithdrawals: z.number(),
  recentVisitors: z.number(),
});

// Type exports
export type UserType = z.infer<typeof UserSchema>;
export type TravelerType = z.infer<typeof TravelerSchema>;
export type ItemType = z.infer<typeof ItemSchema>;
export type SupportTicketType = z.infer<typeof SupportTicketSchema>;
export type WithdrawalRequestType = z.infer<typeof WithdrawalRequestSchema>;
export type DashboardStatsType = z.infer<typeof DashboardStatsSchema>;

// Navigation items for dashboard
export interface NavItem {
  icon: string;
  label: string;
  path: string;
  badge?: number;
}

// Item status options
export const ITEM_STATUSES = [
  'pending',
  'matched', 
  'picked_up',
  'in_transit',
  'customs',
  'delivered',
  'cancelled'
] as const;

export const SUPPORT_STATUSES = [
  'open',
  'in_progress', 
  'resolved',
  'closed'
] as const;

export const WITHDRAWAL_STATUSES = [
  'pending',
  'approved',
  'processed',
  'failed',
  'cancelled'
] as const;
