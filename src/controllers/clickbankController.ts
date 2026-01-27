import { Request, Response } from 'express';
import { ClickBankService } from '../services/clickbankService';

// Inizializza il servizio con le credenziali da variabili d'ambiente
const getClickBankService = (): ClickBankService | null => {
  const apiKey = process.env.CLICKBANK_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new ClickBankService({
    apiKey,
    ...(process.env.CLICKBANK_API_SECRET && { apiSecret: process.env.CLICKBANK_API_SECRET }),
  });
};

export const clickbankController = {
  /**
   * Testa la connessione all'API ClickBank
   */
  async testConnection(req: Request, res: Response) {
    try {
      const service = getClickBankService();
      if (!service) {
        return res.status(400).json({
          error: 'ClickBank API key non configurata',
          message: 'Aggiungi CLICKBANK_API_KEY nelle variabili d\'ambiente',
        });
      }

      const result = await service.testConnection();
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error: any) {
      console.error('ClickBank test error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Errore durante il test ClickBank',
      });
    }
  },

  /**
   * Testa tutti gli endpoint disponibili
   */
  async testEndpoints(req: Request, res: Response) {
    try {
      const service = getClickBankService();
      if (!service) {
        return res.status(400).json({
          error: 'ClickBank API key non configurata',
        });
      }

      const results = await service.testEndpoints();
      res.json({
        success: true,
        endpoints: results,
        note: 'Verifica quali endpoint sono disponibili per la tua API key',
      });
    } catch (error: any) {
      console.error('ClickBank endpoints test error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Errore durante il test degli endpoint',
      });
    }
  },

  /**
   * Cerca prodotti nel Marketplace ClickBank
   */
  async searchMarketplaceProducts(req: Request, res: Response) {
    try {
      const service = getClickBankService();
      if (!service) {
        return res.status(400).json({
          error: 'ClickBank API key non configurata',
        });
      }

      const { keyword, page, limit } = req.query;
      const filters: { keyword?: string; page?: number; limit?: number } = {};
      if (typeof keyword === 'string' && keyword.trim()) {
        filters.keyword = keyword.trim();
      }
      if (typeof page === 'string' && page.trim()) {
        const parsedPage = parseInt(page, 10);
        if (!Number.isNaN(parsedPage)) {
          filters.page = parsedPage;
        }
      }
      if (typeof limit === 'string' && limit.trim()) {
        const parsedLimit = parseInt(limit, 10);
        if (!Number.isNaN(parsedLimit)) {
          filters.limit = parsedLimit;
        }
      }

      const results = await service.searchMarketplaceProducts(filters);

      res.json({
        success: true,
        results,
      });
    } catch (error: any) {
      console.error('ClickBank marketplace search error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Errore durante la ricerca Marketplace',
      });
    }
  },

  /**
   * Ottiene ordini ClickBank
   */
  async getOrders(req: Request, res: Response) {
    try {
      const service = getClickBankService();
      if (!service) {
        return res.status(400).json({
          error: 'ClickBank API key non configurata',
        });
      }

      const { startDate, endDate, status, limit } = req.query;
      
      const filters: {
        startDate?: string;
        endDate?: string;
        status?: string;
        limit?: number;
      } = {};
      
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;
      if (status) filters.status = status as string;
      if (limit) filters.limit = parseInt(limit as string);
      
      const orders = await service.getOrders(filters);

      res.json({
        success: true,
        count: orders.length,
        orders,
      });
    } catch (error: any) {
      console.error('ClickBank getOrders error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Errore nel recupero ordini',
      });
    }
  },

  /**
   * Ottiene statistiche ClickBank
   */
  async getStats(req: Request, res: Response) {
    try {
      const service = getClickBankService();
      if (!service) {
        return res.status(400).json({
          error: 'ClickBank API key non configurata',
        });
      }

      const { startDate, endDate } = req.query;
      
      const stats = await service.getStats({
        startDate: startDate as string,
        endDate: endDate as string,
      });

      res.json({
        success: true,
        stats,
      });
    } catch (error: any) {
      console.error('ClickBank getStats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Errore nel recupero statistiche',
      });
    }
  },
};

