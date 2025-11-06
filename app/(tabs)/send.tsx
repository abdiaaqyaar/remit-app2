import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Currency, ExchangeRate, Recipient } from '@/types/database';
import { ArrowLeft, Delete, Plus } from 'lucide-react-native';

type Step = 'currency' | 'amount' | 'recipient';

export default function SendMoneyScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [step, setStep] = useState<Step>('currency');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [sendAmount, setSendAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);

  useEffect(() => {
    loadExchangeRate();
    loadRecipients();
  }, [currency]);

  useEffect(() => {
    if (sendAmount && exchangeRate) {
      const receive = parseFloat(sendAmount) * exchangeRate.rate;
      setReceiveAmount(receive.toLocaleString('en-US', { minimumFractionDigits: 3 }));
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

  const handleNumberPress = (num: string) => {
    if (sendAmount.length < 10) {
      setSendAmount(sendAmount + num);
    }
  };

  const handleBackspace = () => {
    setSendAmount(sendAmount.slice(0, -1));
  };

  const handleContinueFromAmount = () => {
    if (!sendAmount || parseFloat(sendAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    setStep('recipient');
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

    if (!selectedRecipient) {
      Alert.alert('Error', 'Please select a recipient');
      return;
    }

    const feeAmount = (parseFloat(sendAmount) * (exchangeRate?.fee_percentage || 2.5)) / 100;
    const totalAmount = parseFloat(sendAmount) + feeAmount;

    router.push({
      pathname: '/send-confirm',
      params: {
        recipientId: selectedRecipient.id,
        sendAmount,
        receiveAmount: receiveAmount.replace(/,/g, ''),
        currency,
        feeAmount: feeAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        exchangeRate: exchangeRate?.rate.toString(),
      },
    });
  };

  if (step === 'currency') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Which currency you'll sent?</Text>

        <View style={styles.currencyOptions}>
          <TouchableOpacity
            style={[styles.currencyTab, currency === 'USD' && styles.currencyTabActive]}
            onPress={() => {
              setCurrency('USD');
              setStep('amount');
            }}
          >
            <Text style={[styles.currencyTabText, currency === 'USD' && styles.currencyTabTextActive]}>
              International
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.currencyTab]}
            onPress={() => Alert.alert('Coming Soon', 'Local currency support coming soon')}
          >
            <Text style={styles.currencyTabText}>KES Only</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.currencyCards}>
          <TouchableOpacity
            style={[styles.currencyCard, currency === 'USD' && styles.currencyCardActive]}
            onPress={() => setCurrency('USD')}
          >
            <Text style={styles.currencyFlag}>🇺🇸</Text>
            <Text style={styles.currencyCode}>USD</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.currencyCard, currency === 'GBP' && styles.currencyCardActive]}
            onPress={() => setCurrency('GBP')}
          >
            <Text style={styles.currencyFlag}>🇬🇧</Text>
            <Text style={styles.currencyCode}>GBP</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.currencyCard, currency === 'EUR' && styles.currencyCardActive]}
            onPress={() => setCurrency('EUR')}
          >
            <Text style={styles.currencyFlag}>🇪🇺</Text>
            <Text style={styles.currencyCode}>EUR</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={() => setStep('amount')}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'amount') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('currency')}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Which currency you'll sent?</Text>

        <View style={styles.currencySection}>
          <View style={styles.currencyRow}>
            <Text style={styles.currencyFlag}>🇺🇸</Text>
            <Text style={styles.currencyLabel}>{currency}</Text>
            <Text style={styles.amountLabel}>[Amount you sent]</Text>
          </View>
          <Text style={styles.amountDisplay}>{sendAmount || '0'}</Text>
        </View>

        <View style={styles.exchangeSection}>
          <Text style={styles.convertLabel}>Convert to</Text>
        </View>

        <View style={styles.currencySection}>
          <View style={styles.currencyRow}>
            <Text style={styles.currencyFlag}>🇰🇪</Text>
            <Text style={styles.currencyLabel}>KES</Text>
            <Text style={styles.amountLabel}>[Recipient will gets]</Text>
          </View>
          <Text style={styles.amountDisplay}>{receiveAmount || '0'}</Text>
        </View>

        <View style={styles.numberPad}>
          {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.numberRow}>
              {row.map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.numberButton}
                  onPress={() => handleNumberPress(num)}
                >
                  <Text style={styles.numberText}>{num}</Text>
                  <Text style={styles.numberLetters}>
                    {num === '2' && 'ABC'}
                    {num === '3' && 'DEF'}
                    {num === '4' && 'GHI'}
                    {num === '5' && 'JKL'}
                    {num === '6' && 'MNO'}
                    {num === '7' && 'PQRS'}
                    {num === '8' && 'TUV'}
                    {num === '9' && 'WXYZ'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          <View style={styles.numberRow}>
            <View style={styles.numberButton} />
            <TouchableOpacity style={styles.numberButton} onPress={() => handleNumberPress('0')}>
              <Text style={styles.numberText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.numberButton} onPress={handleBackspace}>
              <Delete size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.continueButton, !sendAmount && styles.continueButtonDisabled]}
          onPress={handleContinueFromAmount}
          disabled={!sendAmount}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep('amount')}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Who are you sending to?</Text>
      <Text style={styles.subtitle}>
        Add or choose your recipient to continue your transaction.
      </Text>

      <TouchableOpacity
        style={styles.addRecipientButton}
        onPress={() => router.push('/(tabs)/recipients')}
      >
        <Plus size={20} color="#4F46E5" />
        <Text style={styles.addRecipientText}>Add New Recipient</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Recipients</Text>

      {recipients.map((recipient) => (
        <TouchableOpacity
          key={recipient.id}
          style={[
            styles.recipientCard,
            selectedRecipient?.id === recipient.id && styles.recipientCardActive,
          ]}
          onPress={() => setSelectedRecipient(recipient)}
        >
          <View style={styles.recipientAvatar}>
            <Text style={styles.recipientAvatarText}>
              {recipient.full_name.charAt(0)}
            </Text>
          </View>
          <View style={styles.recipientInfo}>
            <Text style={styles.recipientName}>{recipient.full_name}</Text>
            <Text style={styles.recipientEmail}>{recipient.phone_number}</Text>
          </View>
          {selectedRecipient?.id === recipient.id && (
            <View style={styles.selectedIndicator}>
              <Text style={styles.selectedIndicatorText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionTitle}>Recent Transaction</Text>
      {recipients.length > 0 && (
        <TouchableOpacity style={styles.recentCard}>
          <View style={styles.recipientAvatar}>
            <Text style={styles.recipientAvatarText}>
              {recipients[0].full_name.charAt(0)}
            </Text>
          </View>
          <View style={styles.recipientInfo}>
            <Text style={styles.recipientName}>{recipients[0].full_name}</Text>
            <Text style={styles.recipientEmail}>{recipients[0].phone_number}</Text>
          </View>
          <Text style={styles.sendAgainText}>Send Again</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.continueButton, !selectedRecipient && styles.continueButtonDisabled]}
        onPress={handleContinue}
        disabled={!selectedRecipient}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 24,
  },
  currencyOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  currencyTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
  },
  currencyTabActive: {
    backgroundColor: '#4F46E5',
  },
  currencyTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
  },
  currencyTabTextActive: {
    color: '#FFFFFF',
  },
  currencyCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 48,
  },
  currencyCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currencyCardActive: {
    borderColor: '#4F46E5',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  currencyFlag: {
    fontSize: 32,
    marginBottom: 8,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currencySection: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  amountLabel: {
    fontSize: 12,
    color: '#666666',
  },
  amountDisplay: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exchangeSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  convertLabel: {
    fontSize: 14,
    color: '#999999',
  },
  numberPad: {
    marginTop: 32,
    marginBottom: 24,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  numberButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  numberLetters: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
  },
  addRecipientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4F46E5',
    marginBottom: 24,
    gap: 8,
  },
  addRecipientText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  recipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  recipientCardActive: {
    borderColor: '#4F46E5',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  recipientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recipientAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  recipientEmail: {
    fontSize: 14,
    color: '#999999',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  sendAgainText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  continueButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 24,
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
