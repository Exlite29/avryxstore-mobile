import { api, bodyOf } from '../api';
import { extractList, extractEntity, Sale, PaginationMeta } from '../types';

export interface SaleQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateSaleInput {
  items: { product_id: number | string; quantity: number; unit_price: number }[];
  payment_method: string;
  amount_paid: number;
  discount?: number;
}

export interface SaleDaySummary {
  total_revenue: number;
  totalRevenue?: number;
  sale_count: number;
  saleCount?: number;
}

export const salesService = {
  getAll: async (params: SaleQuery = {}): Promise<{ items: Sale[]; pagination: PaginationMeta }> => {
    const query: Record<string, string | number> = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') query[k] = v;
    });
    const qs = new URLSearchParams(String(query as Record<string, string>)).toString();
    const endpoint = `/api/v1/sales${qs ? `?${qs}` : ''}`;
    const response = await api(endpoint);
    const body = bodyOf(response);
    return {
      items: extractList<Sale>(body),
      pagination: {
        total: body?.pagination?.total ?? body?.totalCount ?? body?.total_count,
        totalPages: body?.pagination?.totalPages || 1,
        page: body?.pagination?.page || 1,
      },
    };
  },

  getById: async (id: number | string): Promise<Sale | null> => {
    try {
      const response = await api(`/api/v1/sales/${id}`);
      return extractEntity<Sale>(bodyOf(response));
    } catch (error: any) {
      if (error?.statusCode === 404) return null;
      throw error;
    }
  },

  getDailySummary: async (): Promise<SaleDaySummary> => {
    const response = await api('/api/v1/sales/daily-summary');
    const body = bodyOf(response);
    const s = body?.data || body?.summary || body || {};
    return {
      total_revenue: Number(s.total_revenue ?? s.revenue ?? 0),
      sale_count: Number(s.sale_count ?? s.count ?? 0),
    };
  },

  create: async (input: CreateSaleInput): Promise<Sale> => {
    const response = await api('/api/v1/sales', { method: 'POST', body: input });
    return extractEntity<Sale>(bodyOf(response)) || (bodyOf(response) as Sale);
  },

  getReceipt: async (id: number | string): Promise<any> => {
    const response = await api(`/api/v1/sales/${id}/receipt`);
    return bodyOf(response);
  },

  cancel: async (id: number | string): Promise<any> => {
    const response = await api(`/api/v1/sales/${id}/cancel`, { method: 'POST' });
    return bodyOf(response);
  },

  getDailyList: async (): Promise<Sale[]> => {
    const response = await api('/api/v1/sales/daily-list');
    return extractList<Sale>(bodyOf(response));
  },
};