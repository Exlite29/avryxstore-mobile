import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useIsFocused } from 'expo-router';
import { Screen, Card, CardRow, Button, QtyStepper, SheetModal, EmptyState } from '@/components/ui';
import { useAppColors, formatPHP } from '@/constants/theme';
import { productService } from '@/lib/services/productService';
import { salesService } from '@/lib/services/salesService';
import { Product, money } from '@/lib/types';
import { useAuth } from '@/context/auth';
import { Ionicons } from '@expo/vector-icons';

interface CartLine {
  product: Product;
  quantity: number;
}

export default function ScannerScreen() {
  const colors = useAppColors();
  const isFocused = useIsFocused();
  const { refreshProfile } = useAuth();

  const [permission, requestPermission] = useCameraPermissions();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [manualBarcode, setManualBarcode] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [lastScan, setLastScan] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [paying, setPaying] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);

  const lastScanRef = useRef<{ value: string; at: number }>({ value: '', at: 0 });

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + money(line.product.unit_price ?? line.product.price) * line.quantity, 0),
    [cart]
  );

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { product, quantity: 1 }];
    });
    setLookupError('');
  }, []);

  const handleBarcode = useCallback(
    async (barcode: string) => {
      const cleaned = barcode.trim();
      if (!cleaned) return;

      const now = Date.now();
      if (lastScanRef.current.value === cleaned && now - lastScanRef.current.at < 1500) {
        return;
      }
      lastScanRef.current = { value: cleaned, at: now };
      setLastScan(cleaned);

      try {
        const product = await productService.getByBarcode(cleaned);
        if (product) {
          addToCart(product);
        } else {
          Alert.alert('Product not found', `No product has barcode ${cleaned}. Add it from the Products tab.`);
        }
      } catch (e: any) {
        Alert.alert('Scan failed', e?.message || 'Could not look up this barcode.');
      }
    },
    [addToCart]
  );

  const onBarcodeScanned = (result: BarcodeScanningResult) => {
    handleBarcode(result.data);
  };

  const removeLine = (productId: number) => {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  };

  const paid = parseFloat(amountPaid) || 0;
  const change = paid - total;

  const resetTransaction = useCallback(() => {
    setCart([]);
    setAmountPaid('');
    setCheckoutOpen(false);
    setCompletedSale(null);
    setLastScan('');
  }, []);

  const completeSale = async () => {
    if (cart.length === 0 || paid < total) return;
    setPaying(true);
    try {
      const sale = await salesService.create({
        items: cart.map((l) => ({
          product_id: l.product.id,
          quantity: l.quantity,
          unit_price: money(l.product.unit_price ?? l.product.price),
        })),
        payment_method: 'cash',
        amount_paid: paid,
        discount: 0,
      });
      setCompletedSale(sale || { change });
      refreshProfile();
      // Auto-start the next transaction after 5 seconds.
      setTimeout(resetTransaction, 5000);
    } catch (e: any) {
      Alert.alert('Checkout failed', e?.message || 'Could not complete the sale.');
    } finally {
      setPaying(false);
    }
  };

  const cameraActive = isFocused && !checkoutOpen;

  return (
    <Screen scroll={cart.length === 0} style={{ padding: 0 }}>
      {cameraActive && permission === null ? (
        <Card>
          <Text style={{ color: colors.muted }}>Preparing camera…</Text>
        </Card>
      ) : cameraActive && !permission?.granted ? (
        <Card style={styles.permissionCard}>
          <Ionicons name="camera" size={28} color={colors.primary} />
          <Text style={{ color: colors.text, fontWeight: '600' }}>Camera permission needed</Text>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>
            Avryx uses the camera to scan product barcodes.
          </Text>
          <Button title="Grant Camera Access" onPress={requestPermission} style={{ marginTop: 4 }} />
        </Card>
      ) : cameraActive ? (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <View>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'itf14', 'qr'],
              }}
              onBarcodeScanned={onBarcodeScanned}
            />
            <View pointerEvents="none" style={styles.scanFrame}>
              <Text style={styles.scanFrameText}>Point the camera at a barcode</Text>
            </View>
          </View>
        </Card>
      ) : null}

      <Card>
        <Text style={{ fontWeight: '700', color: colors.text }}>Manual entry</Text>
        <View style={styles.manualRow}>
          <TextInput
            value={manualBarcode}
            onChangeText={setManualBarcode}
            placeholder="Type or paste barcode"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.manualInput,
              { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
            ]}
            onSubmitEditing={() => {
              handleBarcode(manualBarcode);
              setManualBarcode('');
            }}
          />
          <Button
            title="Add"
            variant="outline"
            onPress={() => {
              handleBarcode(manualBarcode);
              setManualBarcode('');
            }}
            style={{ minWidth: 72 }}
          />
        </View>
        {lookupError ? <Text style={{ color: colors.danger, fontSize: 12 }}>{lookupError}</Text> : null}
      </Card>

      {cart.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Ionicons name="cart-outline" size={40} color={colors.muted} />}
            title="Cart is empty"
            subtitle={lastScan ? `Last scanned: ${lastScan}` : 'Scan or enter a barcode to add items'}
          />
        </Card>
      ) : (
        <View style={{ gap: 8 }}>
          {cart.map((line) => (
            <Card key={line.product.id} style={styles.lineCard}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text numberOfLines={1} style={{ fontWeight: '700', color: colors.text }}>
                  {line.product.name}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {line.product.barcode || 'No barcode'} • {formatPHP(line.product.unit_price ?? line.product.price)}
                </Text>
                <QtyStepper value={line.quantity} onChange={(v) => setCart((prev) => prev.map((l) => (l.product.id === line.product.id ? { ...l, quantity: v } : l)))} />
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <Text style={{ fontWeight: '800', color: colors.text }}>
                  {formatPHP(money(line.product.unit_price ?? line.product.price) * line.quantity)}
                </Text>
                <TouchableOpacity onPress={() => removeLine(line.product.id)}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      )}

      <Card style={{ marginTop: 4 }}>
        <CardRow>
          <Text style={{ fontSize: 15, color: colors.muted }}>Items</Text>
          <Text style={{ fontSize: 15, color: colors.text }}>{cart.reduce((n, l) => n + l.quantity, 0)}</Text>
        </CardRow>
        <CardRow>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>Total</Text>
          <Text style={{ fontSize: 22, fontWeight: '900', color: colors.primary }}>{formatPHP(total)}</Text>
        </CardRow>
        <Button title="Checkout" onPress={() => setCheckoutOpen(true)} disabled={cart.length === 0} />
      </Card>

      <SheetModal visible={checkoutOpen} onClose={() => setCheckoutOpen(false)} title="Checkout">
        {completedSale ? (
          <View style={{ gap: 16 }}>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Ionicons name="checkmark-circle" size={56} color={colors.success} />
              <Text style={{ fontSize: 22, fontWeight: '900', color: colors.success }}>Sale Complete!</Text>
              <Text style={{ color: colors.muted }}>Entering the next transaction…</Text>
            </View>
            <Card>
              <CardRow>
                <Text style={{ color: colors.muted }}>Total</Text>
                <Text style={{ fontWeight: '700', color: colors.text }}>{formatPHP(total)}</Text>
              </CardRow>
              <CardRow>
                <Text style={{ color: colors.muted }}>Amount Paid</Text>
                <Text style={{ fontWeight: '700', color: colors.text }}>{formatPHP(paid)}</Text>
              </CardRow>
              <CardRow>
                <Text style={{ color: colors.muted }}>Change</Text>
                <Text style={{ fontWeight: '800', color: colors.success }}>{formatPHP(change)}</Text>
              </CardRow>
            </Card>
            <Button title="New Transaction" variant="outline" onPress={resetTransaction} />
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <Card>
              <CardRow>
                <Text style={{ color: colors.muted }}>Total Due</Text>
                <Text style={{ fontSize: 20, fontWeight: '900', color: colors.primary }}>{formatPHP(total)}</Text>
              </CardRow>
              <FieldLabel>Amount Paid</FieldLabel>
              <TextInput
                value={amountPaid}
                onChangeText={setAmountPaid}
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                style={[
                  styles.amountInput,
                  { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
                ]}
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <Button title="Exact" variant="outline" style={{ flex: 1 }} onPress={() => setAmountPaid(String(total))} />
                <Button
                  title={formatPHP(Math.ceil(total / 100) * 100)}
                  variant="outline"
                  style={{ flex: 1 }}
                  onPress={() => setAmountPaid(String(Math.ceil(total / 100) * 100))}
                />
              </View>
            </Card>
            {paid > 0 ? (
              <Card>
                <CardRow>
                  <Text style={{ color: colors.muted }}>Change</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: change >= 0 ? colors.success : colors.danger }}>
                    {formatPHP(change)}
                  </Text>
                </CardRow>
              </Card>
            ) : null}
            <Button title="Complete Sale" loading={paying} disabled={paid < total} onPress={completeSale} />
            {paid > 0 && paid < total ? (
              <Text style={{ color: colors.danger, textAlign: 'center' }}>Amount paid is less than the total.</Text>
            ) : null}
          </View>
        )}
      </SheetModal>
    </Screen>
  );
}

function FieldLabel({ children }: { children: string }) {
  const colors = useAppColors();
  return (
    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 8 }}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  camera: {
    height: 200,
  },
  scanFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  scanFrameText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  permissionCard: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  manualRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  manualInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  amountInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  lineCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});