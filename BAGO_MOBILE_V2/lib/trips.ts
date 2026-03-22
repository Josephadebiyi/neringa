import api from './api';
import { API_ENDPOINTS } from './config';

export interface Trip {
  id: string;
  userId: string;
  fromCountry: string;
  fromLocation: string;
  toCountry: string;
  toLocation: string;
  departureDate: string;
  arrivalDate: string;
  availableKg: number;
  pricePerKg: number;
  status: string;
  travelMeans: string;
  currency: string;
  packageRequests?: PackageRequest[];
  reviews?: any[];
  averageRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PackageRequest {
  id: string;
  packageId: string;
  tripId: string;
  senderId: string;
  travelerId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'delivered';
  offeredPrice: number;
  message?: string;
  package?: {
    id: string;
    title: string;
    weight: number;
    category: string;
  };
  createdAt: string;
}

export interface CreateTripData {
  fromCountry: string;
  fromLocation: string;
  toCountry: string;
  toLocation: string;
  departureDate: string;
  arrivalDate: string;
  availableKg: number;
  pricePerKg: number;
  currency: string;
  travelMeans: string;
  landmark?: string;
  travelDocument?: string | null;
}

export interface SearchTripsParams {
  fromCountry?: string;
  fromLocation?: string;
  toCountry?: string;
  toLocation?: string;
  departureDate?: string;
  minAvailableKg?: number;
  maxPricePerKg?: number;
}

class TripService {
  /**
   * Create a new trip
   */
  async createTrip(data: CreateTripData): Promise<Trip> {
    try {
      const response = await api.post(API_ENDPOINTS.CREATE_TRIP, data);
      return response.data.trip;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create trip');
    }
  }

  /**
   * Get all trips for the current user
   */
  async getMyTrips(): Promise<Trip[]> {
    try {
      const response = await api.get(API_ENDPOINTS.MY_TRIPS);
      return response.data.trips;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch trips');
    }
  }

  /**
   * Get a single trip by ID
   */
  async getTripById(tripId: string): Promise<Trip> {
    try {
      const response = await api.get(`${API_ENDPOINTS.TRIPS}/${tripId}`);
      return response.data.trip;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch trip');
    }
  }

  /**
   * Search for available travelers
   */
  async searchTrips(params?: SearchTripsParams): Promise<{ trips: any[]; users: any[] }> {
    try {
      const response = await api.get(API_ENDPOINTS.SEARCH_TRIPS, { params });
      return {
        trips: response.data.data.gettravelers,
        users: response.data.data.findUsers
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to search trips');
    }
  }

  /**
   * Update trip details
   */
  async updateTrip(tripId: string, data: Partial<CreateTripData>): Promise<Trip> {
    try {
      const response = await api.put(`${API_ENDPOINTS.TRIPS}/${tripId}`, data);
      return response.data.trip;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update trip');
    }
  }

  /**
   * Cancel/Delete a trip
   */
  async cancelTrip(tripId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`${API_ENDPOINTS.TRIPS}/${tripId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete trip');
    }
  }

  /**
   * Get requests for a trip
   */
  async getTripRequests(tripId: string): Promise<PackageRequest[]> {
    try {
      const response = await api.get(`${API_ENDPOINTS.MY_REQUESTS}/${tripId}`);
      return response.data.requests;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch trip requests');
    }
  }

  /**
   * Update request status (Accept/Reject)
   */
  async updateRequestStatus(requestId: string, status: string): Promise<any> {
    try {
      const response = await api.put(`${API_ENDPOINTS.ACCEPT_REQUEST}/${requestId}`, { status });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update request');
    }
  }

  /**
   * Create/Request a package
   */
  async requestPackage(data: {
    tripId: string;
    packageId: string;
    offeredPrice: number;
    message?: string;
  }): Promise<any> {
    try {
      const response = await api.post(API_ENDPOINTS.CREATE_REQUEST, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send package request');
    }
  }
}

export default new TripService();
