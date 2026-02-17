/**
 * Shipment Assessment API Service
 * Handles all shipment assessment, customs compliance, and PDF generation calls
 */

import api from './api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

const API_BASE = '';

/**
 * Assess shipment compatibility and get risk scores
 */
export async function assessShipment(tripId: string, item: ItemDetails, senderCountry?: string) {
  try {
    const response = await api.post(`${API_BASE}/api/shipment/assess`, {
      tripId,
      item,
      senderCountry: senderCountry || 'GB'
    });
    return response.data;
  } catch (error: any) {
    console.error('Assessment error:', error);
    throw new Error(error.response?.data?.message || 'Failed to assess shipment');
  }
}

/**
 * Quick compatibility check for filtering trips
 */
export async function quickCompatibilityCheck(trips: any[], item: ItemDetails) {
  try {
    const response = await api.post(`${API_BASE}/api/shipment/quick-check`, {
      trips,
      item
    });
    return response.data;
  } catch (error: any) {
    console.error('Quick check error:', error);
    throw new Error(error.response?.data?.message || 'Failed to check compatibility');
  }
}

/**
 * Search for compatible trips based on item details
 */
export async function searchCompatibleTrips(params: SearchParams) {
  try {
    const response = await api.post(`${API_BASE}/api/trips/search-compatible`, params);
    return response.data;
  } catch (error: any) {
    console.error('Search compatible trips error:', error);
    throw new Error(error.response?.data?.message || 'Failed to search trips');
  }
}

/**
 * Get customs rules for a specific country
 */
export async function getCustomsRules(countryCode: string) {
  try {
    const response = await api.get(`${API_BASE}/api/customs/rules/${countryCode}`);
    return response.data;
  } catch (error: any) {
    console.error('Get customs rules error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get customs rules');
  }
}

/**
 * Get all HS codes
 */
export async function getHSCodes() {
  try {
    const response = await api.get(`${API_BASE}/api/customs/hs-codes`);
    return response.data;
  } catch (error: any) {
    console.error('Get HS codes error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get HS codes');
  }
}

/**
 * Generate and download customs declaration PDF
 */
export async function downloadCustomsPDF(declarationData: DeclarationData) {
  try {
    const response = await api.post(`${API_BASE}/api/shipment/generate-pdf`, {
      declarationData
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to generate PDF');
    }

    const { pdf, filename } = response.data;
    
    // Convert base64 to file and share/download
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, pdf, {
      encoding: FileSystem.EncodingType.Base64
    });

    // Check if sharing is available
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Download Customs Declaration'
      });
    }

    return {
      success: true,
      fileUri,
      filename
    };
  } catch (error: any) {
    console.error('PDF download error:', error);
    throw new Error(error.response?.data?.message || 'Failed to download PDF');
  }
}

/**
 * Get assessment history
 */
export async function getAssessmentHistory() {
  try {
    const response = await api.get(`${API_BASE}/api/shipment/history`);
    return response.data;
  } catch (error: any) {
    console.error('Get history error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get assessment history');
  }
}

// Types
export interface ItemDetails {
  type: string;
  category: string;
  value: number;
  quantity: number;
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface SearchParams {
  fromCountry?: string;
  fromCity?: string;
  toCountry?: string;
  toCity?: string;
  item: ItemDetails;
}

export interface AssessmentResult {
  success: boolean;
  assessment: {
    timestamp: string;
    tripId: string;
    itemId: string;
    travelerId: string;
    compatibility: {
      status: 'Yes' | 'No' | 'Conditional';
      reasons: string[];
      transportMode: string;
      destinationCountry: string;
    };
    confidenceScore: number;
    riskClassification: {
      borderCustomsRisk: number;
      delayRisk: number;
      damageRisk: number;
      confiscationRisk: number;
      overall: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    };
    customs: {
      hsCode: string;
      hsDescription: string;
      estimatedDuty: number;
      estimatedVAT: number;
      totalTaxes: number;
      requiredDocuments: string[];
    };
    requirements: {
      packaging: string[];
      labeling: string[];
      declaration: string[];
      handling: string[];
    };
    priceEstimate: {
      basePrice: number;
      riskPremium: number;
      urgencyPremium: number;
      totalPrice: number;
      currency: string;
    };
    declarationData: DeclarationData;
  };
}

export interface DeclarationData {
  shipmentId: string;
  generatedAt: string;
  origin: { city: string; country: string };
  destination: { city: string; country: string };
  transportMode: string;
  departureDate: string;
  item: {
    description: string;
    category: string;
    quantity: number;
    weight: number;
    dimensions: any;
    declaredValue: number;
    currency: string;
  };
  customs: {
    hsCode: string;
    hsDescription: string;
    estimatedDuty: number;
    estimatedVAT: number;
    totalTaxes: number;
  };
  traveler: {
    name: string;
    rating: number;
    completedTrips: number;
  };
  declarationText: string;
}

export default {
  assessShipment,
  quickCompatibilityCheck,
  searchCompatibleTrips,
  getCustomsRules,
  getHSCodes,
  downloadCustomsPDF,
  getAssessmentHistory
};
