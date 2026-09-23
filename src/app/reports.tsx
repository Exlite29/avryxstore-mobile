import { useCallback, useEffect, useState } from 'react';
import { ScrollView, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Screen, Card, CardRow, ErrorState, LoadingState, Badge } from '@/components/ui';
import { useAppColors, formatPHP, formatDate } from '@/constants/theme';
import { reportService, TopProduct, DailyPoint } from '@/lib/services/reportService';
import { salesService } from '@/lib/services/salesService';
import { inventoryService } from '@/lib/services/inventoryService';
import { money } from '@/lib/types';

export default function ReportsScreen() {
  const colors = useAppColors();

  const [today, setToday] = useState({ revenue: 0, count: 0 });
  const [valuation, setValuation] = useState(0);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const todayDate = new Date().toISOString().slice(0, 10);
      const [day, val, top, dailyData] = await Promise.all([
        salesService.getDailySummary(),
        inventoryService.getValuation().catch(() => 0),
        reportService.getTopProducts({ from: todayDate, to: todayDate }).catch(() => []),
        reportService.getDaily({ from: todayDate, to: todayDate }).catch(() => []),
      ]);
      setToday({ revenue: day.total_revenue ?? day.totalRevenue ?? 0, count: day.sale_count ?? day.saleCount ?? 0 });
      setValuation(val);
      setTopProducts(top);
      setDaily(dailyData);
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Card style={[styles.stat, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.primaryForeground, fontWeight: '700' }}>Sales Today</Text>
            <Text style={{ color: colors.primaryForeground, fontSize: 24, fontWeight: '900', marginTop: 4 }}>
              {formatPHP(today.revenue)}
            </Text>
            <Text style={{ color: colors.primaryForeground + 'cc', fontSize: 12 }}>{today.count} transactions</Text>
          </Card>
          <Card style={[styles.stat, { backgroundColor: colors.success }]}>
            <Text style={{ color: colors.primaryForeground, fontWeight: '700' }}>Inventory Value</Text>
            <Text style={{ color: colors.primaryForeground, fontSize: 24, fontWeight: '900', marginTop: 4 }}>
              {formatPHP(valuation)}
            </Text>
          </Card>
        </View>

        <Card>
          <Text style={{ fontWeight: '800', color: colors.text }}>Top Products Today</Text>
          {topProducts.length === 0 ? (
            <Text style={{ color: colors.muted }}>No product sales yet today.</Text>
          ) : (
            topProducts.slice(0, 10).map((p, i) => (
              <CardRow key={i} style={styles.listRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Badge label={String(i + 1)} color={colors.primary} bg={colors.primaryMuted} />
                  <Text numberOfLines={1} style={{ flex: 1, color: colors.text }}>
                    {p.name || p.product_name || `Product #${p.product_id}`}
                  </Text>
                </View>
                <Text style={{ color: colors.text, fontWeight: '700' }}>
                  {formatPHP(money(p.revenue ?? p.total_revenue))}
                </Text>
              </CardRow>
            ))
          )}
        </Card>

        <Card>
          <Text style={{ fontWeight: '800', color: colors.text }}>Sales by Day</Text>
          {daily.length === 0 ? (
            <Text style={{ color: colors.muted }}>No sales data for today.</Text>
          ) : (
            daily
              .slice(0, 14)
              .reverse()
              .map((d, i) => (
                <CardRow key={i} style={styles.listRow}>
                  <Text style={{ color: colors.muted }}>{formatDate(d.date)}({d.day || ''})</Text>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{formatPHP(money(d.revenue))}</Text>
                </CardRow>
              ))
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stat: {
    flex: 1,
    borderRadius: 12,
  },
  listRow: {
    paddingVertical: 6,
  },
});
