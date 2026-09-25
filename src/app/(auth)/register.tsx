import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Screen, Field, Button } from '@/components/ui';
import { useAppColors } from '@/constants/theme';

export default function RegisterScreen() {
  const colors = useAppColors();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    const name = fullName.trim();
    const mail = email.trim().toLowerCase();

    if (name.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (!/^[a-zA-Z\s\-']+$/.test(name)) {
      setError('Name can only contain letters, spaces, hyphens, and apostrophes.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(mail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      setError('Password must be at least 8 characters with an uppercase, lowercase, and number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await register({ full_name: name, email: mail, password });
      router.replace('/(tabs)');
    } catch (e: any) {
      const details = e?.details;
      const firstDetail =
        Array.isArray(details) && details.length > 0
          ? (details[0]?.msg || details[0]?.message)
          : null;
      setError(
        e?.errorCode === 'VAL_001' && !firstDetail
          ? 'Please check your details and try again.'
          : (firstDetail || e?.message || 'Registration failed. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboardAvoiding>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
        <Text style={{ color: colors.muted, textAlign: 'center' }}>
          Register to start using Avryx Store
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        {error ? (
          <View style={{ borderColor: colors.danger, borderWidth: 1, borderRadius: 10, padding: 12, backgroundColor: colors.danger + '18' }}>
            <Text style={{ color: colors.danger }}>{error}</Text>
          </View>
        ) : null}

        <Field
          label="Full Name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Juan Dela Cruz"
          autoCapitalize="words"
          autoCorrect={false}
        />
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
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: -6 }}>
          Must contain an uppercase letter, a lowercase letter, and a number (8+ characters).
        </Text>
        <Field
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
        />

        <Button title="Create Account" onPress={handleRegister} loading={loading} />

        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 8 }}>
          <Text style={{ color: colors.primary, textAlign: 'center', fontWeight: '600' }}>
            Already have an account? Sign in
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
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
});