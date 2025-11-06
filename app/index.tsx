import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function SplashScreen() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (session && profile) {
        router.replace('/(tabs)');
      } else {
        router.replace('/intro');
      }
    }
  }, [loading, session, profile]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0066FF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0066FF',
  },
});
