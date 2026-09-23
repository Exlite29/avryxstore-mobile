import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppColors } from '@/constants/theme';

/* ------------------------------ Screen ------------------------------ */

export function Screen({
  children,
  scroll = true,
  style,
  keyboardAvoiding = true,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  keyboardAvoiding?: boolean;
}) {
  const colors = useAppColors();
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, padding: 16 }, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {keyboardAvoiding && Platform.OS === 'ios' ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

export function HeaderTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const colors = useAppColors();
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>{title}</Text>
      {subtitle ? <Text style={{ fontSize: 13, color: colors.muted }}>{subtitle}</Text> : null}
    </View>
  );
}

/* ------------------------------- Card ------------------------------- */

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const colors = useAppColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

export function CardRow({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, style]}>{children}</View>;
}

/* ------------------------------ Button ------------------------------ */

type ButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost';

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const colors = useAppColors();
  const isOutlined = variant === 'outline' || variant === 'ghost';
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : isOutlined
          ? 'transparent'
          : colors.card;
  const textColor =
    variant === 'primary' || variant === 'danger'
      ? colors.white
      : variant === 'outline'
        ? colors.primary
        : colors.muted;
  const borderColor = variant === 'outline' ? colors.primary : colors.border;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: bg, borderColor: variant === 'ghost' ? 'transparent' : borderColor },
        disabled || loading ? { opacity: 0.5 } : null,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={{ color: textColor, fontSize: 15, fontWeight: '700' }}>{title}</Text>}
    </TouchableOpacity>
  );
}

/* ---------------------------- Text field ---------------------------- */

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  const colors = useAppColors();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted }}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        {...props}
        style={[
          {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: Platform.OS === 'ios' ? 12 : 10,
            fontSize: 16,
            color: colors.text,
            backgroundColor: colors.card,
          },
          props.style,
        ]}
      />
    </View>
  );
}

/* ------------------------------ Badge ------------------------------- */

export function Badge({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status?: string }) {
  const colors = useAppColors();
  const s = (status || '').toLowerCase();
  if (s === 'completed' || s === 'success' || s === 'paid' || s === 'active' || s === 'in_stock') {
    return <Badge label="Completed" color={colors.success} bg={colors.success + '22'} />;
  }
  if (s === 'cancelled' || s === 'canceled' || s === 'void' || s === 'out_of_stock') {
    return <Badge label="Cancelled" color={colors.danger} bg={colors.danger + '22'} />;
  }
  if (s === 'low' || s === 'low_stock') {
    return <Badge label="Low Stock" color={colors.warning} bg={colors.warning + '22'} />;
  }
  return (
    <Badge
      label={status || '—'}
      color={colors.muted}
      bg={colors.border}
    />
  );
}

/* ------------------------------ States ------------------------------ */

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  const colors = useAppColors();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ marginTop: 8, color: colors.muted }}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const colors = useAppColors();
  return (
    <View style={styles.center}>
      <Text style={{ color: colors.danger, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>{message}</Text>
      {onRetry ? (
        <Button title="Try Again" onPress={onRetry} style={{ marginTop: 12, alignSelf: 'center' }} />
      ) : null}
    </View>
  );
}

export function EmptyState({ icon, title, subtitle }: { icon?: ReactNode; title: string; subtitle?: string }) {
  const colors = useAppColors();
  return (
    <View style={[styles.center, { paddingVertical: 40 }]}>
      {icon}
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 8 }}>{title}</Text>
      {subtitle ? <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 4 }}>{subtitle}</Text> : null}
    </View>
  );
}

/* ---------------------------- Confirm box --------------------------- */

export function showConfirm(title: string, message: string, okText = 'OK', destructive = false) {
  return new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: okText, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ]);
  });
}

/* ------------------------- Quantity stepper ------------------------- */

export function QtyStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const colors = useAppColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <TouchableOpacity
        onPress={() => onChange(Math.max(1, value - 1))}
        style={[styles.step, { borderColor: colors.border }]}
      >
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>−</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, minWidth: 30, textAlign: 'center' }}>{value}</Text>
      <TouchableOpacity
        onPress={() => onChange(value + 1)}
        style={[styles.step, { borderColor: colors.border }]}
      >
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ------------------------------ Modal ------------------------------- */

export function SheetModal({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const colors = useAppColors();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          {title ? <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text> : null}
          <View style={{ flex: 1 }}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------ Styles ------------------------------ */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  button: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  step: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
});