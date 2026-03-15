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
import { Package, MapPin, ChevronLeft } from 'lucide-react-native';
import axios from 'axios';
import { backendomain } from '@/utils/backendDomain';

const API_BASE_URL = `${backendomain.backendomain}/api/baggo`;

export default function MyShipmentsScreen() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchShipments();
    }, []);

    const fetchShipments = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/recentOrder`, {
                withCredentials: true,
            });

            if (response.data.success && Array.isArray(response.data.data)) {
                const sortedOrders = response.data.data.sort(
                    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                setOrders(sortedOrders);
            }
        } catch (error) {
            console.error('Error fetching shipments:', error);
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
                    <Text style={styles.headerTitle}>My Shipments</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color={'#5845D8'} style={styles.spinner} />
                ) : orders.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Package size={48} color="#D1D5DB" />
                        <Text style={styles.noOrdersText}>You have no shipments yet</Text>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push('/send-package')}
                        >
                            <Text style={styles.actionButtonText}>Send a Package</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    orders.map((order: any) => (
                        <TouchableOpacity
                            key={order.requestId}
                            style={styles.orderCard}
                            onPress={() => {
                                router.push({
                                    pathname: '/package-details',
                                    params: { requestId: order.requestId },
                                });
                            }}
                        >
                            <View style={styles.orderHeader}>
                                <View style={styles.orderIcon}>
                                    <Package size={24} color={'#5845D8'} />
                                </View>
                                <View style={styles.orderInfo}>
                                    <Text style={styles.orderDescription} numberOfLines={1}>
                                        {order.package?.description || 'No description'}
                                    </Text>
                                    <View style={styles.orderRoute}>
                                        <MapPin size={16} color={'#6B6B6B'} />
                                        <Text style={styles.routeText}>
                                            {order.package?.fromCity} → {order.package?.toCity}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.orderFooter}>
                                <Text style={styles.orderTraveler}>
                                    Traveler: {order.traveler?.firstName || 'Unknown'}
                                </Text>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        {
                                            backgroundColor:
                                                order.status === 'pending'
                                                    ? '#FF9800'
                                                    : order.status === 'accepted'
                                                        ? '#4CAF50'
                                                        : order.status === 'rejected'
                                                            ? '#F44336'
                                                            : order.status === 'completed'
                                                                ? '#81C784'
                                                                : '#5845D8',
                                        },
                                    ]}
                                >
                                    <Text style={styles.statusText}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
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
        backgroundColor: '#5845D8',
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
        backgroundColor: 'rgba(88, 69, 216, 0.1)',
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
