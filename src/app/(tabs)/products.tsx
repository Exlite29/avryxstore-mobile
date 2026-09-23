import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, EmptyState, ErrorState, LoadingState, Badge, showConfirm } from '@/components/ui';
import { useAppColors, formatPHP } from '@/constants/theme';
import { productService } from '@/lib/services/productService';
import { Product, qty } from '@/lib/types';

export default function ProductsScreen() {
  const colors = useAppColors();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const searchRef = useRef(search);

  const fetchPage = useCallback(async (pageNum: number, term: string, append: boolean) => {
    try {
      const result = await productService.getAll({ page: pageNum, limit: 20, search: term });
      const newItems = result.items || [];
      setProducts((prev) => (append ? [...prev, ...newItems] : newItems));
      const totalPages = result.pagination.totalPages || 1;
      setHasMore(pageNum < totalPages);
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to load products.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const load = useCallback(
    (append = false) => {
      fetchPage(append ? page + 1 : 1, searchRef.current, append);
      if (append) setPage((p) => p + 1);
    },
    [fetchPage, page]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    searchRef.current = search;
    const t = setTimeout(() => {
      setPage(1);
      setLoading(true);
      fetchPage(1, search, false);
    }, 400);
    return () => clearTimeout(t);
  }, [search, fetchPage]);

  const onRefresh = () => {
    setRefreshing(true);
    searchRef.current = search;
    setPage(1);
    fetchPage(1, search, false);
  };

  const handleDelete = async (product: Product) => {
    const ok = await showConfirm('Delete product?', `Are you sure you want to delete "${product.name}"?`, 'Delete', true);
    if (!ok) return;
    try {
      await productService.delete(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (e: any) {
      alert(e?.message || 'Failed to delete product');
    }
  };

  const stock = (product: Product) =>
    qty(product.total_inventory_qty ?? product.stock_quantity ?? product.stock);

  if (loading && products.length === 0) {
    return (
      <Screen scroll={false}>
        <LoadingState />
      </Screen>
    );
  }

  if (error && products.length === 0) {
    return (
      <Screen scroll={false}>
        <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={{ padding: 0 }}>
      <View style={{ padding: 16, gap: 12, paddingBottom: 4 }}>
        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search name or barcode"
              placeholderTextColor={colors.muted}
              style={{ flex: 1, color: colors.text, fontSize: 15 }}
              autoCapitalize="none"
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, gap: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="pricetags-outline" size={40} color={colors.muted} />}
            title="No products found"
            subtitle="Adjust your search or add a new product."
          />
        }
        onEndReached={() => {
          if (hasMore && !loading) load(true);
        }}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => {
          const stockQty = stock(item);
          const low = qty(item.low_stock_threshold ?? item.min_stock_level) && stockQty <= qty(item.low_stock_threshold ?? item.min_stock_level);
          return (
            <Card style={styles.row}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push({ pathname: '/product-form', params: { id: String(item.id) } })}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <Text numberOfLines={1} style={{ fontWeight: '700', flex: 1, color: colors.text }}>
                    {item.name}
                  </Text>
                  <Text style={{ fontWeight: '800', color: colors.primary }}>{formatPHP(item.unit_price ?? item.price)}</Text>
                </View>
                <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                  {item.barcode || '— barcode —'} • {item.category || 'No category'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <Badge
                    label={`${stockQty} on hand`}
                    color={low ? colors.warning : colors.success}
                    bg={low ? colors.warning + '22' : colors.success + '22'}
                  />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} style={{ padding: 8 }}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            </Card>
          );
        }}
      />

      <View style={[styles.fab, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.push('/product-form')} style={styles.fabInner}>
          <Ionicons name="add" size={30} color={colors.white} />
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  fabInner: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});