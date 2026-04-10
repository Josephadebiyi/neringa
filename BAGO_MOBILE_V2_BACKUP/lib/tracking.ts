import api from './api';
import { API_ENDPOINTS } from './config';

export interface TrackingLocation {
  id: string;
  packageId: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
  status: 'picked_up' | 'in_transit' | 'customs' | 'out_for_delivery' | 'delivered';
  description?: string;
  timestamp: string;
  createdAt: string;
}

export interface PackageTracking {
  trackingNumber: string;
  packageId: string;
  currentStatus: string;
  currentLocation?: TrackingLocation;
  locations: TrackingLocation[];
  estimatedDelivery?: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  traveler?: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
  };
  package: {
    title: string;
    weight: number;
    category: string;
    fromCountry: string;
    fromCity: string;
    toCountry: string;
    toCity: string;
  };
}

export interface UpdateLocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city: string;
  country: string;
  status: 'picked_up' | 'in_transit' | 'customs' | 'out_for_delivery' | 'delivered';
  description?: string;
}

class TrackingService {
  /**
   * Track a package by tracking number
   */
  async trackPackage(trackingNumber: string): Promise<PackageTracking> {
    try {
      const response = await api.get(`${API_ENDPOINTS.TRACK_PACKAGE}/${trackingNumber}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to track package');
    }
  }

  /**
   * Get tracking history for a package
   */
  async getTrackingHistory(packageId: string): Promise<TrackingLocation[]> {
    try {
      const response = await api.get(`${API_ENDPOINTS.PACKAGES}/${packageId}/tracking`);
      return response.data.locations;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch tracking history');
    }
  }

  /**
   * Update package location (for travelers)
   */
  async updatePackageLocation(
    packageId: string,
    data: UpdateLocationData
  ): Promise<{ success: boolean; location: TrackingLocation }> {
    try {
      const response = await api.post(`${API_ENDPOINTS.PACKAGES}/${packageId}/location`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update package location');
    }
  }

  /**
   * Mark package as picked up
   */
  async markAsPickedUp(
    packageId: string,
    location: { latitude: number; longitude: number; address: string; city: string; country: string }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`${API_ENDPOINTS.PACKAGES}/${packageId}/pickup`, {
        ...location,
        status: 'picked_up'
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark package as picked up');
    }
  }

  /**
   * Mark package as delivered
   */
  async markAsDelivered(
    packageId: string,
    data: {
      latitude: number;
      longitude: number;
      address: string;
      city: string;
      country: string;
      recipientName?: string;
      recipientSignature?: string;
      deliveryPhoto?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`${API_ENDPOINTS.PACKAGES}/${packageId}/deliver`, {
        ...data,
        status: 'delivered'
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark package as delivered');
    }
  }

  /**
   * Get all packages being tracked by the user
   */
  async getMyTrackedPackages(): Promise<PackageTracking[]> {
    try {
      const response = await api.get(API_ENDPOINTS.MY_TRACKED_PACKAGES);
      return response.data.packages;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch tracked packages');
    }
  }

  /**
   * Get all packages currently being delivered by the traveler
   */
  async getMyDeliveries(status?: string): Promise<PackageTracking[]> {
    try {
      const params = status ? { status } : {};
      const response = await api.get(API_ENDPOINTS.MY_DELIVERIES, { params });
      return response.data.packages;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch deliveries');
    }
  }

  /**
   * Get estimated delivery time
   */
  async getEstimatedDelivery(packageId: string): Promise<{
    estimatedDate: string;
    confidence: 'high' | 'medium' | 'low';
    factors: string[];
  }> {
    try {
      const response = await api.get(`${API_ENDPOINTS.PACKAGES}/${packageId}/estimate`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get delivery estimate');
    }
  }

  /**
   * Report an issue with a package
   */
  async reportIssue(packageId: string, data: {
    type: 'damaged' | 'lost' | 'delayed' | 'other';
    description: string;
    photos?: string[];
  }): Promise<{ success: boolean; issueId: string; message: string }> {
    try {
      const response = await api.post(`${API_ENDPOINTS.PACKAGES}/${packageId}/report`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to report issue');
    }
  }

  /**
   * Get current GPS location of package (if available)
   */
  async getCurrentLocation(packageId: string): Promise<{
    latitude: number;
    longitude: number;
    address: string;
    lastUpdated: string;
  } | null> {
    try {
      const response = await api.get(`${API_ENDPOINTS.PACKAGES}/${packageId}/current-location`);
      return response.data.location;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // Location not available
      }
      throw new Error(error.response?.data?.message || 'Failed to get current location');
    }
  }

  /**
   * Subscribe to package tracking updates
   * Returns a function to unsubscribe
   */
  subscribeToPackageUpdates(
    packageId: string,
    onUpdate: (location: TrackingLocation) => void
  ): () => void {
    // This would typically use WebSocket or Server-Sent Events
    // For now, we'll use polling as a fallback
    const intervalId = setInterval(async () => {
      try {
        const history = await this.getTrackingHistory(packageId);
        if (history.length > 0) {
          onUpdate(history[0]); // Send latest location
        }
      } catch (error) {
        console.error('Error polling package updates:', error);
      }
    }, 30000); // Poll every 30 seconds

    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  /**
   * Get delivery proof (signature, photo, etc.)
   */
  async getDeliveryProof(packageId: string): Promise<{
    recipientName?: string;
    signature?: string;
    photo?: string;
    deliveredAt: string;
    location: {
      latitude: number;
      longitude: number;
      address: string;
    };
  }> {
    try {
      const response = await api.get(`${API_ENDPOINTS.PACKAGES}/${packageId}/delivery-proof`);
      return response.data.proof;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get delivery proof');
    }
  }
}

export default new TrackingService();
