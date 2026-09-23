import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, CardRow, Button, EmptyState, ErrorState, LoadingState, StatusBadge, SheetModal, showConfirm } from '@/components/ui';
import { useAppColors, formatPHP, formatDate } from '@/constants/theme';
import { salesService } from '@/lib/services/salesService';
import { Sale, SaleItem, money } from '@/lib/types';

export default function SalesScreen() {
  const colors = useAppColors();

  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState({ revenue: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<Sale | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async (pageNum: number, append: boolean) => {
    try {
      const [result, day] = await Promise.all([salesService.getAll({ page: pageNum, limit: 20 }), salesService.getDailySummary()]);
      const newItems = result.items;
      setSales((prev) => (append ? [...prev, ...newItems] : newItems));
      setHasMore(pageNum < (result.pagination.totalPages || 1));
      setSummary({ revenue: day.total_revenue ?? day.totalRevenue ?? 0, count: day.sale_count ?? day.saleCount ?? 0 });
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to load sales.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(1, false);
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    load(1, false);
  };

  const loadMore = () => {
    if (!hasMore || loading) return;
    setPage((p) => p + 1);
    load(page + 1, true);
  };

  const totalOf = (sale: Sale) => money(sale.total_amount ?? sale.total);

  const cancelSale = async () => {
    if (!selected) return;
    const ok = await showConfirm('Cancel sale?', 'This sale will be voided. Continue?', 'Cancel Sale', true);
    if (!ok) return;
    setCancelling(true);
    try {
      await salesService.cancel(selected.id);
      setSelected(null);
      onRefresh();
    } catch (e: any) {
      alert(e?.message || 'Failed to cancel sale.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading && sales.length === 0) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (error && sales.length === 0) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={() => { setLoading(true); setPage(1); load(1, false); }} />
      </Screen>
    );
  }

  const items = selected?.items || [];

  return (
    <Screen scroll={false}>
      <Card>
        <CardRow>
          <View style={{ gap: 2 }}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>Sales Today</Text>
            <Text style={{ fontSize: 26, fontWeight: '900', color: colors.primary }}>{formatPHP(summary.revenue)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>Transactions</Text>
            <Text style={{ fontSize: 26, fontWeight: '900', color: colors.text }}>{summary.count}</Text>
          </View>
        </CardRow>
      </Card>

      <FlatList
        data={sales}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 24, gap: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="receipt-outline" size={40} color={colors.muted} />}
            title="No sales yet"
            subtitle="Completed transactions will appear here."
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <Card>
            <TouchableOpacity onPress={() => setSelected(item)}>
              <CardRow>
                <View style={{ gap: 2, flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>
                    {item.transaction_code || item.reference || `Sale #${item.id}`}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{formatDate(item.created_at)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ fontWeight: '800', color: colors.text }}>{formatPHP(totalOf(item))}</Text>
                  <StatusBadge status={item.status} />
                </View>
              </CardRow>
            </TouchableOpacity>
          </Card>
        )}
      />

      <SheetModal visible={!!selected} onClose={() => setSelected(null)} title="Sale Details">
        {selected ? (
          <View style={{ gap: 12 }}>
            <Card>
              <Text style={{ fontWeight: '700', color: colors.text }}>
                {selected.transaction_code || selected.reference || `Sale #${selected.id}`}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>{formatDate(selected.created_at)}</Text>
            </Card>

            <Card style={{ gap: 6 }}>
              {items.length === 0 ? (
                <Text style={{ color: colors.muted }}>No item details available.</Text>
              ) : (
                items.map((it: SaleItem, i) => (
                  <CardRow key={i}>
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>
                        {it.product_name || it.name || `Item #${it.product_id}`}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>
                        {it.quantity} × {formatPHP(it.unit_price)}
                      </Text>
                    </View>
                    <Text style={{ fontWeight: '700', color: colors.text }}>{formatPHP(money(it.subtotal))}</Text>
                  </CardRow>
                ))
              )}
            </Card>

            <Card>
              <CardRow>
                <Text style={{ color: colors.muted }}>Total</Text>
                <Text style={{ fontWeight: '800', color: colors.text }}>{formatPHP(totalOf(selected))}</Text>
              </CardRow>
              <CardRow>
                <Text style={{ color: colors.muted }}>Amount Paid</Text>
                <Text style={{ color: colors.text }}>{formatPHP(money(selected.amount_paid))}</Text>
              </CardRow>
              <CardRow>
                <Text style={{ color: colors.muted }}>Change</Text>
                <Text style={{ color: colors.text }}>{formatPHP(money(selected.change))}</Text>
              </CardRow>
              {selected.payment_method ? (
                <CardRow>
                  <Text style={{ color: colors.muted }}>Payment</Text>
                  <StatusBadge status={selected.payment_method} />
                </CardRow>
              ) : null}
            </Card>

            <Button title="Cancel Sale" variant="danger" loading={cancelling} onPress={cancelSale} />
          </View>
        ) : null}
      </SheetModal>
    </Screen>
  );
}
