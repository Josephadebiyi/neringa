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
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Traveler Details</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{traveler.name?.charAt(0) || 'T'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{traveler.name}</Text>
              {traveler.verified && (
                <View style={styles.verifiedBadge}>
                  <Shield size={14} color={Colors.white} />
                </View>
              )}
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Star size={16} color={Colors.gold} fill={Colors.gold} />
                <Text style={styles.statText}>{averageRating.toFixed(1)}</Text>

              </View>
              <Text style={styles.statDivider}>•</Text>
            <Text style={styles.statText}>{reviews.length} reviews</Text>
            </View>
          </View>
        </View>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <MapPin size={20} color={Colors.primary} />
              <Text style={styles.routeText}>{traveler.from}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeRow}>
              <MapPin size={20} color={Colors.secondary} />
              <Text style={styles.routeText}>{traveler.to}</Text>
            </View>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Calendar size={20} color={Colors.primary} />
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>
                {new Date(traveler.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Plane size={20} color={Colors.primary} />
              <Text style={styles.infoLabel}>Mode</Text>
              <Text style={styles.infoValue}>{traveler.mode === 'flight' ? 'Flight' : 'Road'}</Text>
            </View>
            <View style={styles.infoCard}>
              <Weight size={20} color={Colors.primary} />
              <Text style={styles.infoLabel}>Available</Text>
              <Text style={styles.infoValue}>{traveler.availableKg} kg</Text>
            </View>
          </View>
        </View>




        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {reviews.length === 0 ? (
            <Text style={{ color: Colors.text }}>No reviews yet</Text>
          ) : (
            reviews.map((review, index) => (
              <View key={index} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>{review.user?.firstName?.charAt(0).toUpperCase() || 'U'}</Text>
                  </View>
                  <View style={styles.reviewInfo}>
                    <View style={styles.reviewStars}>
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={12} color={s <= (review.rating ?? 0) ? Colors.gold : Colors.border} fill={s <= (review.rating ?? 0) ? Colors.gold : Colors.white} />
                      ))}
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.comment}</Text>
              </View>
            ))
          )}


          <View style={[styles.reviewCard, { marginTop: 20 }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Leave a Review</Text>
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              {[1,2,3,4,5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                  <Star size={28} color={star <= reviewRating ? Colors.gold : Colors.border} fill={star <= reviewRating ? Colors.gold : Colors.white} style={{ marginHorizontal: 4 }} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Write your review..."
              multiline
              value={reviewComment}
              onChangeText={setReviewComment}
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReview}>
              <Text style={styles.submitButtonText}>Submit Review</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
</KeyboardAvoidingView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
          <MessageCircle size={20} color={Colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.bookButton} onPress={handleBookRequest}>
          <Text style={styles.bookButtonText}>Send Request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { height: 100, justifyContent: 'center', alignItems: 'center', paddingTop: 40, flexDirection: 'row' },
  backButton: { position: 'absolute', left: 20, top: 45 },
  backIcon: { fontSize: 26, color: Colors.white },
  headerTitle: { fontSize: 20, color: Colors.white, fontWeight: 'bold' },
  content: { padding: 20 },
  profileCard: { flexDirection: 'row', backgroundColor: Colors.white, padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 8 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: Colors.white },
  profileInfo: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 20, fontWeight: 'bold', color: Colors.text, marginRight: 8 },
  verifiedBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.success, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 14, color: Colors.textLight },
  statDivider: { marginHorizontal: 8, color: Colors.textLight },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  routeCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, marginBottom: 16 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  routeLine: { width: 2, height: 24, backgroundColor: Colors.border, marginLeft: 10, marginVertical: 8 },
  infoGrid: { flexDirection: 'row', gap: 12 },
  infoCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 12, padding: 16, alignItems: 'center' },
  infoLabel: { fontSize: 12, color: Colors.textLight, marginTop: 8 },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: 4 },
  priceCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 16, color: Colors.text },
  priceValue: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  reviewCard: { backgroundColor: Colors.backgroundLight, borderRadius: 12, padding: 15, marginBottom: 15 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center' },
  reviewAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  reviewAvatarText: { color: Colors.white, fontWeight: 'bold' },
  reviewInfo: { marginLeft: 10 },
  reviewStars: { flexDirection: 'row' },
  reviewText: { marginTop: 8, color: Colors.text },
  reviewInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top', backgroundColor: Colors.backgroundLight, marginBottom: 12 },
  submitButton: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  submitButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.white, borderTopWidth: 1, borderColor: Colors.border },
  messageButton: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  bookButton: { flex: 1, marginLeft: 10, backgroundColor: Colors.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingVertical: 12 },
  bookButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});
