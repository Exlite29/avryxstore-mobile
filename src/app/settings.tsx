import { useState } from 'react';
import { Text, View } from 'react-native';
import { Screen, Card, Field, Button, CardRow, showConfirm } from '@/components/ui';
import { useAppColors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme, ThemeMode } from '@/context/theme';
import { authService } from '@/lib/services/authService';

export default function SettingsScreen() {
  const colors = useAppColors();
  const { user, logout, refreshProfile } = useAuth();
  const { mode, setMode } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [nameSaving, setNameSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');

  const saveName = async () => {
    if (!name.trim()) return;
    setNameSaving(true);
    try {
      await authService.updateProfile({ name: name.trim() });
      await refreshProfile();
    } catch (e: any) {
      alert(e?.message || 'Failed to update profile.');
    } finally {
      setNameSaving(false);
    }
  };

  const savePassword = async () => {
    setPasswordMsg('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg('Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('New passwords do not match.');
      return;
    }
    setPasswordSaving(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      setPasswordMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setPasswordMsg(e?.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const confirmLogout = async () => {
    const ok = await showConfirm('Log out?', 'You will need to sign in again to continue.', 'Log Out');
    if (ok) await logout();
  };

  return (
    <Screen>
      <Card>
        <Text style={{ fontWeight: '800', color: colors.text }}>Profile</Text>
        <CardRow>
          <Text style={{ color: colors.muted }}>Name</Text>
          <Text style={{ color: colors.text, fontWeight: '600' }}>{user?.name || '—'}</Text>
        </CardRow>
        <CardRow>
          <Text style={{ color: colors.muted }}>Email</Text>
          <Text style={{ color: colors.text }}>{user?.email || '—'}</Text>
        </CardRow>
        {user?.role ? (
          <CardRow>
            <Text style={{ color: colors.muted }}>Role</Text>
            <Text style={{ color: colors.text }}>{user.role}</Text>
          </CardRow>
        ) : null}
        <Field label="Display Name" value={name} onChangeText={setName} />
        <Button title="Save Name" loading={nameSaving} onPress={saveName} variant="outline" />
      </Card>

      <Card>
        <Text style={{ fontWeight: '800', color: colors.text }}>Appearance</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          {(['light', 'dark', 'system'] as ThemeMode[]).map((m) => (
            <Button
              key={m}
              title={m === 'light' ? 'Light' : m === 'dark' ? 'Dark' : 'System'}
              variant={mode === m ? 'primary' : 'outline'}
              style={{ flex: 1 }}
              onPress={() => setMode(m)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <Text style={{ fontWeight: '800', color: colors.text }}>Change Password</Text>
        <FieldsPasswordField label="Current Password" value={currentPassword} onChangeText={setCurrentPassword} />
        <FieldsPasswordField label="New Password" value={newPassword} onChangeText={setNewPassword} />
        <FieldsPasswordField label="Confirm New Password" value={confirmPassword} onChangeText={setConfirmPassword} />
        {passwordMsg ? (
          <Text style={{ color: passwordMsg.includes('successfully') ? colors.success : colors.danger, fontSize: 13 }}>
            {passwordMsg}
          </Text>
        ) : null}
        <Button title="Update Password" loading={passwordSaving} onPress={savePassword} variant="outline" />
      </Card>

      <Button title="Log Out" variant="danger" onPress={confirmLogout} />
    </Screen>
  );
}

function FieldsPasswordField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  return <Field label={label} value={value} onChangeText={onChangeText} secureTextEntry autoCapitalize="none" />;
}