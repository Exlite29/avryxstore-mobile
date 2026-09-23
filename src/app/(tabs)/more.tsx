import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card } from '@/components/ui';
import { useAppColors } from '@/constants/theme';
import { useAuth } from '@/context/auth';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  href: string;
  color: string;
}

export default function MoreScreen() {
  const colors = useAppColors();
  const { user } = useAuth();

  const menu: MenuItem[] = [
    {
      icon: 'receipt',
      label: 'Sales History',
      subtitle: 'All completed transactions',
      href: '/sales',
      color: colors.primary,
    },
    {
      icon: 'stats-chart',
      label: 'Reports',
      subtitle: 'Daily sales and top products',
      href: '/reports',
      color: colors.success,
    },
    {
      icon: 'settings',
      label: 'Settings',
      subtitle: 'Profile, password, server',
      href: '/settings',
      color: colors.warning,
    },
  ];

  return (
    <Screen scroll>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="person" size={26} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontWeight: '800', fontSize: 17, color: colors.text }}>
              {user?.name || user?.email || 'Store User'}
            </Text>
            <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 13 }}>
              {user?.email || ''}
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.menu}>
        {menu.map((item) => (
          <Card key={item.href} style={styles.menuRow}>
            <TouchableOpacity style={styles.menuTouch} onPress={() => router.push(item.href as any)}>
              <View style={{ width: 40, alignItems: 'center' }}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.text }}>{item.label}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </TouchableOpacity>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  menu: {
    gap: 8,
  },
  menuRow: {
    padding: 0,
  },
  menuTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
  },
});