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
    apiSecret: process.env.CLICKBANK_API_SECRET,
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
      
      const orders = await service.getOrders({
        startDate: startDate as string,
        endDate: endDate as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });

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

