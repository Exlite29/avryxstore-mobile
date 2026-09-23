import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Button, EmptyState, ErrorState, LoadingState, Badge, SheetModal } from '@/components/ui';
import { useAppColors } from '@/constants/theme';
import { inventoryService } from '@/lib/services/inventoryService';
import { InventoryItem, qty } from '@/lib/types';

type AdjustMode = 'add' | 'remove' | 'adjust';

export default function InventoryScreen() {
  const colors = useAppColors();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const searchRef = useRef(search);

  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [mode, setMode] = useState<AdjustMode>('add');
  const [qtyInput, setQtyInput] = useState('1');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (term = '') => {
    try {
      const list = await inventoryService.getAll({ limit: 500, search: term });
      setItems(list);
    } catch (e: any) {
      setError(e?.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    searchRef.current = search;
    const t = setTimeout(() => {
      load(search);
    }, 400);
    return () => clearTimeout(t);
  }, [search, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(search);
  };

  const openAction = (item: InventoryItem, m: AdjustMode) => {
    setSelected(item);
    setMode(m);
    setQtyInput('1');
  };

  const stock = (item: InventoryItem) =>
    qty(item.total_inventory_qty ?? item.stock_quantity ?? item.stock);

  const nameOf = (item: InventoryItem) =>
    String(item.product_name || item.name || item.id || 'Item');

  const submit = async () => {
    if (!selected) return;
    const amount = Math.abs(parseInt(qtyInput, 10));
    if (!amount) return;
    const productId = selected.product_id ?? selected.id;
    if (productId == null) return;

    setBusy(true);
    const reason = mode === 'add' ? 'Mobile restock' : mode === 'remove' ? 'Mobile manual removal' : 'Mobile adjustment';
    try {
      const data = { quantity: amount, reason };
      if (mode === 'add') await inventoryService.addStock(productId, data);
      else if (mode === 'remove') await inventoryService.removeStock(productId, data);
      else await inventoryService.adjustStock(productId, data);
      setSelected(null);
      onRefresh();
    } catch (e: any) {
      alert(e?.message || 'Failed to update stock.');
    } finally {
      setBusy(false);
    }
  };

  if (loading && items.length === 0) {
    return (
      <Screen scroll={false}>
        <LoadingState />
      </Screen>
    );
  }

  if (error && items.length === 0) {
    return (
      <Screen scroll={false}>
        <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />
      </Screen>
    );
  }

  const modeTitle = mode === 'add' ? 'Add Stock' : mode === 'remove' ? 'Remove Stock' : 'Adjust Stock';
  const modeColor = mode === 'add' ? colors.success : mode === 'remove' ? colors.danger : colors.warning;

  return (
    <Screen scroll={false} style={{ padding: 0 }}>
      <View style={{ padding: 16, gap: 12, paddingBottom: 4 }}>
        <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search inventory"
            placeholderTextColor={colors.muted}
            style={{ flex: 1, color: colors.text, fontSize: 15 }}
          />
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, i) => `${item.product_id ?? item.id ?? 'inv'}-${i}`}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="cube-outline" size={40} color={colors.muted} />}
            title="No inventory found"
            subtitle="Stock levels for your products will appear here."
          />
        }
        renderItem={({ item }) => {
          const stockQty = stock(item);
          const low = qty(item.low_stock_threshold ?? item.min_stock_level) > 0 && stockQty <= qty(item.low_stock_threshold ?? item.min_stock_level);
          return (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text numberOfLines={1} style={{ fontWeight: '700', color: colors.text }}>
                    {nameOf(item)}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    {item.category || ''}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                    <Badge
                      label={`${stockQty}`}
                      color={low ? colors.warning : colors.success}
                      bg={low ? colors.warning + '22' : colors.success + '22'}
                    />
                  </View>
                </View>
                <View style={{ gap: 6 }}>
                  <Button title="+" variant="outline" style={{ height: 34, minWidth: 56 }} onPress={() => openAction(item, 'add')} />
                  <Button title="−" variant="outline" style={{ height: 34, minWidth: 56 }} onPress={() => openAction(item, 'remove')} />
                </View>
              </View>
            </Card>
          );
        }}
      />

      <SheetModal visible={!!selected} onClose={() => setSelected(null)} title={modeTitle}>
        {selected ? (
          <View style={{ gap: 16 }}>
            <Card>
              <Text style={{ fontWeight: '700', color: colors.text }}>{nameOf(selected)}</Text>
              <Text style={{ color: colors.muted, marginTop: 2 }}>Current stock: {stock(selected)}</Text>
              <FieldLabel>Amount to {mode}</FieldLabel>
              <TextInput
                value={qtyInput}
                onChangeText={setQtyInput}
                keyboardType="number-pad"
                style={[styles.qtyInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />
            </Card>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title="+1" variant="outline" style={{ flex: 1 }} onPress={() => setQtyInput((p) => String((parseInt(p, 10) || 0) + 1))} />
              <Button title="+5" variant="outline" style={{ flex: 1 }} onPress={() => setQtyInput((p) => String((parseInt(p, 10) || 0) + 5))} />
              <Button title="+10" variant="outline" style={{ flex: 1 }} onPress={() => setQtyInput((p) => String((parseInt(p, 10) || 0) + 10))} />
            </View>
            <Button title={modeTitle} loading={busy} onPress={submit} style={{ backgroundColor: modeColor }} />
          </View>
        ) : null}
      </SheetModal>

      <Text style={{ color: colors.muted, fontSize: 12, paddingHorizontal: 16, paddingTop: 2 }}>
        Note: total stock value shown is read directly from the server.
      </Text>
    </Screen>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  const colors = useAppColors();
  return (
    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 8 }}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  qtyInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
});