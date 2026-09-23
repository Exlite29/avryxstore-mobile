import { api, bodyOf } from '../api';
import { extractList, InventoryItem } from '../types';

export interface InventoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export const inventoryService = {
  getAll: async (params: InventoryQuery = {}): Promise<InventoryItem[]> => {
    const query: Record<string, string> = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') query[k] = String(v);
    });
    const qs = new URLSearchParams(query).toString();
    const endpoint = `/api/v1/inventory${qs ? `?${qs}` : ''}`;
    const response = await api(endpoint);
    return extractList<InventoryItem>(bodyOf(response));
  },

  getByProduct: async (productId: number | string): Promise<InventoryItem | null> => {
    try {
      const response = await api(`/api/v1/inventory/product/${productId}`);
      const body = bodyOf(response);
      const item = (body?.data || body?.item || body) as InventoryItem;
      return item?.product_id || item?.total_inventory_qty != null ? item : null;
    } catch {
      return null;
    }
  },

  getMovements: async (productId: number | string): Promise<any[]> => {
    const response = await api(`/api/v1/inventory/product/${productId}/movements`);
    return extractList<any>(bodyOf(response));
  },

  addStock: async (productId: number | string, data: { quantity: number; reason?: string }): Promise<any> => {
    const response = await api(`/api/v1/inventory/product/${productId}/add`, { method: 'POST', body: data });
    return bodyOf(response);
  },

  removeStock: async (productId: number | string, data: { quantity: number; reason?: string }): Promise<any> => {
    const response = await api(`/api/v1/inventory/product/${productId}/remove`, { method: 'POST', body: data });
    return bodyOf(response);
  },

  adjustStock: async (productId: number | string, data: { quantity: number; reason?: string }): Promise<any> => {
    const response = await api(`/api/v1/inventory/product/${productId}/adjust`, { method: 'POST', body: data });
    return bodyOf(response);
  },

  getValuation: async (): Promise<number> => {
    const response = await api('/api/v1/inventory/valuation');
    const body = bodyOf(response);
    const v = body?.value ?? body?.total_value ?? body?.valuation ?? body?.total;
    return Number(v || 0);
  },
};