export interface User {
  id: number | string;
  name?: string;
  email?: string;
  role?: string;
  username?: string;
  [key: string]: unknown;
}

export interface Product {
  id: number;
  name: string;
  barcode?: string;
  category?: string;
  unit_price?: number | string;
  price?: number | string;
  stock_quantity?: number | string;
  stock?: number | string;
  total_inventory_qty?: number | string;
  low_stock_threshold?: number | string;
  min_stock_level?: number | string;
  unit?: string;
  description?: string;
  image_url?: string;
  [key: string]: unknown;
}

export interface InventoryItem {
  id?: number | string;
  product_id?: number | string;
  product_name?: string;
  category?: string;
  total_inventory_qty?: number | string;
  stock_quantity?: number | string;
  stock?: number | string;
  low_stock_threshold?: number | string;
  min_stock_level?: number | string;
  location?: string;
  [key: string]: unknown;
}

export interface SaleItem {
  product_id?: number | string;
  product_name?: string;
  name?: string;
  barcode?: string;
  quantity?: number;
  unit_price?: number;
  subtotal?: number;
}

export interface Sale {
  id: number | string;
  created_at?: string;
  transaction_code?: string;
  reference?: string;
  total_amount?: number;
  total?: number | string;
  amount_paid?: number | string;
  change?: number | string;
  payment_method?: string;
  status?: string;
  items?: SaleItem[];
  [key: string]: unknown;
}

export interface PaginationMeta {
  total?: number;
  totalCount?: number;
  total_count?: number;
  totalPages?: number;
  total_pages?: number;
  page?: number;
  limit?: number;
}

export interface ProductListResult {
  items: Product[];
  pagination: PaginationMeta;
}

/** Robustly extract a list array from a response body of unknown shape. */
export function extractList<T>(body: any, key?: string): T[] {
  if (Array.isArray(body)) return body as T[];
  if (!body || typeof body !== 'object') return [];
  if (Array.isArray(body.data)) return body.data as T[];
  if (key && Array.isArray(body[key])) return body[key] as T[];
  const candidates = ['items', 'products', 'sales', 'inventory', 'movements', 'reports', 'result', 'results'];
  for (const c of candidates) {
    if (Array.isArray(body[c])) return body[c] as T[];
  }
  return [];
}

/** Robustly extract a single entity from a response body. */
export function extractEntity<T>(body: any, key?: string): T | null {
  if (!body || typeof body !== 'object') return null;
  if (key && body[key]) return body[key] as T;
  if (body.data && typeof body.data === 'object') return body.data as T;
  if (body.product) return body.product as T;
  if (body.sale) return body.sale as T;
  return body as T;
}

export function extractPagination(body: any): PaginationMeta {
  const p = body?.pagination || body?.meta || {};
  return {
    total: p.total ?? p.totalCount ?? p.total_count,
    totalPages: p.totalPages ?? p.total_pages ?? p.total_pages ?? 1,
    page: p.page ?? 1,
    limit: p.limit,
  };
}

export function money(value: unknown): number {
  return Number(value ?? 0) || 0;
}

export function qty(value: unknown): number {
  return Number(value ?? 0) || 0;
}