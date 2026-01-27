/**
 * ClickBank Service
 * Wrapper per l'API ClickBank
 */

import axios, { AxiosInstance } from 'axios';

export interface ClickBankConfig {
  apiKey: string;
  apiSecret?: string;
}

export class ClickBankService {
  private client: AxiosInstance;
  private config: ClickBankConfig;

  constructor(config: ClickBankConfig) {
    this.config = config;
    const authHeader = this.config.apiSecret
      ? `Basic ${Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString('base64')}`
      : this.config.apiKey;

    this.client = axios.create({
      baseURL: 'https://api.clickbank.com',
      headers: {
        'Authorization': authHeader,
        'X-API-Key': this.config.apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Testa la connessione all'API ClickBank
   */
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Prova endpoint marketplace (compatibile anche senza API secret)
      const response = await this.searchMarketplaceProducts({
        keyword: 'health',
        page: 1,
        limit: 1,
      });

      return {
        success: true,
        message: 'Connessione ClickBank Marketplace API riuscita',
        data: {
          status: response?.status ?? 200,
          endpoint: response?.endpoint,
          resultCount: Array.isArray(response?.data) ? response.data.length : response?.data?.results?.length || 0,
        },
      };
    } catch (error: any) {
      if (error.response) {
        return {
          success: false,
          message: `Errore API ClickBank: ${error.response.status} ${error.response.statusText}`,
          data: {
            status: error.response.status,
            error: error.response.data,
          },
        };
      }
      return {
        success: false,
        message: `Errore connessione: ${error.message}`,
      };
    }
  }

  /**
   * Ottiene ordini ClickBank
   */
  async getOrders(filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    limit?: number;
  }): Promise<any[]> {
    try {
      const response = await this.client.get('/rest/1.3/orders2', {
        params: filters,
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error('ClickBank getOrders error:', error.response?.data || error.message);
      throw new Error(`Failed to get orders: ${error.message}`);
    }
  }

  /**
   * Ottiene statistiche ClickBank
   */
  async getStats(filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    try {
      const response = await this.client.get('/rest/1.3/stats', {
        params: filters,
      });
      return response.data;
    } catch (error: any) {
      console.error('ClickBank getStats error:', error.response?.data || error.message);
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }

  /**
   * Testa vari endpoint per vedere cosa è disponibile
   */
  async testEndpoints(): Promise<Record<string, { success: boolean; status?: number; error?: string }>> {
    const results: Record<string, { success: boolean; status?: number; error?: string }> = {};

    const endpoints = [
      { path: '/rest/1.3/orders2', name: 'Orders' },
      { path: '/rest/1.3/stats', name: 'Stats' },
      { path: '/rest/1.3/account', name: 'Account' },
      { path: '/rest/1.3/transactions', name: 'Transactions' },
      { path: '/rest/1.3/products', name: 'Products' },
      { path: '/rest/1.3/marketplace/products', name: 'Marketplace Products' },
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.client.get(endpoint.path);
        results[endpoint.name] = {
          success: true,
          status: response.status,
        };
      } catch (error: any) {
        results[endpoint.name] = {
          success: false,
          status: error.response?.status,
          error: error.response?.statusText || error.message,
        };
      }
    }

    return results;
  }

  /**
   * Cerca prodotti nel Marketplace ClickBank
   */
  async searchMarketplaceProducts(filters?: {
    keyword?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const params = {
        keyword: filters?.keyword || 'health',
        page: filters?.page ?? 1,
        limit: filters?.limit ?? 10,
      };

      const candidateEndpoints = [
        '/rest/1.3/marketplace/products',
        '/rest/1.3/marketplace/search',
        '/rest/1.3/products',
        '/rest/1.3/marketplace/products/list',
      ];

      const errors: Array<{ endpoint: string; status?: number; error?: string }> = [];

      for (const endpoint of candidateEndpoints) {
        try {
          const response = await this.client.get(endpoint, { params });
          return {
            endpoint,
            status: response.status,
            data: response.data,
          };
        } catch (error: any) {
          errors.push({
            endpoint,
            status: error.response?.status,
            error: error.response?.statusText || error.message,
          });
        }
      }

      throw new Error(`No marketplace endpoint available. Tried: ${errors.map((e) => `${e.endpoint} (${e.status})`).join(', ')}`);
    } catch (error: any) {
      console.error('ClickBank marketplace search error:', error.response?.data || error.message);
      throw new Error(`Failed to search marketplace: ${error.message}`);
    }
  }
}

