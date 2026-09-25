import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Screen, Field, Button } from '@/components/ui';
import { useAppColors } from '@/constants/theme';

export default function LoginScreen() {
  const colors = useAppColors();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboardAvoiding>
      <View style={styles.header}>
        <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
        <Text style={[styles.title, { color: colors.text }]}>Avryx Store</Text>
        <Text style={{ color: colors.muted, textAlign: 'center' }}>
          Point of sale for your sari-sari store
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        {error ? (
          <View style={{ borderColor: colors.danger, borderWidth: 1, borderRadius: 10, padding: 12, backgroundColor: colors.danger + '18' }}>
            <Text style={{ color: colors.danger }}>{error}</Text>
          </View>
        ) : null}

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
        />

        <Button title="Sign In" onPress={handleLogin} loading={loading} />

        <TouchableOpacity onPress={() => router.push('/register')} style={{ marginTop: 8 }}>
          <Text style={{ color: colors.primary, textAlign: 'center', fontWeight: '600' }}>
            Don&apos;t have an account? Register
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: 8,
    marginVertical: 40,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
});