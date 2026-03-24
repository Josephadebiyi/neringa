import api from './api';
import { API_ENDPOINTS } from './config';

export interface Package {
  id: string;
  title: string;
  description: string;
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  category: string;
  value: number;
  fromCountry: string;
  fromCity: string;
  toCountry: string;
  toCity: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupDate?: string;
  deliveryDate?: string;
  status: 'pending' | 'matched' | 'in_transit' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  images?: string[];
  senderId: string;
  travelerId?: string;
  price: number;
  insurance?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePackageData {
  title: string;
  description: string;
  weight: number;
  packageWeight?: number; // Backend uses this
  category: string;
  value: number;
  fromCountry: string;
  fromCity: string;
  toCountry: string;
  toCity: string;
  receiverName: string;
  receiverPhone: string;
  receiverEmail?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupDate?: string;
  images?: any[];
  image?: any;
  insurance?: boolean;
}

export interface SearchFilters {
  fromCountry?: string;
  toCountry?: string;
  departureDate?: string;
  weight?: number;
  sortBy?: 'price' | 'date' | 'rating';
}

class PackageService {
  /**
   * Create a new package request
   */
  async createPackage(data: CreatePackageData): Promise<Package> {
    const formData = new FormData();

    // Append text fields
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'images' && value !== undefined) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Append images
    if (data.images && data.images.length > 0) {
      data.images.forEach((image, index) => {
        formData.append('images', image);
      });
    }

    const response = await api.post<{ package: Package }>(
      API_ENDPOINTS.PACKAGE_CREATE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.package;
  }

  /**
   * Get all packages
   */
  async getPackages(filters?: SearchFilters): Promise<Package[]> {
    const response = await api.get<{ packages: Package[] }>(
      API_ENDPOINTS.PACKAGES,
      { params: filters }
    );

    return response.data.packages;
  }

  /**
   * Get user's packages
   */
  async getMyPackages(): Promise<Package[]> {
    const response = await api.get<{ packages: Package[] }>(API_ENDPOINTS.MY_PACKAGES);
    return response.data.packages;
  }

  /**
   * Get package details
   */
  async getPackageDetails(id: string): Promise<Package> {
    const url = API_ENDPOINTS.PACKAGE_DETAIL.replace(':id', id);
    const response = await api.get<{ package: Package }>(url);
    return response.data.package;
  }

  /**
   * Update package
   */
  async updatePackage(id: string, data: Partial<CreatePackageData>): Promise<Package> {
    const response = await api.put<{ package: Package }>(
      `${API_ENDPOINTS.PACKAGE_UPDATE}/${id}`,
      data
    );

    return response.data.package;
  }

  /**
   * Delete package
   */
  async deletePackage(id: string): Promise<{ message: string }> {
    const response = await api.delete(`${API_ENDPOINTS.PACKAGE_DELETE}/${id}`);
    return response.data;
  }

  /**
   * Search for travelers
   */
  async searchTravelers(filters: {
    fromCountry: string;
    toCountry: string;
    departureDate?: string;
    weight?: number;
  }): Promise<any[]> {
    const response = await api.get(API_ENDPOINTS.SEARCH_TRAVELERS, {
      params: filters,
    });

    return response.data.travelers;
  }

  /**
   * Track package
   */
  async trackPackage(trackingNumber: string): Promise<{
    package: Package;
    locations: Array<{
      location: string;
      timestamp: string;
      status: string;
      note?: string;
    }>;
  }> {
    const url = API_ENDPOINTS.TRACK_PACKAGE.replace(':trackingNumber', trackingNumber);
    const response = await api.get(url);
    return response.data;
  }

  /**
   * Get package requests (for travelers)
   */
  async getPackageRequests(): Promise<any[]> {
    const response = await api.get(API_ENDPOINTS.PACKAGE_REQUESTS);
    return response.data.requests;
  }

  /**
   * Accept package request
   */
  async acceptRequest(requestId: string): Promise<{ message: string }> {
    const response = await api.post(`${API_ENDPOINTS.ACCEPT_REQUEST}/${requestId}`);
    return response.data;
  }

  /**
   * Reject package request
   */
  async rejectRequest(requestId: string, reason?: string): Promise<{ message: string }> {
    const response = await api.post(`${API_ENDPOINTS.REJECT_REQUEST}/${requestId}`, {
      reason,
    });

    return response.data;
  }
}

export default new PackageService();
