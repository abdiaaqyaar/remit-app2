import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Recipient } from '@/types/database';
import { Users, Plus, Star, Edit, Trash, X } from 'lucide-react-native';

export default function RecipientsScreen() {
  const { user } = useAuth();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    mpesa_number: '',
  });

  useEffect(() => {
    loadRecipients();
  }, []);

  const loadRecipients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recipients')
        .select('*')
        .order('is_favorite', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipients(data || []);
    } catch (error) {
      console.error('Error loading recipients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (recipient?: Recipient) => {
    if (recipient) {
      setEditingRecipient(recipient);
      setFormData({
        full_name: recipient.full_name,
        phone_number: recipient.phone_number,
        mpesa_number: recipient.mpesa_number,
      });
    } else {
      setEditingRecipient(null);
      setFormData({
        full_name: '',
        phone_number: '',
        mpesa_number: '',
      });
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingRecipient(null);
    setFormData({
      full_name: '',
      phone_number: '',
      mpesa_number: '',
    });
  };

  const handleSaveRecipient = async () => {
    if (!formData.full_name || !formData.phone_number || !formData.mpesa_number) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      if (editingRecipient) {
        const { error } = await supabase
          .from('recipients')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRecipient.id);

        if (error) throw error;
        Alert.alert('Success', 'Recipient updated successfully');
      } else {
        const { error } = await supabase.from('recipients').insert({
          user_id: user.id,
          ...formData,
          country: 'Kenya',
        });

        if (error) throw error;
        Alert.alert('Success', 'Recipient added successfully');
      }

      handleCloseModal();
      loadRecipients();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (recipient: Recipient) => {
    try {
      const { error } = await supabase
        .from('recipients')
        .update({
          is_favorite: !recipient.is_favorite,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recipient.id);

      if (error) throw error;
      loadRecipients();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteRecipient = async (recipient: Recipient) => {
    Alert.alert(
      'Delete Recipient',
      `Are you sure you want to delete ${recipient.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('recipients')
                .delete()
                .eq('id', recipient.id);

              if (error) throw error;
              Alert.alert('Success', 'Recipient deleted successfully');
              loadRecipients();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recipients</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleOpenModal()}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {recipients.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={64} color="#CCCCCC" />
            <Text style={styles.emptyStateTitle}>No Recipients Yet</Text>
            <Text style={styles.emptyStateText}>
              Add your first recipient to start sending money
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => handleOpenModal()}
            >
              <Text style={styles.emptyStateButtonText}>Add Recipient</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recipients.map((recipient) => (
            <View key={recipient.id} style={styles.recipientCard}>
              <View style={styles.recipientHeader}>
                <View style={styles.recipientInfo}>
                  <Text style={styles.recipientName}>{recipient.full_name}</Text>
                  <Text style={styles.recipientPhone}>{recipient.phone_number}</Text>
                  <Text style={styles.recipientMpesa}>
                    M-Pesa: {recipient.mpesa_number}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={() => handleToggleFavorite(recipient)}
                >
                  <Star
                    size={20}
                    color={recipient.is_favorite ? '#F59E0B' : '#CCCCCC'}
                    fill={recipient.is_favorite ? '#F59E0B' : 'transparent'}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.recipientActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleOpenModal(recipient)}
                >
                  <Edit size={16} color="#0066FF" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteRecipient(recipient)}
                >
                  <Trash size={16} color="#EF4444" />
                  <Text style={[styles.actionButtonText, styles.deleteText]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRecipient ? 'Edit Recipient' : 'Add Recipient'}
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <X size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={formData.full_name}
                onChangeText={(text) =>
                  setFormData({ ...formData, full_name: text })
                }
              />

              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+254 700 000 000"
                value={formData.phone_number}
                onChangeText={(text) =>
                  setFormData({ ...formData, phone_number: text })
                }
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>M-Pesa Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+254 700 000 000"
                value={formData.mpesa_number}
                onChangeText={(text) =>
                  setFormData({ ...formData, mpesa_number: text })
                }
                keyboardType="phone-pad"
              />

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  loading && styles.saveButtonDisabled,
                ]}
                onPress={handleSaveRecipient}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save Recipient'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recipientCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  recipientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  recipientPhone: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  recipientMpesa: {
    fontSize: 14,
    color: '#666666',
  },
  favoriteButton: {
    padding: 8,
  },
  recipientActions: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
  },
  deleteText: {
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  form: {
    paddingHorizontal: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
