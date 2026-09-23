import { api, bodyOf } from '../api';
import { extractEntity, extractList, extractPagination, Product, ProductListResult } from '../types';

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export const productService = {
  getAll: async (params: ProductQuery = {}): Promise<ProductListResult> => {
    const query: Record<string, string | number> = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') query[k] = v;
    });
    const qs = new URLSearchParams(String(query as Record<string, string>)).toString();
    const endpoint = `/api/v1/products${qs ? `?${qs}` : ''}`;
    const response = await api(endpoint);
    const body = bodyOf(response);
    return {
      items: extractList<Product>(body),
      pagination: extractPagination(body),
    };
  },

  getById: async (id: number | string): Promise<Product> => {
    const response = await api(`/api/v1/products/${id}`);
    const product = extractEntity<Product>(bodyOf(response));
    if (!product) throw new Error('Product not found');
    return product;
  },

  getByBarcode: async (barcode: string): Promise<Product | null> => {
    try {
      const response = await api(`/api/v1/products/barcode/${encodeURIComponent(barcode)}`);
      return extractEntity<Product>(bodyOf(response));
    } catch (error: any) {
      if (error?.statusCode === 404) return null;
      throw error;
    }
  },

  getCategories: async (): Promise<string[]> => {
    const response = await api('/api/v1/products/categories');
    const body = bodyOf(response);
    return extractList<string>(body, 'categories');
  },

  getLowStock: async (): Promise<Product[]> => {
    const response = await api('/api/v1/products/low-stock');
    return extractList<Product>(bodyOf(response));
  },

  create: async (product: Partial<Product>): Promise<Product> => {
    const response = await api('/api/v1/products', { method: 'POST', body: product });
    return extractEntity<Product>(bodyOf(response)) || (bodyOf(response) as Product);
  },

  update: async (id: number | string, product: Partial<Product>): Promise<Product> => {
    const response = await api(`/api/v1/products/${id}`, { method: 'PUT', body: product });
    return extractEntity<Product>(bodyOf(response)) || (bodyOf(response) as Product);
  },

  delete: async (id: number | string): Promise<void> => {
    await api(`/api/v1/products/${id}`, { method: 'DELETE' });
  },

  updateStock: async (id: number | string, data: { quantity: number }): Promise<any> => {
    const response = await api(`/api/v1/products/${id}/stock`, { method: 'PATCH', body: data });
    return bodyOf(response);
  },
};