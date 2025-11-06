import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Currency, ExchangeRate, Recipient } from '@/types/database';
import { DollarSign, ArrowDown, Users } from 'lucide-react-native';

export default function SendMoneyScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [currency, setCurrency] = useState<Currency>('USD');
  const [sendAmount, setSendAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExchangeRate();
    loadRecipients();
  }, [currency]);

  useEffect(() => {
    if (sendAmount && exchangeRate) {
      const receive = parseFloat(sendAmount) * exchangeRate.rate;
      setReceiveAmount(receive.toFixed(2));
    } else {
      setReceiveAmount('');
    }
  }, [sendAmount, exchangeRate]);

  const loadExchangeRate = async () => {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('from_currency', currency)
        .eq('to_currency', 'KES')
        .maybeSingle();

      if (error) throw error;
      setExchangeRate(data);
    } catch (error) {
      console.error('Error loading exchange rate:', error);
    }
  };

  const loadRecipients = async () => {
    try {
      const { data, error } = await supabase
        .from('recipients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipients(data || []);
    } catch (error) {
      console.error('Error loading recipients:', error);
    }
  };

  const getCurrencySymbol = (curr: Currency) => {
    switch (curr) {
      case 'USD':
        return '$';
      case 'GBP':
        return '£';
      case 'EUR':
        return '€';
    }
  };

  const calculateFee = () => {
    if (!sendAmount || !exchangeRate) return 0;
    return (parseFloat(sendAmount) * exchangeRate.fee_percentage) / 100;
  };

  const calculateTotal = () => {
    if (!sendAmount) return 0;
    return parseFloat(sendAmount) + calculateFee();
  };

  const handleContinue = () => {
    if (profile?.kyc_status !== 'approved') {
      Alert.alert(
        'KYC Required',
        'Please complete KYC verification before sending money',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Verify Now', onPress: () => router.push('/kyc') },
        ]
      );
      return;
    }

    if (!sendAmount || parseFloat(sendAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!selectedRecipient) {
      Alert.alert('Error', 'Please select a recipient');
      return;
    }

    router.push({
      pathname: '/send-confirm',
      params: {
        recipientId: selectedRecipient.id,
        sendAmount,
        receiveAmount,
        currency,
        feeAmount: calculateFee().toFixed(2),
        totalAmount: calculateTotal().toFixed(2),
        exchangeRate: exchangeRate?.rate.toString(),
      },
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Send Money</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Currency</Text>
          <View style={styles.currencySelector}>
            {(['USD', 'GBP', 'EUR'] as Currency[]).map((curr) => (
              <TouchableOpacity
                key={curr}
                style={[
                  styles.currencyButton,
                  currency === curr && styles.currencyButtonActive,
                ]}
                onPress={() => setCurrency(curr)}
              >
                <Text
                  style={[
                    styles.currencyButtonText,
                    currency === curr && styles.currencyButtonTextActive,
                  ]}
                >
                  {curr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>You Send</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>{getCurrencySymbol(currency)}</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              value={sendAmount}
              onChangeText={setSendAmount}
              keyboardType="decimal-pad"
            />
            <Text style={styles.currencyCode}>{currency}</Text>
          </View>
        </View>

        <View style={styles.exchangeInfo}>
          <ArrowDown size={24} color="#0066FF" />
          {exchangeRate && (
            <Text style={styles.exchangeRate}>
              1 {currency} = {exchangeRate.rate.toFixed(2)} KES
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipient Gets</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>KES</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              value={receiveAmount}
              editable={false}
            />
          </View>
        </View>

        <View style={styles.feeBox}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Fee ({exchangeRate?.fee_percentage}%)</Text>
            <Text style={styles.feeValue}>
              {getCurrencySymbol(currency)}{calculateFee().toFixed(2)}
            </Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabelBold}>Total</Text>
            <Text style={styles.feeValueBold}>
              {getCurrencySymbol(currency)}{calculateTotal().toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.recipientHeader}>
            <Text style={styles.sectionTitle}>Select Recipient</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/recipients')}>
              <Text style={styles.addRecipientText}>+ Add New</Text>
            </TouchableOpacity>
          </View>

          {recipients.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={48} color="#CCCCCC" />
              <Text style={styles.emptyStateText}>No recipients yet</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/recipients')}>
                <Text style={styles.emptyStateLink}>Add your first recipient</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recipients.map((recipient) => (
              <TouchableOpacity
                key={recipient.id}
                style={[
                  styles.recipientCard,
                  selectedRecipient?.id === recipient.id && styles.recipientCardActive,
                ]}
                onPress={() => setSelectedRecipient(recipient)}
              >
                <View>
                  <Text style={styles.recipientName}>{recipient.full_name}</Text>
                  <Text style={styles.recipientPhone}>{recipient.phone_number}</Text>
                </View>
                {selectedRecipient?.id === recipient.id && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            (!sendAmount || !selectedRecipient) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!sendAmount || !selectedRecipient}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  currencySelector: {
    flexDirection: 'row',
    gap: 12,
  },
  currencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  currencyButtonActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  currencyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  currencyButtonTextActive: {
    color: '#FFFFFF',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: '#666666',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    paddingVertical: 16,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  exchangeInfo: {
    alignItems: 'center',
    marginVertical: 16,
  },
  exchangeRate: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  feeBox: {
    backgroundColor: '#F0F7FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: '#666666',
  },
  feeValue: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  feeLabelBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  feeValueBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  recipientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addRecipientText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateLink: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
  },
  recipientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  recipientCardActive: {
    borderColor: '#0066FF',
    backgroundColor: '#F0F7FF',
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  recipientPhone: {
    fontSize: 14,
    color: '#666666',
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  continueButton: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
