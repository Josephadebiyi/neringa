import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MapPin, Calendar, Weight, Star, Plane, Shield, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react-native';
import axios from 'axios';
import { backendomain } from '@/utils/backendDomain';
import { Car, Bus, Train } from 'lucide-react-native';
import ShipmentAssessment from '@/components/ShipmentAssessment';
import ConfidenceScoreBadge, { CompatibilityBadge } from '@/components/ConfidenceScoreBadge';


const API_BASE_URL = `${backendomain.backendomain}/api/bago`;

export default function SearchTravelersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { fromCountry, fromCity, toCountry, toCity, packageWeight, packageId, amount, image, packageCategory, packageType, packageValue } = params;

  const [insurance, setInsurance] = useState(false);
  const [trips, setTrips] = useState<any[]>([]);
  const [matchedTrips, setMatchedTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssessment, setShowAssessment] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [tripScores, setTripScores] = useState<Record<string, any>>({});
  const [search, setSearch] = useState('');

  const weightNum = parseFloat((packageWeight as string)?.replace(/[^\d.]/g, '')) || 0;
  const amountNum = parseFloat(amount as string) || 0;
  const [insuranceCost, setInsuranceCost] = useState(0);
  const [insurancePercentage, setInsurancePercentage] = useState(0);
  const [insuranceDescription, setInsuranceDescription] = useState('Protect your package against loss or damage');

  // Item details for assessment
  const itemDetails = {
    type: packageType as string || 'general',
    category: packageCategory as string || 'household',
    value: parseFloat(packageValue as string) || amountNum,
    quantity: 1,
    weight: weightNum,
  };


  const travelMeansIcons = {
    plane: Plane,
    car: Car,
    bus: Bus,
    train: Train,
  };

  // Quick compatibility check on fetch
  const checkTripCompatibility = async (tripsList: any[]) => {
    try {
      const response = await axios.post(
        `${backendomain.backendomain}/api/shipment/quick-check`,
        { trips: tripsList, item: itemDetails }
      );

      if (response.data.success) {
        // Create a map of trip ID to compatibility status
        const scores: Record<string, any> = {};
        response.data.compatibleTrips.forEach((trip: any) => {
          scores[trip._id] = {
            compatible: true,
            status: trip.compatibility,
            reasons: trip.compatibilityReasons
          };
        });
        setTripScores(scores);
        return response.data.compatibleTrips;
      }
      return tripsList;
    } catch (error) {
      console.error('Compatibility check error:', error);
      return tripsList;
    }
  };

  useEffect(() => {
    const fetchInsuranceCost = async () => {
      try {
        const response = await axios.get(`${backendomain.backendomain}/api/insurance/calculate`, {
          params: {
            itemValue: itemDetails.value || amountNum,
            weight: itemDetails.weight || 1,
            currency: 'EUR', // Or any default based on context
          }
        });
        if (response.data.success && response.data.insurance) {
          setInsuranceCost(response.data.insurance.cost);
          setInsurancePercentage(response.data.insurance.percentageOfValue);
          if (response.data.insurance.description) {
            setInsuranceDescription(response.data.insurance.description);
          }
        } else {
          setInsuranceCost(amountNum * 0.030); // fallback
          setInsurancePercentage(3);
        }
      } catch (error) {
        console.error('Error fetching insurance cost:', error);
        setInsuranceCost(amountNum * 0.030); // fallback
      }
    };

    fetchInsuranceCost();
  }, [amountNum, itemDetails.value, itemDetails.weight]);

  useEffect(() => {
    const fetchTravelers = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/getTravelers`, {
          withCredentials: true,
        });

        const { findUsers, gettravelers } = response.data.data;

        // Map users to a lookup object
        const userMap = findUsers.reduce((acc: Record<string, any>, user: any) => {
          acc[user._id] = user;
          return acc;
        }, {});

        // Enrich trips with user data
        const enrichedTrips = gettravelers.map((trip: any) => ({
          ...trip,
          user: userMap[trip.user] || { _id: trip.user },
        }));

        // Filter active trips AND exclude own trips
        const profileRes = await axios.get(`${backendomain.backendomain}/api/bago/Profile`, { withCredentials: true });
        const currentUserId = profileRes.data?.data?.findUser?._id;

        const activeTrips = enrichedTrips.filter((trip: any) =>
          trip.status === 'active' && trip.user !== currentUserId
        );

        // Match trips to the package's route and weight
        const normalize = (str: any) => str?.trim().toLowerCase();

        const matched = activeTrips.filter((trip: any) => {
          const from = normalize(trip.fromLocation);
          const to = normalize(trip.toLocation);

          const fromMatch = !fromCity ||
            from?.includes(normalize(fromCity as string)) || from?.includes(normalize(fromCountry as string));
          const toMatch = !toCity ||
            to?.includes(normalize(toCity as string)) || to?.includes(normalize(toCountry as string));

          // Also filter by weight compatibility if weight is specified
          const weightMatch = weightNum > 0 ? (trip.availableKg >= weightNum) : true;

          return fromMatch && toMatch && weightMatch;
        });

        // Run compatibility check on matched trips
        const compatibleTrips = await checkTripCompatibility(matched);

        setTrips(activeTrips);
        setMatchedTrips(compatibleTrips.length > 0 ? compatibleTrips : matched);
      } catch (error: any) {
        console.error('Error fetching travelers:', error);
        const errorMessage =
          error.response?.data?.message || 'Failed to fetch travelers. Please try again.';
        Alert.alert('Error', errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTravelers();
  }, [fromCity, fromCountry, toCity, toCountry, weightNum]);

  const handleViewAssessment = (trip: any) => {
    setSelectedTrip(trip);
    setShowAssessment(true);
  };

  const handleProceedFromAssessment = (assessment: any) => {
    setShowAssessment(false);
    if (selectedTrip) {
      // Navigate to payment with assessment data
      router.push({
        pathname: '/payment',
        params: {
          tripId: selectedTrip._id,
          travelerId: selectedTrip.user._id,
          travellerName: `${selectedTrip.user.firstName || ''} ${selectedTrip.user.lastName || ''}`.trim(),
          amount: String(amountNum),
          packageId,
          insurance: insurance ? 'yes' : 'no',
          insuranceCost: insuranceCost.toFixed(2),
          confidenceScore: String(assessment.confidenceScore),
          riskLevel: assessment.riskClassification.overall,
        },
      });
    }
  };

  const handleSelectTraveler = async (tripId: string, travelerId: string, amount: string) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/RequestPackage`,
        {
          travelerId,
          packageId,
          tripId,
          amount, // ✅ send amount here
          insurance: insurance ? 'yes' : 'no',
          insuranceCost: insuranceCost.toFixed(2),
        },
        { withCredentials: true }
      );

      Alert.alert('Success', 'You have successfully sent the request', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating request:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to create request. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };


  return (
    <View style={[styles.container, { backgroundColor: '#F8F6F3' }]}>
      <View style={[styles.header, { backgroundColor: '#FFFFFF' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backIcon, { color: '#1A1A1A' }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#1A1A1A' }]}>Available Travelers</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {(fromCity || toCity) && (
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <MapPin size={18} color={'#5845D8'} />
              <Text style={styles.routeText}>
                {fromCity || 'Anywhere'}, {fromCountry || ''}
              </Text>
            </View>
            <Text style={styles.routeArrow}>→</Text>
            <View style={styles.routeRow}>
              <MapPin size={18} color={'#E8B86D'} />
              <Text style={styles.routeText}>
                {toCity || 'Anywhere'}, {toCountry || ''}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.insuranceCard}>
          <View style={styles.insuranceIcon}>
            <Shield size={24} color={'#5845D8'} />
          </View>
          <View style={styles.insuranceContent}>
            <Text style={styles.insuranceTitle}>Package Insurance</Text>
            <Text style={styles.insuranceSubtitle}>
              {insurancePercentage > 0 ? `${insurancePercentage}% of value` : 'Fixed Rate'} • Total: {insuranceCost.toFixed(2)}
            </Text>
            <Text style={styles.insuranceDesc}>
              {insuranceDescription}
            </Text>
          </View>
          <Switch
            value={insurance}
            onValueChange={setInsurance}
            trackColor={{ false: '#E5E5E5', true: '#5845D8' }}
            thumbColor={'#FFFFFF'}
          />
        </View>

        <Text style={styles.sectionTitle}>
          {isLoading ? 'Loading...' : (fromCity || toCity) ? `${matchedTrips.length} Travelers Match Your Route` : 'All Available Travelers'}
        </Text>

        {isLoading ? (
          <Text style={styles.loadingText}>Fetching travelers...</Text>
        ) : matchedTrips.length === 0 ? (
          <Text style={styles.noResultsText}>
            No travelers found for this route, but here are other available travelers
          </Text>
        ) : null}

        {trips.length > 0 ? (
          trips.map((trip: any) => (
            // <TouchableOpacity
            //   key={trip._id}
            //   style={[
            //     styles.tripCard,
            //     matchedTrips.includes(trip) ? styles.matchedTripCard : styles.nonMatchedTripCard,
            //   ]}
            //   onPress={() => handleSelectTraveler(trip._id, trip.user._id)}
            // >
            <TouchableOpacity
              key={trip._id}
              style={[
                styles.tripCard,
                matchedTrips.includes(trip)
                  ? styles.matchedTripCard
                  : styles.nonMatchedTripCard,
              ]}

              onPress={() => {
                if (!packageId) {
                  // If we came from Dashboard "Send an Item", we need to see traveler details first
                  router.push({
                    pathname: `/traveler-details/${trip._id}` as any,
                    params: {
                      tripId: trip._id,
                      name: trip.user?.firstName || 'Traveler',
                      travelerId: trip.user?._id,
                      rating: (trip.user?.average_rating ?? 0).toString(),
                      trips: (trip.user?.total_trips ?? 0).toString(),
                      verified: trip.user?.kycStatus === 'approved' ? 'true' : 'false',
                      from: trip.fromLocation || '',
                      to: trip.toLocation || '',
                      date: trip.departureDate || '',
                      availableKg: (trip.availableKg ?? 0).toString(),
                      pricePerKg: (trip.pricePerKg ?? 0).toString(),
                      mode: trip.travelMeans || 'flight',
                      travellerEmail: trip.user?.email || '',
                    },
                  });
                  return;
                }

                router.push({
                  pathname: '/payment',
                  params: {
                    travellerName: trip.user?.firstName && trip.user?.lastName
                      ? `${trip.user.firstName} ${trip.user.lastName}`
                      : trip.user?.firstName || 'Traveler',
                    travellerEmail: trip.user?.email || 'unknown@example.com',
                    amount: amount,
                    travelerId: trip.user?._id,
                    tripId: trip._id,
                    packageId,
                    insurance: insurance ? 'yes' : 'no',
                    insuranceCost: insuranceCost.toFixed(2),
                    image: image || null,
                    pricePerKg: trip.pricePerKg?.toString() || '0',
                    travelerCurrency: trip.currency || 'USD',
                    weight: packageWeight?.toString() || '1',
                  },
                })
              }
              }
            >

              <View style={styles.tripHeader}>
                <View style={styles.travelerInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {trip.user?.firstName?.charAt(0).toUpperCase() || 'T'}
                    </Text>
                  </View>
                  <View style={styles.travelerDetails}>
                    <Text style={styles.travelerName}>
                      {trip.user?.firstName || 'Traveler'}
                    </Text>
                    <View style={styles.ratingRow}>
                      <Star size={12} color={'#F5C563'} fill={'#F5C563'} />
                      <Text style={styles.ratingText}>
                        {(trip.user?.average_rating || 0).toFixed(1)}
                      </Text>
                      <Text style={styles.tripCount}>
                        • {trip.user?.total_trips || 0} trips
                      </Text>
                      {trip.user?.kycStatus === 'approved' && (
                        <Text style={styles.verified}>• ✓ Verified</Text>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.modeIcon}>
                  {(() => {
                    // Select the correct icon, default to Plane if missing
                    const IconComponent = (travelMeansIcons as any)[trip.travelMeans?.toLowerCase()] || Plane;
                    return <IconComponent size={18} color={'#5845D8'} />;
                  })()}
                </View>
              </View>

              <View style={styles.tripRoute}>
                <MapPin size={16} color={'#6B6B6B'} />
                <Text style={styles.tripRouteText} numberOfLines={1}>
                  {trip.fromLocation} → {trip.toLocation}
                </Text>
              </View>

              <View style={styles.tripMeta}>
                <View style={styles.metaItem}>
                  <Calendar size={14} color={'#6B6B6B'} />
                  <Text style={styles.metaText}>
                    {new Date(trip.departureDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Weight size={14} color={'#6B6B6B'} />
                  <Text style={styles.metaText}>{trip.availableKg} kg available</Text>
                </View>
                <View style={styles.metaItem}>

                  <Text style={styles.metaText}>Mode: {trip.travelMeans}</Text>
                </View>
              </View>

              {/* Compatibility Badge */}
              {tripScores[trip._id]?.compatible && (
                <View style={styles.compatBadgeRow}>
                  <CompatibilityBadge status={tripScores[trip._id].status || 'Yes'} />
                </View>
              )}

              {/* Assess Shipment Button */}
              <TouchableOpacity
                style={[styles.assessButton, { backgroundColor: '#FDF9F1', borderColor: '#5845D8' }]}
                onPress={() => handleViewAssessment(trip)}
              >
                <AlertTriangle size={16} color={'#5845D8'} />
                <Text style={[styles.assessButtonText, { color: '#5845D8' }]}>View Risk Assessment</Text>
              </TouchableOpacity>
            </TouchableOpacity>

          ))
        ) : (
          <Text style={styles.noResultsText}>No travelers available at the moment.</Text>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Assessment Modal */}
      <Modal
        visible={showAssessment}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAssessment(false)}
      >
        {selectedTrip && (
          <ShipmentAssessment
            tripId={selectedTrip._id}
            item={itemDetails}
            onClose={() => setShowAssessment(false)}
            onProceed={handleProceedFromAssessment}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  routeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  routeArrow: {
    fontSize: 16,
    marginHorizontal: 8,
  },
  insuranceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  insuranceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insuranceContent: {
    flex: 1,
    marginRight: 12,
  },
  insuranceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  insuranceSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  insuranceDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tripCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  matchedTripCard: {
    borderWidth: 2,
  },
  nonMatchedTripCard: {
    opacity: 0.8,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  travelerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  travelerDetails: {
    flex: 1,
  },
  travelerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tripCount: {
    fontSize: 12,
  },
  verified: {
    fontSize: 12,
    fontWeight: '500',
  },
  modeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tripRouteText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  tripMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
  },
  priceContainer: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  compatBadgeRow: {
    marginTop: 12,
    marginBottom: 8,
  },
  assessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  assessButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
