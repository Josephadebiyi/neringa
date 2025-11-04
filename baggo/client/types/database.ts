export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  kyc_verified: boolean;
  kyc_status: 'pending' | 'verified' | 'rejected' | 'approved';
  total_trips: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
};

export type Trip = {
  id: string;
  traveler_id: string;
  from_location: string;
  to_location: string;
  departure_date: string;
  arrival_date: string;
  mode_of_travel: 'flight' | 'train' | 'bus' | 'car';
  available_kg: number;
  remaining_kg: number;
  price_per_kg: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
};

export type Parcel = {
  id: string;
  sender_id: string;
  from_location: string;
  to_location: string;
  weight_kg: number;
  description: string;
  item_value: number;
  insurance_opted: boolean;
  status: 'searching' | 'matched' | 'in_transit' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
};

export type Package = Parcel;

export type Booking = {
  id: string;
  parcel_id: string;
  trip_id: string;
  sender_id: string;
  traveler_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  shipping_fee: number;
  app_fee: number;
  insurance_fee: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  booking_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: boolean;
  created_at: string;
};

export type Rating = {
  id: string;
  booking_id: string;
  rated_by: string;
  rated_user: string;
  rating: number;
  review: string | null;
  created_at: string;
};

export type Wallet = {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  wallet_id: string;
  booking_id: string | null;
  type: 'credit' | 'debit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  created_at: string;
};

export type PaymentMethod = {
  id: string;
  user_id: string;
  type: 'apple_pay' | 'paypal' | 'card';
  details: any;
  is_default: boolean;
  created_at: string;
};

export type TripWithProfile = Trip & {
  profiles: Profile;
};

export type BookingWithDetails = Booking & {
  parcels: Parcel;
  trips: Trip;
  sender: Profile;
  traveler: Profile;
};
