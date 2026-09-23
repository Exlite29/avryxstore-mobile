import { api, bodyOf } from '../api';

export interface DateRange {
  from?: string;
  to?: string;
  period?: string;
}

export interface TopProduct {
  product_id?: number;
  name?: string;
  product_name?: string;
  quantity?: number;
  total_sold?: number;
  revenue?: number;
  total_revenue?: number;
}

export interface DailySalesReport {
  date?: string;
  summary?: {
    transactionCount?: number;
    totalSales?: number;
    totalDiscount?: number;
    avgTransaction?: number;
    highestTransaction?: number;
    lowestTransaction?: number;
  };
  hourlyBreakdown?: Array<Record<string, unknown>>;
}

export const reportService = {
  getSalesReport: async (range: DateRange = {}) => {
    const response = await api('/api/v1/reports/sales', { params: buildParams(range) });
    return bodyOf(response);
  },

  getTopProducts: async (range: DateRange = {}): Promise<TopProduct[]> => {
    const response = await api('/api/v1/reports/sales/top-products', { params: buildParams(range) });
    const body = bodyOf(response);
    return (body?.data || body?.topProducts || body?.top_products || (Array.isArray(body) ? body : [])) as TopProduct[];
  },

  getDaily: async (range: DateRange = {}): Promise<DailySalesReport> => {
    const response = await api('/api/v1/reports/sales/daily', { params: buildParams(range) });
    const body = bodyOf(response);
    const data = body?.data && typeof body?.data === 'object' ? body.data : {};
    return data as DailySalesReport;
  },

  getCashflow: async (range: DateRange = {}) => {
    const response = await api('/api/v1/reports/sales/cashflow', { params: buildParams(range) });
    return bodyOf(response);
  },

  getInventory: async () => {
    const response = await api('/api/v1/reports/inventory');
    return bodyOf(response);
  },

  getInventoryValuation: async (): Promise<number> => {
    const response = await api('/api/v1/reports/inventory/valuation');
    const body = bodyOf(response);
    const v = body?.data || body || {};
    return Number(v.totalValue ?? v.value ?? v.total_value ?? v.valuation ?? 0);
  },
};

function buildParams(range: DateRange): Record<string, string> {
  const params: Record<string, string> = {};
  if (range.from) params.from = range.from;
  if (range.to) params.to = range.to;
  if (range.period) params.period = range.period;
  return params;
}