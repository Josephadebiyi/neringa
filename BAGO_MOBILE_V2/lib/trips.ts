import api from './api';
import { API_ENDPOINTS } from './config';

export interface Trip {
  id: string;
  userId: string;
  fromCountry: string;
  fromCity: string;
  toCountry: string;
  toCity: string;
  departureDate: string;
  arrivalDate: string;
  availableWeight: number;
  pricePerKg: number;
  status: 'active' | 'completed' | 'cancelled';
  packageRequests?: PackageRequest[];
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
  fromCity: string;
  toCountry: string;
  toCity: string;
  departureDate: string;
  arrivalDate: string;
  availableWeight: number;
  pricePerKg: number;
  description?: string;
}

export interface SearchTripsParams {
  fromCountry?: string;
  fromCity?: string;
  toCountry?: string;
  toCity?: string;
  departureDate?: string;
  minAvailableWeight?: number;
  maxPricePerKg?: number;
  page?: number;
  limit?: number;
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
  async getMyTrips(status?: 'active' | 'completed' | 'cancelled'): Promise<Trip[]> {
    try {
      const params = status ? { status } : {};
      const response = await api.get(API_ENDPOINTS.MY_TRIPS, { params });
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
   * Search for available trips
   */
  async searchTrips(params: SearchTripsParams): Promise<{ trips: Trip[]; total: number; page: number }> {
    try {
      const response = await api.get(API_ENDPOINTS.SEARCH_TRIPS, { params });
      return response.data;
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
   * Cancel a trip
   */
  async cancelTrip(tripId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.patch(`${API_ENDPOINTS.TRIPS}/${tripId}/cancel`, { reason });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to cancel trip');
    }
  }

  /**
   * Complete a trip
   */
  async completeTrip(tripId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.patch(`${API_ENDPOINTS.TRIPS}/${tripId}/complete`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to complete trip');
    }
  }

  /**
   * Get package requests for a trip
   */
  async getTripRequests(tripId: string): Promise<PackageRequest[]> {
    try {
      const response = await api.get(`${API_ENDPOINTS.TRIPS}/${tripId}/requests`);
      return response.data.requests;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch trip requests');
    }
  }

  /**
   * Accept a package request
   */
  async acceptPackageRequest(
    requestId: string,
    data?: { message?: string }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`${API_ENDPOINTS.PACKAGE_REQUESTS}/${requestId}/accept`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to accept package request');
    }
  }

  /**
   * Reject a package request
   */
  async rejectPackageRequest(
    requestId: string,
    data?: { reason?: string }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`${API_ENDPOINTS.PACKAGE_REQUESTS}/${requestId}/reject`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reject package request');
    }
  }

  /**
   * Send a package request to a traveler
   */
  async sendPackageRequest(data: {
    packageId: string;
    tripId: string;
    offeredPrice: number;
    message?: string;
  }): Promise<{ success: boolean; requestId: string; message: string }> {
    try {
      const response = await api.post(API_ENDPOINTS.SEND_PACKAGE_REQUEST, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send package request');
    }
  }

  /**
   * Get all package requests sent by the user
   */
  async getMyPackageRequests(status?: 'pending' | 'accepted' | 'rejected' | 'delivered'): Promise<PackageRequest[]> {
    try {
      const params = status ? { status } : {};
      const response = await api.get(API_ENDPOINTS.MY_PACKAGE_REQUESTS, { params });
      return response.data.requests;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch package requests');
    }
  }
}

export default new TripService();
