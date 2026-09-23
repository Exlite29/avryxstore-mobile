import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen, Card, Field, Button, LoadingState } from '@/components/ui';
import { useAppColors } from '@/constants/theme';
import { productService } from '@/lib/services/productService';

export default function ProductFormScreen() {
  const colors = useAppColors();
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id;

  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [stock, setStock] = useState('');
  const [lowStock, setLowStock] = useState('5');
  const [unit, setUnit] = useState('pcs');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(!!editingId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editingId) return;
    (async () => {
      try {
        const product = await productService.getById(editingId);
        setName(product.name || '');
        setBarcode(product.barcode || '');
        setCategory(product.category || '');
        setUnitPrice(String(product.unit_price ?? product.price ?? ''));
        setStock(String(product.stock_quantity ?? product.stock ?? ''));
        setLowStock(String(product.low_stock_threshold ?? product.min_stock_level ?? '5'));
        setUnit(product.unit || 'pcs');
        setDescription(product.description || '');
      } catch (e: any) {
        setError(e?.message || 'Failed to load product.');
      } finally {
        setLoading(false);
      }
    })();
  }, [editingId]);

  const submit = async () => {
    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }
    const price = parseFloat(unitPrice);
    if (Number.isNaN(price) || price < 0) {
      setError('Enter a valid unit price.');
      return;
    }
    setError('');
    setSaving(true);
    const payload = {
      name: name.trim(),
      barcode: barcode.trim() || undefined,
      category: category.trim() || undefined,
      unit_price: price,
      stock_quantity: stock.trim() !== '' ? Math.max(0, parseInt(stock, 10) || 0) : undefined,
      low_stock_threshold: Math.max(0, parseInt(lowStock, 10) || 0),
      unit: unit.trim() || 'pcs',
      description: description.trim() || undefined,
    };
    try {
      if (editingId) {
        await productService.update(editingId, payload);
      } else {
        await productService.create(payload);
      }
      router.back();
    } catch (e: any) {
      setError(e?.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <LoadingState label="Loading product…" />
      </Screen>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <Screen scroll keyboardAvoiding>
        {error ? (
          <View style={{ borderColor: colors.danger, borderWidth: 1, borderRadius: 10, padding: 12, backgroundColor: colors.danger + '18' }}>
            <Text style={{ color: colors.danger }}>{error}</Text>
          </View>
        ) : null}

        <Card style={{ gap: 14 }}>
          <Field label="Product Name *" value={name} onChangeText={setName} placeholder="e.g. Coke 1.5L" />
          <Field label="Barcode" value={barcode} onChangeText={setBarcode} placeholder="Scan or type barcode" autoCapitalize="none" />
          <Field label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Beverages" />
          <Field label="Unit Price (₱) *" value={unitPrice} onChangeText={setUnitPrice} placeholder="0.00" keyboardType="decimal-pad" />
          <Field label="Stock Quantity" value={stock} onChangeText={setStock} placeholder="0" keyboardType="number-pad" />
          <Field label="Low Stock Threshold" value={lowStock} onChangeText={setLowStock} placeholder="5" keyboardType="number-pad" />
          <Field label="Unit" value={unit} onChangeText={setUnit} placeholder="pcs" />
          <Field label="Description" value={description} onChangeText={setDescription} placeholder="Optional" multiline />

          <Button title={editingId ? 'Update Product' : 'Add Product'} onPress={submit} loading={saving} style={{ marginTop: 6 }} />
          <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
        </Card>
      </Screen>
    </SafeAreaView>
  );
}