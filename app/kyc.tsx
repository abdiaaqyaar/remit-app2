import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  FileText,
  Camera,
  CheckCircle,
  Clock,
  XCircle,
  Upload,
} from 'lucide-react-native';

export default function KYCScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);

  const documents = [
    { id: 'id', title: 'Government ID', uploaded: false },
    { id: 'proof_address', title: 'Proof of Address', uploaded: false },
    { id: 'selfie', title: 'Selfie with ID', uploaded: false },
  ];

  const handleUploadDocument = async (docId: string) => {
    Alert.alert('Upload Document', 'This is a mock upload for demonstration purposes', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Upload',
        onPress: async () => {
          setUploading(true);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setUploading(false);
          Alert.alert('Success', 'Document uploaded successfully');
        },
      },
    ]);
  };

  const handleSubmitKYC = async () => {
    Alert.alert(
      'Submit KYC',
      'This will submit your KYC documents for review. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Submit',
          onPress: async () => {
            setUploading(true);
            try {
              const { error } = await supabase
                .from('profiles')
                .update({
                  kyc_status: 'under_review',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', profile?.id);

              if (error) throw error;

              await refreshProfile();
              Alert.alert('Success', 'KYC submitted for review!', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setUploading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = () => {
    switch (profile?.kyc_status) {
      case 'approved':
        return (
          <View style={[styles.statusBadge, styles.statusApproved]}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={styles.statusText}>Approved</Text>
          </View>
        );
      case 'under_review':
        return (
          <View style={[styles.statusBadge, styles.statusReview]}>
            <Clock size={16} color="#F59E0B" />
            <Text style={styles.statusText}>Under Review</Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={[styles.statusBadge, styles.statusRejected]}>
            <XCircle size={16} color="#EF4444" />
            <Text style={styles.statusText}>Rejected</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, styles.statusPending]}>
            <Clock size={16} color="#6B7280" />
            <Text style={styles.statusText}>Pending</Text>
          </View>
        );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>KYC Verification</Text>
        {getStatusBadge()}
      </View>

      <View style={styles.content}>
        <View style={styles.infoBox}>
          <FileText size={24} color="#0066FF" />
          <Text style={styles.infoTitle}>Why do we need this?</Text>
          <Text style={styles.infoText}>
            KYC verification is required by law to prevent fraud and ensure secure
            transactions. Your documents are encrypted and stored securely.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Required Documents</Text>

        {documents.map((doc) => (
          <View key={doc.id} style={styles.documentCard}>
            <View style={styles.documentInfo}>
              <FileText size={20} color="#666666" />
              <Text style={styles.documentTitle}>{doc.title}</Text>
            </View>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => handleUploadDocument(doc.id)}
              disabled={uploading}
            >
              <Upload size={20} color="#0066FF" />
              <Text style={styles.uploadButtonText}>
                {doc.uploaded ? 'Uploaded' : 'Upload'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {profile?.kyc_status === 'pending' && (
          <TouchableOpacity
            style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
            onPress={handleSubmitKYC}
            disabled={uploading}
          >
            <Text style={styles.submitButtonText}>
              {uploading ? 'Submitting...' : 'Submit for Review'}
            </Text>
          </TouchableOpacity>
        )}

        {profile?.kyc_status === 'under_review' && (
          <View style={styles.reviewBox}>
            <Clock size={24} color="#F59E0B" />
            <Text style={styles.reviewTitle}>Review in Progress</Text>
            <Text style={styles.reviewText}>
              Your documents are being reviewed. This usually takes 1-2 business days.
            </Text>
          </View>
        )}

        {profile?.kyc_status === 'approved' && (
          <View style={styles.approvedBox}>
            <CheckCircle size={24} color="#10B981" />
            <Text style={styles.approvedTitle}>Verification Complete</Text>
            <Text style={styles.approvedText}>
              Your account is fully verified. You can now send money!
            </Text>
          </View>
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
  backButton: {
    fontSize: 16,
    color: '#0066FF',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 6,
  },
  statusApproved: {
    backgroundColor: '#D1FAE5',
  },
  statusReview: {
    backgroundColor: '#FEF3C7',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusPending: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  content: {
    padding: 16,
  },
  infoBox: {
    backgroundColor: '#F0F7FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  documentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
  },
  submitButton: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewBox: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    alignItems: 'center',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginTop: 12,
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: '#78350F',
    textAlign: 'center',
  },
  approvedBox: {
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    alignItems: 'center',
  },
  approvedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginTop: 12,
    marginBottom: 8,
  },
  approvedText: {
    fontSize: 14,
    color: '#047857',
    textAlign: 'center',
  },
});
