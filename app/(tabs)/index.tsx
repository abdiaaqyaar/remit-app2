import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Transaction } from '@/types/database';
import { Send, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, recipient:recipients(*)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle size={20} color="#10B981" />;
      case 'processing':
        return <Clock size={20} color="#F59E0B" />;
      case 'failed':
        return <XCircle size={20} color="#EF4444" />;
      default:
        return <Clock size={20} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return '#10B981';
      case 'processing':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadTransactions} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
        </View>
      </View>

      {profile?.kyc_status !== 'approved' && (
        <TouchableOpacity
          style={styles.kycBanner}
          onPress={() => router.push('/kyc')}
        >
          <AlertCircle size={24} color="#F59E0B" />
          <View style={styles.kycBannerContent}>
            <Text style={styles.kycBannerTitle}>KYC Verification Required</Text>
            <Text style={styles.kycBannerText}>
              Complete your KYC to start sending money
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.sendButton}
        onPress={() => router.push('/(tabs)/send')}
      >
        <Send size={24} color="#FFFFFF" />
        <Text style={styles.sendButtonText}>Send Money</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No transactions yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start sending money to see your transaction history
            </Text>
          </View>
        ) : (
          transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionRecipient}>
                  {transaction.recipient?.full_name}
                </Text>
                {getStatusIcon(transaction.status)}
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionAmount}>
                  {transaction.send_currency} {transaction.send_amount.toFixed(2)}
                </Text>
                <Text style={styles.transactionArrow}>→</Text>
                <Text style={styles.transactionAmount}>
                  KES {transaction.receive_amount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.transactionFooter}>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.created_at).toLocaleDateString()}
                </Text>
                <Text
                  style={[
                    styles.transactionStatus,
                    { color: getStatusColor(transaction.status) },
                  ]}
                >
                  {transaction.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 16,
    color: '#666666',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 4,
  },
  kycBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 12,
  },
  kycBannerContent: {
    flex: 1,
  },
  kycBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  kycBannerText: {
    fontSize: 14,
    color: '#78350F',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066FF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionRecipient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  transactionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  transactionArrow: {
    fontSize: 18,
    color: '#999999',
    marginHorizontal: 8,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDate: {
    fontSize: 14,
    color: '#666666',
  },
  transactionStatus: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
