import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen, Card, Field, Button, LoadingState } from '@/components/ui';
import { useAppColors } from '@/constants/theme';
import { productService } from '@/lib/services/productService';
import { useBarcodeScanner } from '@/lib/useBarcodeScanner';

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
  const { handleFieldChange, handleFieldSubmit, handleSelectionChange, flushCapture } = useBarcodeScanner(setBarcode);

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
    const pendingBarcode = flushCapture();
    const submittedBarcode = pendingBarcode?.value ?? barcode;
    setSaving(true);
    const payload = {
      name: name.trim(),
      barcode: submittedBarcode.trim() || undefined,
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
          <Field
            label="Product Name *"
            value={name}
            onChangeText={(value) => handleFieldChange('name', name, value, setName)}
            onSubmitEditing={() => handleFieldSubmit('name', setName)}
            onSelectionChange={(event) => handleSelectionChange('name', event.nativeEvent.selection)}
            placeholder="e.g. Coke 1.5L"
          />
          <Field
            label="Barcode"
            value={barcode}
            onChangeText={(value) => handleFieldChange('barcode', barcode, value, setBarcode)}
            onSubmitEditing={() => handleFieldSubmit('barcode', setBarcode)}
            onSelectionChange={(event) => handleSelectionChange('barcode', event.nativeEvent.selection)}
            placeholder="Scan or type barcode"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
          />
          <Field
            label="Category"
            value={category}
            onChangeText={(value) => handleFieldChange('category', category, value, setCategory)}
            onSubmitEditing={() => handleFieldSubmit('category', setCategory)}
            onSelectionChange={(event) => handleSelectionChange('category', event.nativeEvent.selection)}
            placeholder="e.g. Beverages"
          />
          <Field
            label="Unit Price (₱) *"
            value={unitPrice}
            onChangeText={(value) => handleFieldChange('unitPrice', unitPrice, value, setUnitPrice)}
            onSubmitEditing={() => handleFieldSubmit('unitPrice', setUnitPrice)}
            onSelectionChange={(event) => handleSelectionChange('unitPrice', event.nativeEvent.selection)}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
          <Field
            label="Stock Quantity"
            value={stock}
            onChangeText={(value) => handleFieldChange('stock', stock, value, setStock)}
            onSubmitEditing={() => handleFieldSubmit('stock', setStock)}
            onSelectionChange={(event) => handleSelectionChange('stock', event.nativeEvent.selection)}
            placeholder="0"
            keyboardType="number-pad"
          />
          <Field
            label="Low Stock Threshold"
            value={lowStock}
            onChangeText={(value) => handleFieldChange('lowStock', lowStock, value, setLowStock)}
            onSubmitEditing={() => handleFieldSubmit('lowStock', setLowStock)}
            onSelectionChange={(event) => handleSelectionChange('lowStock', event.nativeEvent.selection)}
            placeholder="5"
            keyboardType="number-pad"
          />
          <Field
            label="Unit"
            value={unit}
            onChangeText={(value) => handleFieldChange('unit', unit, value, setUnit)}
            onSubmitEditing={() => handleFieldSubmit('unit', setUnit)}
            onSelectionChange={(event) => handleSelectionChange('unit', event.nativeEvent.selection)}
            placeholder="pcs"
          />
          <Field
            label="Description"
            value={description}
            onChangeText={(value) => handleFieldChange('description', description, value, setDescription)}
            onSubmitEditing={() => handleFieldSubmit('description', setDescription)}
            onSelectionChange={(event) => handleSelectionChange('description', event.nativeEvent.selection)}
            placeholder="Optional"
            multiline
          />

          <Button title={editingId ? 'Update Product' : 'Add Product'} onPress={submit} loading={saving} style={{ marginTop: 6 }} />
          <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
        </Card>
      </Screen>
    </SafeAreaView>
  );
}