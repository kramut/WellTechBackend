# ClickBank API Setup

## Configurazione

Aggiungi le seguenti variabili d'ambiente al tuo file `.env`:

```bash
# ClickBank API Credentials
CLICKBANK_API_KEY=API-NI7DS1RRE1AD61T1GGAYUKZ3AL81C1AV60CG
CLICKBANK_API_SECRET=
```

## Endpoint Disponibili

### 1. Test Connessione
```bash
GET /api/workflows/clickbank/test
```

Testa la connessione all'API ClickBank e verifica che le credenziali siano valide.

**Risposta di successo:**
```json
{
  "success": true,
  "message": "Connessione ClickBank API riuscita",
  "data": {
    "status": 200,
    "hasOrders": true,
    "orderCount": 5
  }
}
```

### 2. Test Endpoint Disponibili
```bash
GET /api/workflows/clickbank/endpoints
```

Testa tutti gli endpoint disponibili per vedere quali sono accessibili con la tua API key.

**Risposta:**
```json
{
  "success": true,
  "endpoints": {
    "Orders": { "success": true, "status": 200 },
    "Stats": { "success": true, "status": 200 },
    "Account": { "success": false, "status": 404 },
    "Products": { "success": false, "status": 404 }
  }
}
```

### 3. Ottieni Ordini
```bash
GET /api/workflows/clickbank/orders?startDate=2024-12-01&limit=10
```

**Query Parameters:**
- `startDate` (opzionale): Data inizio (formato: YYYY-MM-DD)
- `endDate` (opzionale): Data fine
- `status` (opzionale): Stato ordine
- `limit` (opzionale): Numero massimo di risultati

### 4. Ottieni Statistiche
```bash
GET /api/workflows/clickbank/stats?startDate=2024-12-01
```

**Query Parameters:**
- `startDate` (opzionale): Data inizio
- `endDate` (opzionale): Data fine

## Test Locale

1. Aggiungi le variabili d'ambiente al file `.env`
2. Avvia il server:
   ```bash
   npm run dev
   ```
3. Testa la connessione:
   ```bash
   curl http://localhost:5000/api/workflows/clickbank/test
   ```

## Test su Railway

1. Aggiungi le variabili d'ambiente su Railway:
   - Vai su Railway Dashboard → tuo progetto → servizio API
   - Vai su "Variables"
   - Aggiungi `CLICKBANK_API_KEY` con il valore: `API-NI7DS1RRE1AD61T1GGAYUKZ3AL81C1AV60CG`

2. Testa l'endpoint:
   ```bash
   curl https://welltechbackend-production.up.railway.app/api/workflows/clickbank/test
   ```

## Note Importanti

1. **Endpoint Disponibili**: ClickBank API 1.3 ha principalmente endpoint per ordini e statistiche. Potrebbe non avere un endpoint diretto per la ricerca prodotti nel marketplace.

2. **Ricerca Prodotti**: Se l'API non supporta la ricerca prodotti direttamente, potrebbe essere necessario:
   - Usare scraping del marketplace pubblico ClickBank
   - Usare dati da ordini esistenti per identificare prodotti popolari
   - Integrare con il marketplace pubblico

3. **Rate Limiting**: Rispetta i limiti di richiesta dell'API ClickBank.

4. **Sicurezza**: Non committare mai le credenziali API nel repository. Usa sempre variabili d'ambiente.

## Prossimi Passi

1. ✅ Testa la connessione
2. ✅ Verifica endpoint disponibili
3. ⏳ Implementa ricerca prodotti (se disponibile via API o scraping)
4. ⏳ Integra nel workflow n8n per ricerca automatica prodotti

