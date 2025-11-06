import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Recipient, PaymentGateway } from '@/types/database';
import { CreditCard, CheckCircle } from 'lucide-react-native';

export default function SendConfirmScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>('Stripe');
  const [processing, setProcessing] = useState(false);

  const {
    recipientId,
    sendAmount,
    receiveAmount,
    currency,
    feeAmount,
    totalAmount,
    exchangeRate,
  } = params;

  useEffect(() => {
    loadRecipient();
  }, []);

  const loadRecipient = async () => {
    try {
      const { data, error } = await supabase
        .from('recipients')
        .select('*')
        .eq('id', recipientId)
        .maybeSingle();

      if (error) throw error;
      setRecipient(data);
    } catch (error) {
      console.error('Error loading recipient:', error);
      Alert.alert('Error', 'Failed to load recipient details');
    }
  };

  const handleConfirmPayment = async () => {
    if (!user || !recipient) return;

    setProcessing(true);

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          recipient_id: recipient.id,
          send_amount: parseFloat(sendAmount as string),
          send_currency: currency,
          receive_amount: parseFloat(receiveAmount as string),
          exchange_rate: parseFloat(exchangeRate as string),
          fee_amount: parseFloat(feeAmount as string),
          total_amount: parseFloat(totalAmount as string),
          payment_gateway: paymentGateway,
          status: 'processing',
          payment_reference: `PAY-${Date.now()}`,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: user.id,
        transaction_id: data.id,
        title: 'Transaction Initiated',
        message: `Your transfer of ${currency} ${sendAmount} to ${recipient.full_name} is being processed.`,
        type: 'transaction',
      });

      setTimeout(async () => {
        await supabase
          .from('transactions')
          .update({
            status: 'delivered',
            mpesa_confirmation: `MPESA-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            completed_at: new Date().toISOString(),
          })
          .eq('id', data.id);

        await supabase.from('notifications').insert({
          user_id: user.id,
          transaction_id: data.id,
          title: 'Transaction Completed',
          message: `Your transfer of ${currency} ${sendAmount} to ${recipient.full_name} has been delivered successfully.`,
          type: 'transaction',
        });
      }, 3000);

      Alert.alert(
        'Success!',
        'Your transaction is being processed. You will receive a confirmation shortly.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error processing transaction:', error);
      Alert.alert('Error', error.message || 'Failed to process transaction');
    } finally {
      setProcessing(false);
    }
  };

  if (!recipient) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Confirm Transfer</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Recipient</Text>
            <View style={styles.summaryValueContainer}>
              <Text style={styles.summaryValue}>{recipient.full_name}</Text>
              <Text style={styles.summarySubValue}>{recipient.phone_number}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>You Send</Text>
            <Text style={styles.summaryValue}>
              {currency} {sendAmount}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>They Receive</Text>
            <Text style={styles.summaryValue}>KES {receiveAmount}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Exchange Rate</Text>
            <Text style={styles.summaryValue}>
              1 {currency} = {exchangeRate} KES
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fee</Text>
            <Text style={styles.summaryValue}>
              {currency} {feeAmount}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelBold}>Total</Text>
            <Text style={styles.summaryValueBold}>
              {currency} {totalAmount}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity
            style={[
              styles.paymentCard,
              paymentGateway === 'Stripe' && styles.paymentCardActive,
            ]}
            onPress={() => setPaymentGateway('Stripe')}
          >
            <CreditCard size={24} color="#6772E5" />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>Stripe</Text>
              <Text style={styles.paymentDescription}>Credit/Debit Card</Text>
            </View>
            {paymentGateway === 'Stripe' && (
              <View style={styles.selectedBadge}>
                <CheckCircle size={20} color="#0066FF" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentCard,
              paymentGateway === 'Flutterwave' && styles.paymentCardActive,
            ]}
            onPress={() => setPaymentGateway('Flutterwave')}
          >
            <CreditCard size={24} color="#F5A623" />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>Flutterwave</Text>
              <Text style={styles.paymentDescription}>Multiple Payment Options</Text>
            </View>
            {paymentGateway === 'Flutterwave' && (
              <View style={styles.selectedBadge}>
                <CheckCircle size={20} color="#0066FF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Your transaction will be processed securely. The recipient will receive the funds
            within minutes via M-Pesa.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, processing && styles.confirmButtonDisabled]}
          onPress={handleConfirmPayment}
          disabled={processing}
        >
          <Text style={styles.confirmButtonText}>
            {processing ? 'Processing...' : 'Confirm & Pay'}
          </Text>
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
  backButton: {
    fontSize: 16,
    color: '#0066FF',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  summaryValueContainer: {
    alignItems: 'flex-end',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'right',
  },
  summarySubValue: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  summaryValueBold: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
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
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentCardActive: {
    borderColor: '#0066FF',
    backgroundColor: '#F0F7FF',
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 14,
    color: '#666666',
  },
  selectedBadge: {
    marginLeft: 12,
  },
  infoBox: {
    backgroundColor: '#F0F7FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#0066FF',
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
