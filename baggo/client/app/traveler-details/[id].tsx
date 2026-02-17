import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Star, MessageCircle, Shield, MapPin, Calendar, Plane, Weight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { backendomain } from '@/utils/backendDomain';
import { useTheme } from '@/contexts/ThemeContext';


export default function TravelerDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  // Use travelerId consistently from params
  const travelerId = params.travelerId || params.id;
  const tripId = params.tripId || null;
  console.log('Traveler ID:', travelerId);
  console.log('Trip ID:', tripId);

  const initialTraveler = useMemo(() => ({
    id: travelerId,
      tripId: tripId,
    name: params.name || 'Traveler',
    travelerEmail: params.travellerEmail || '',
    rating: params.rating ? parseFloat(params.rating) : 0,
    trips: params.trips ? parseInt(params.trips, 10) : 0,
    verified: params.verified === 'true',
    from: params.from || 'Unknown',
    to: params.to || 'Unknown',
    date: params.date || '2025-10-15',
    availableKg: params.availableKg ? parseFloat(params.availableKg) : 0,
    pricePerKg: params.pricePerKg ? parseFloat(params.pricePerKg) : 0,
    mode: params.mode || 'flight',
  }), [params, travelerId]);

  const [travelerState, setTravelerState] = useState(initialTraveler);
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [loadingReviews, setLoadingReviews] = useState(false);


  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0);
    return total / reviews.length;
  }, [reviews]);



  const fetchTravelerReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`${backendomain.backendomain}/api/baggo/MyTrips`);

      const data = await res.json();

      if (!res.ok) {
        console.log('Error fetching trips:', data.message);
        setReviews([]);
        return;
      }

      const trips = data.trips || [];

      const foundTrip = trips.find(t => t.id?.toString() === tripId); // use 'id', not '_id' since your API returns 'id'
      console.log('Found trip:', foundTrip);

      if (foundTrip) {
        console.log('Raw reviews array:', foundTrip.reviews);

        foundTrip.reviews.forEach((review, i) => {
          console.log(`Review #${i + 1}:`);
          console.log('  User:', review.user?.firstName || review.user?.name || 'Unknown');
          console.log('  Comment:', review.comment);
          console.log('  Rating:', review.rating);
        });

        setReviews(foundTrip.reviews || []);

        setTravelerState({
          ...travelerState,
          rating: foundTrip.averageRating ?? travelerState.rating,
          trips: foundTrip.totalReviews ?? travelerState.trips,
          from: foundTrip.fromLocation ?? travelerState.from,
          to: foundTrip.toLocation ?? travelerState.to,
          date: foundTrip.departureDate ?? travelerState.date,
          availableKg: foundTrip.availableKg ?? travelerState.availableKg,
          mode: foundTrip.travelMeans ?? travelerState.mode,
        });
      } else {
        console.log('No trip found for this tripId');
        setReviews([]);
      }
    } catch (err) {
      console.log('fetchTravelerReviews error:', err);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };


  useEffect(() => {
    fetchTravelerReviews();
  }, [travelerId, tripId]);

  const handleSubmitReview = async () => {
    if (reviewRating === 0 || reviewComment.trim() === '') {
      return Alert.alert('Error', 'Please provide both rating and comment.');
    }
    if (!tripId) return Alert.alert('Error', 'Trip ID not available');

    try {
      const res = await fetch(
       `${backendomain.backendomain}/api/baggo/${tripId}/reviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer <token>',
          },
          body: JSON.stringify({ rating: reviewRating, comment: reviewComment.trim() }),
        }
      );

      const data = await res.json();
      if (!res.ok) return Alert.alert('Error', data.message || 'Failed to add review');

      Alert.alert('Success', 'Review submitted successfully');
      setReviewRating(0);
      setReviewComment('');
      fetchTravelerReviews();
    } catch (err) {
      console.log('submit review error:', err);
      Alert.alert('Error', 'Network error');
    }
  };

  const handleBookRequest = () => {
    router.push({
      pathname: '/shipping-request',
      params: {
        travelerId,
         tripId,
        travelerName: travelerState.name,
        from: travelerState.from,
        to: travelerState.to,
        date: travelerState.date,
        pricePerKg: travelerState.pricePerKg,
        travelerEmail: travelerState.travelerEmail,
      },
    });
  };

  const handleMessage = () => {
    router.push('/messages');
  };

  const traveler = travelerState;

  return (
    <View style={[styles.container, { backgroundColor: '#F8F6F3' }]}>
      <LinearGradient colors={['#5845D8', '#5845D8'Dark]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backIcon, { color: '#1A1A1A'Inverse }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#1A1A1A'Inverse }]}>Traveler Details</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={[styles.profileCard, { backgroundColor: '#FFFFFF', borderBottomColor: '#E5E5E5' }]}>
          <View style={[styles.avatar, { backgroundColor: '#5845D8' }]}>
            <Text style={[styles.avatarText, { color: '#1A1A1A'Inverse }]}>{traveler.name?.charAt(0) || 'T'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: '#1A1A1A' }]}>{traveler.name}</Text>
              {traveler.verified && (
                <View style={[styles.verifiedBadge, { backgroundColor: '#4CAF50' }]}>
                  <Shield size={14} color={'#1A1A1A'Inverse} />
                </View>
              )}
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Star size={16} color={'#F5C563'} fill={'#F5C563'} />
                <Text style={[styles.statText, { color: '#1A1A1A'Light }]}>{averageRating.toFixed(1)}</Text>

              </View>
              <Text style={[styles.statDivider, { color: '#1A1A1A'Light }]}>•</Text>
            <Text style={[styles.statText, { color: '#1A1A1A'Light }]}>{reviews.length} reviews</Text>
            </View>
          </View>
        </View>


        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#1A1A1A' }]}>Trip Details</Text>
          <View style={[styles.routeCard, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.routeRow}>
              <MapPin size={20} color={'#5845D8'} />
              <Text style={[styles.routeText, { color: '#1A1A1A' }]}>{traveler.from}</Text>
            </View>
            <View style={[styles.routeLine, { backgroundColor: '#E5E5E5' }]} />
            <View style={styles.routeRow}>
              <MapPin size={20} color={'#E8B86D'} />
              <Text style={[styles.routeText, { color: '#1A1A1A' }]}>{traveler.to}</Text>
            </View>
          </View>
          <View style={styles.infoGrid}>
            <View style={[styles.infoCard, { backgroundColor: '#FFFFFF' }]}>
              <Calendar size={20} color={'#5845D8'} />
              <Text style={[styles.infoLabel, { color: '#1A1A1A'Light }]}>Date</Text>
              <Text style={[styles.infoValue, { color: '#1A1A1A' }]}>
                {new Date(traveler.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: '#FFFFFF' }]}>
              <Plane size={20} color={'#5845D8'} />
              <Text style={[styles.infoLabel, { color: '#1A1A1A'Light }]}>Mode</Text>
              <Text style={[styles.infoValue, { color: '#1A1A1A' }]}>{traveler.mode === 'flight' ? 'Flight' : 'Road'}</Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: '#FFFFFF' }]}>
              <Weight size={20} color={'#5845D8'} />
              <Text style={[styles.infoLabel, { color: '#1A1A1A'Light }]}>Available</Text>
              <Text style={[styles.infoValue, { color: '#1A1A1A' }]}>{traveler.availableKg} kg</Text>
            </View>
          </View>
        </View>




        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#1A1A1A' }]}>Reviews</Text>
          {reviews.length === 0 ? (
            <Text style={{ color: '#1A1A1A' }}>No reviews yet</Text>
          ) : (
            reviews.map((review, index) => (
              <View key={index} style={[styles.reviewCard, { backgroundColor: '#F8F6F3'Light }]}>
                <View style={styles.reviewHeader}>
                  <View style={[styles.reviewAvatar, { backgroundColor: '#5845D8' }]}>
                    <Text style={[styles.reviewAvatarText, { color: '#1A1A1A'Inverse }]}>{review.user?.firstName?.charAt(0).toUpperCase() || 'U'}</Text>
                  </View>
                  <View style={styles.reviewInfo}>
                    <View style={styles.reviewStars}>
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={12} color={s <= (review.rating ?? 0) ? '#F5C563' : '#E5E5E5'} fill={s <= (review.rating ?? 0) ? '#F5C563' : '#FFFFFF'} />
                      ))}
                    </View>
                  </View>
                </View>
                <Text style={[styles.reviewText, { color: '#1A1A1A' }]}>{review.comment}</Text>
              </View>
            ))
          )}


          <View style={[styles.reviewCard, { marginTop: 20, backgroundColor: '#F8F6F3'Light }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 8, color: '#1A1A1A' }]}>Leave a Review</Text>
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              {[1,2,3,4,5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                  <Star size={28} color={star <= reviewRating ? '#F5C563' : '#E5E5E5'} fill={star <= reviewRating ? '#F5C563' : '#FFFFFF'} style={{ marginHorizontal: 4 }} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.reviewInput, { borderColor: '#E5E5E5', backgroundColor: colors.inputBackground, color: colors.inputText }]}
              placeholder="Write your review..."
              placeholderTextColor={colors.inputPlaceholder}
              multiline
              value={reviewComment}
              onChangeText={setReviewComment}
            />
            <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#5845D8' }]} onPress={handleSubmitReview}>
              <Text style={[styles.submitButtonText, { color: '#1A1A1A'Inverse }]}>Submit Review</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
</KeyboardAvoidingView>
      <View style={[styles.footer, { backgroundColor: '#FFFFFF', borderColor: '#E5E5E5' }]}>
        <TouchableOpacity style={[styles.messageButton, { borderColor: '#5845D8' }]} onPress={handleMessage}>
          <MessageCircle size={20} color={'#5845D8'} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bookButton, { backgroundColor: '#5845D8' }]} onPress={handleBookRequest}>
          <Text style={[styles.bookButtonText, { color: '#1A1A1A'Inverse }]}>Send Request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 100, justifyContent: 'center', alignItems: 'center', paddingTop: 40, flexDirection: 'row' },
  backButton: { position: 'absolute', left: 20, top: 45 },
  backIcon: { fontSize: 26 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  profileCard: { flexDirection: 'row', padding: 20, borderBottomWidth: 1, marginBottom: 8 },
  avatar: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 28, fontWeight: 'bold' },
  profileInfo: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 20, fontWeight: 'bold', marginRight: 8 },
  verifiedBadge: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 14 },
  statDivider: { marginHorizontal: 8 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  routeCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeText: { fontSize: 16, fontWeight: '600' },
  routeLine: { width: 2, height: 24, marginLeft: 10, marginVertical: 8 },
  infoGrid: { flexDirection: 'row', gap: 12 },
  infoCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  infoLabel: { fontSize: 12, marginTop: 8 },
  infoValue: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  priceCard: { borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 16 },
  priceValue: { fontSize: 24, fontWeight: 'bold' },
  reviewCard: { borderRadius: 12, padding: 15, marginBottom: 15 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center' },
  reviewAvatar: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  reviewAvatarText: { fontWeight: 'bold' },
  reviewInfo: { marginLeft: 10 },
  reviewStars: { flexDirection: 'row' },
  reviewText: { marginTop: 8 },
  reviewInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  submitButton: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  submitButtonText: { fontSize: 16, fontWeight: '600' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1 },
  messageButton: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  bookButton: { flex: 1, marginLeft: 10, borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingVertical: 12 },
  bookButtonText: { fontSize: 16, fontWeight: '600' },
});
