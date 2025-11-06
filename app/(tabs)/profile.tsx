import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  User,
  Shield,
  Bell,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  Fingerprint,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut, refreshProfile } = useAuth();
  const [biometricEnabled, setBiometricEnabled] = useState(
    profile?.biometric_enabled || false
  );

  const handleToggleBiometric = async (value: boolean) => {
    setBiometricEnabled(value);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          biometric_enabled: value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile?.id);

      if (error) throw error;
      await refreshProfile();
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setBiometricEnabled(!value);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const getKYCStatusBadge = () => {
    switch (profile?.kyc_status) {
      case 'approved':
        return (
          <View style={[styles.badge, styles.badgeApproved]}>
            <CheckCircle size={14} color="#10B981" />
            <Text style={styles.badgeText}>Verified</Text>
          </View>
        );
      case 'under_review':
        return (
          <View style={[styles.badge, styles.badgeReview]}>
            <Clock size={14} color="#F59E0B" />
            <Text style={styles.badgeText}>Under Review</Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={[styles.badge, styles.badgeRejected]}>
            <XCircle size={14} color="#EF4444" />
            <Text style={styles.badgeText}>Rejected</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.badge, styles.badgePending]}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.badgeText}>Pending</Text>
          </View>
        );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <User size={32} color="#0066FF" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{profile?.full_name}</Text>
            <Text style={styles.userEmail}>{profile?.email}</Text>
          </View>
        </View>
        {getKYCStatusBadge()}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/kyc')}
        >
          <View style={styles.menuItemLeft}>
            <Shield size={20} color="#666666" />
            <Text style={styles.menuItemText}>KYC Verification</Text>
          </View>
          <ChevronRight size={20} color="#CCCCCC" />
        </TouchableOpacity>

        <View style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Fingerprint size={20} color="#666666" />
            <Text style={styles.menuItemText}>Biometric Login</Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={handleToggleBiometric}
            trackColor={{ false: '#E0E0E0', true: '#0066FF' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Bell size={20} color="#666666" />
            <Text style={styles.menuItemText}>Notifications</Text>
          </View>
          <ChevronRight size={20} color="#CCCCCC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Globe size={20} color="#666666" />
            <Text style={styles.menuItemText}>Language</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Text style={styles.menuItemValue}>English</Text>
            <ChevronRight size={20} color="#CCCCCC" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/support')}
        >
          <View style={styles.menuItemLeft}>
            <HelpCircle size={20} color="#666666" />
            <Text style={styles.menuItemText}>Help & FAQ</Text>
          </View>
          <ChevronRight size={20} color="#CCCCCC" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>RemitBridge v1.0.0</Text>
        <Text style={styles.footerText}>© 2025 RemitBridge Inc.</Text>
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
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 60,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 6,
  },
  badgeApproved: {
    backgroundColor: '#D1FAE5',
  },
  badgeReview: {
    backgroundColor: '#FEF3C7',
  },
  badgeRejected: {
    backgroundColor: '#FEE2E2',
  },
  badgePending: {
    backgroundColor: '#F3F4F6',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 12,
    marginLeft: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemValue: {
    fontSize: 14,
    color: '#666666',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    padding: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
});
