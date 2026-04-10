import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Package, MapPin, ChevronLeft, Truck } from 'lucide-react-native';
import axios from 'axios';
import { backendomain } from '@/utils/backendDomain';

const API_BASE_URL = `${backendomain.backendomain}/api/bago`;

export default function MyDeliveriesScreen() {
    const router = useRouter();
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const fetchDeliveries = async () => {
        try {
            // Endpoint logic can be updated here if needed based on the current user's traveler requests
            const response = await axios.get(`${API_BASE_URL}/requests/traveler`, {
                withCredentials: true,
            });

            if (response.data.success && Array.isArray(response.data.data)) {
                setDeliveries(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching deliveries:', error);
            // Fails silently to prevent crashing if endpoint hasn't been added yet
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#5845D8', '#4534B8']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Deliveries</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color={'#5845D8'} style={styles.spinner} />
                ) : deliveries.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Truck size={48} color="#D1D5DB" />
                        <Text style={styles.noOrdersText}>You have no deliveries yet</Text>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push('/traveler-dashboard')}
                        >
                            <Text style={styles.actionButtonText}>List a Trip</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    deliveries.map((delivery: any) => (
                        <TouchableOpacity
                            key={delivery._id || delivery.requestId}
                            style={styles.orderCard}
                            onPress={() => {
                                router.push({
                                    pathname: '/package-details',
                                    params: { requestId: delivery._id || delivery.requestId },
                                });
                            }}
                        >
                            <View style={styles.orderHeader}>
                                <View style={[styles.orderIcon, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                                    <Truck size={24} color={'#4CAF50'} />
                                </View>
                                <View style={styles.orderInfo}>
                                    <Text style={styles.orderDescription} numberOfLines={1}>
                                        {delivery.package?.description || 'No description'}
                                    </Text>
                                    <View style={styles.orderRoute}>
                                        <MapPin size={16} color={'#6B6B6B'} />
                                        <Text style={styles.routeText}>
                                            {delivery.package?.fromCity || 'Origin'} → {delivery.package?.toCity || 'Destination'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.orderFooter}>
                                <Text style={styles.orderTraveler}>
                                    Sender: {delivery.sender?.firstName || 'Unknown'}
                                </Text>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        {
                                            backgroundColor:
                                                delivery.status === 'pending'
                                                    ? '#FF9800'
                                                    : delivery.status === 'accepted'
                                                        ? '#4CAF50'
                                                        : delivery.status === 'completed'
                                                            ? '#81C784'
                                                            : '#5845D8',
                                        },
                                    ]}
                                >
                                    <Text style={styles.statusText}>
                                        {delivery.status === 'intransit' ? 'In Transit' :
                                         delivery.status === 'pending' ? 'Pending' :
                                         delivery.status === 'accepted' ? 'Accepted' :
                                         delivery.status === 'completed' ? 'Completed' :
                                         delivery.status ? delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1) : 'Unknown'}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F6F3' },
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
    content: { flex: 1, padding: 20 },
    spinner: { marginTop: 40 },
    emptyState: { alignItems: 'center', marginTop: 60 },
    noOrdersText: { fontSize: 16, color: '#6B6B6B', marginTop: 16, marginBottom: 24 },
    actionButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    actionButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
    orderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    orderHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    orderIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    orderInfo: { flex: 1 },
    orderDescription: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
    orderRoute: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    routeText: { fontSize: 14, color: '#6B6B6B' },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    orderTraveler: { fontSize: 14, color: '#6B6B6B' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
});
