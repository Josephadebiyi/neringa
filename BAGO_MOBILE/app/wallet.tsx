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
import { Wallet, ChevronLeft, ArrowUpCircle, ArrowDownCircle } from 'lucide-react-native';
import axios from 'axios';
import { backendomain } from '@/utils/backendDomain';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = `${backendomain.backendomain}/api/bago`;

export default function WalletScreen() {
    const router = useRouter();
    const [balance, setBalance] = useState(0);
    const [escrowBalance, setEscrowBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [symbol, setSymbol] = useState("€"); // Default
    const base = (typeof backendomain === 'object' && backendomain.backendomain) ? backendomain.backendomain : backendomain;

    useEffect(() => {
        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        try {
            const profileUrl = `${base}/api/bago/Profile`;
            const profileResponse = await fetch(profileUrl, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });

            const profileData = await profileResponse.json();

            if (profileData?.data?.findUser) {
                const user = profileData.data.findUser;
                const pBalance = Number(user.balance ?? 0);
                const pEscrow = Number(user.escrowBalance ?? user.escrow ?? 0);
                setBalance(!Number.isNaN(pBalance) ? pBalance : 0);
                setEscrowBalance(!Number.isNaN(pEscrow) ? pEscrow : 0);

                if (Array.isArray(user.balanceHistory)) {
                    const mappedHistory = user.balanceHistory.map((txn: any) => ({
                        id: txn._id,
                        type: txn.type === 'deposit' || txn.type === 'escrow_release' ? 'credit' : 'debit',
                        amount: Number(txn.amount ?? 0),
                        date: txn.date,
                        description: txn.description || txn.type,
                        status: txn.status,
                    }));
                    setTransactions(mappedHistory);
                }
            }
        } catch (error) {
            console.error('Error fetching wallet data:', error);
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
                    <Text style={styles.headerTitle}>Earnings and Wallet</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color={'#5845D8'} style={styles.spinner} />
                ) : (
                    <>
                        <LinearGradient colors={['#F5C563', '#E8B86D']} style={styles.walletCard}>
                            <View style={styles.walletHeader}>
                                <View>
                                    <Text style={styles.walletLabel}>Available Balance</Text>
                                    <Text style={styles.walletBalance}>
                                        {symbol}{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Text>
                                    <Text style={{ color: '#FFFFFF', opacity: 0.85, marginTop: 6, fontSize: 14 }}>
                                        Held in Escrow: {symbol}{escrowBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Text>
                                </View>
                                <View style={styles.walletIcon}>
                                    <Wallet size={24} color={'#FFFFFF'} />
                                </View>
                            </View>
                        </LinearGradient>

                        <View style={styles.transactionsSection}>
                            <Text style={styles.transactionTitle}>Transaction History</Text>
                            {transactions.length === 0 ? (
                                <Text style={styles.noTransactionsText}>No recent transactions</Text>
                            ) : (
                                transactions.map((txn: any) => (
                                    <View key={txn.id} style={styles.transactionItem}>
                                        <View
                                            style={[
                                                styles.transactionIcon,
                                                { backgroundColor: txn.type === 'credit' ? '#81C784' : '#FDF9F1' },
                                            ]}
                                        >
                                            {txn.type === 'credit' ? (
                                                <ArrowDownCircle size={20} color={'#4CAF50'} />
                                            ) : (
                                                <ArrowUpCircle size={20} color={'#6B6B6B'} />
                                            )}
                                        </View>
                                        <View style={styles.transactionInfo}>
                                            <Text style={styles.transactionDesc}>
                                                {txn.description?.length > 26
                                                    ? txn.description.slice(0, 26) + '...'
                                                    : txn.description}
                                            </Text>
                                            <Text style={styles.transactionDate}>
                                                {new Date(txn.date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </Text>
                                        </View>
                                        <Text
                                            style={[
                                                styles.transactionAmount,
                                                { color: txn.type === 'credit' ? '#4CAF50' : '#1A1A1A' },
                                            ]}
                                        >
                                            {txn.type === 'credit' ? '+' : '-'}
                                            {symbol}
                                            {txn.amount.toFixed(2)}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </>
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
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
    content: { flex: 1, padding: 20 },
    spinner: { marginTop: 40 },
    walletCard: {
        borderRadius: 24, padding: 24, marginBottom: 32,
        shadowColor: '#F5C563', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 24, elevation: 8,
    },
    walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    walletLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', opacity: 0.9, marginBottom: 8 },
    walletBalance: { color: '#FFFFFF', fontSize: 36, fontWeight: '900', letterSpacing: -1 },
    walletIcon: { width: 48, height: 48, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    transactionsSection: { flex: 1 },
    transactionTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 16 },
    noTransactionsText: { color: '#6B6B6B', fontSize: 14 },
    transactionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 12 },
    transactionIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    transactionInfo: { flex: 1 },
    transactionDesc: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
    transactionDate: { fontSize: 13, color: '#6B6B6B' },
    transactionAmount: { fontSize: 16, fontWeight: '800' },
});
