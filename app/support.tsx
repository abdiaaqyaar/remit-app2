import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown, ChevronRight, MessageCircle, Mail, Phone } from 'lucide-react-native';

const faqs = [
  {
    id: 1,
    question: 'How long does a transfer take?',
    answer:
      'Most transfers are completed within minutes. The recipient will receive the funds via M-Pesa almost instantly once the transaction is processed.',
  },
  {
    id: 2,
    question: 'What are the fees?',
    answer:
      'We charge a transparent 2.5% fee on all transfers. This includes the exchange rate margin and processing costs. No hidden fees.',
  },
  {
    id: 3,
    question: 'How do I verify my account (KYC)?',
    answer:
      'Go to your profile and tap on KYC Verification. Upload your government ID, proof of address, and a selfie with your ID. Verification usually takes 1-2 business days.',
  },
  {
    id: 4,
    question: 'Is my money safe?',
    answer:
      'Yes! We use bank-level encryption and comply with all financial regulations. Your funds are protected at every step of the transfer process.',
  },
  {
    id: 5,
    question: 'Can I cancel a transfer?',
    answer:
      'Once a transfer is processing, it cannot be cancelled. However, if there are any issues, our support team can help resolve them.',
  },
  {
    id: 6,
    question: 'What currencies can I send?',
    answer:
      'You can send money from USD (USA), GBP (UK), or EUR (Europe) directly to Kenyan Shillings (KES) via M-Pesa.',
  },
  {
    id: 7,
    question: 'What payment methods are accepted?',
    answer:
      'We accept credit cards, debit cards, and bank transfers through our secure payment partners Stripe and Flutterwave.',
  },
  {
    id: 8,
    question: 'Do I need a Kenyan phone number?',
    answer:
      'No, you don\'t need a Kenyan phone number. Only your recipient needs an M-Pesa account to receive funds.',
  },
];

export default function SupportScreen() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleFAQ = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Us</Text>

          <TouchableOpacity style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <MessageCircle size={24} color="#0066FF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Live Chat</Text>
              <Text style={styles.contactText}>Chat with our support team</Text>
            </View>
            <ChevronRight size={20} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <Mail size={24} color="#0066FF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email</Text>
              <Text style={styles.contactText}>support@remitbridge.com</Text>
            </View>
            <ChevronRight size={20} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <Phone size={24} color="#0066FF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Phone</Text>
              <Text style={styles.contactText}>+1 (800) 123-4567</Text>
            </View>
            <ChevronRight size={20} color="#CCCCCC" />
          </TouchableOpacity>
        </View>

        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          {faqs.map((faq) => (
            <View key={faq.id} style={styles.faqCard}>
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() => toggleFAQ(faq.id)}
              >
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                {expandedId === faq.id ? (
                  <ChevronDown size={20} color="#0066FF" />
                ) : (
                  <ChevronRight size={20} color="#CCCCCC" />
                )}
              </TouchableOpacity>
              {expandedId === faq.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Need More Help?</Text>
          <Text style={styles.infoText}>
            Our support team is available 24/7 to assist you with any questions or
            concerns. Don't hesitate to reach out!
          </Text>
        </View>
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
  contactSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#666666',
  },
  faqSection: {
    marginBottom: 32,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginTop: 12,
  },
  infoSection: {
    backgroundColor: '#F0F7FF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});
