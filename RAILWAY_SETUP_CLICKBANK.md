# 🚀 Setup ClickBank su Railway - Guida Passo-Passo

## 📋 Preparazione

Prima di iniziare, assicurati di avere:
- ✅ Account Railway attivo
- ✅ Progetto Railway già creato per `welltech-api`
- ✅ API Key ClickBank: `API-NI7DS1RRE1AD61T1GGAYUKZ3AL81C1AV60CG`

---

## 🎯 Metodo 1: Via Dashboard Railway (Raccomandato)

### Passo 1: Accedi a Railway
1. Vai su [railway.app](https://railway.app)
2. Fai login con il tuo account
3. Seleziona il progetto **welltech-api** (o creane uno nuovo se non esiste)

### Passo 2: Apri il Servizio API
1. Nel dashboard del progetto, vedrai i servizi (es. "welltech-api", database PostgreSQL, ecc.)
2. **Clicca sul servizio "welltech-api"** (quello che contiene il backend)

### Passo 3: Vai alle Variabili d'Ambiente
1. Nel menu laterale del servizio, clicca su **"Variables"** (o "Variabili")
2. Vedrai una lista di variabili d'ambiente esistenti (es. `DATABASE_URL`, `PORT`, `NODE_ENV`)

### Passo 4: Aggiungi la Variabile ClickBank
1. Clicca sul pulsante **"+ New Variable"** (o "+ Nuova Variabile")
2. Compila i campi:
   - **Nome variabile**: `CLICKBANK_API_KEY`
   - **Valore**: `API-NI7DS1RRE1AD61T1GGAYUKZ3AL81C1AV60CG`
3. Clicca su **"Add"** (o "Aggiungi")

### Passo 5: Verifica e Deploy
1. Verifica che la variabile sia stata aggiunta nella lista
2. Railway **deployerà automaticamente** il servizio con la nuova variabile
3. Attendi che il deploy sia completato (vedrai "Deploy successful" o simile)

### Passo 6: Testa l'Endpoint
Una volta completato il deploy, testa l'endpoint:

```bash
curl https://welltechbackend-production.up.railway.app/api/workflows/clickbank/test
```

Oppure apri nel browser:
```
https://welltechbackend-production.up.railway.app/api/workflows/clickbank/test
```

**Risposta attesa:**
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

---

## 🎯 Metodo 2: Via Railway CLI (Alternativo)

Se preferisci usare la CLI:

### Passo 1: Installa Railway CLI
```bash
npm i -g @railway/cli
```

### Passo 2: Login
```bash
railway login
```

### Passo 3: Connetti al Progetto
```bash
cd welltech-api
railway link
# Seleziona il progetto welltech-api
```

### Passo 4: Aggiungi Variabile
```bash
railway variables set CLICKBANK_API_KEY=API-NI7DS1RRE1AD61T1GGAYUKZ3AL81C1AV60CG
```

### Passo 5: Deploy
```bash
railway up
```

---

## 🔍 Verifica Setup

### Test 1: Connessione API
```bash
curl https://welltechbackend-production.up.railway.app/api/workflows/clickbank/test
```

### Test 2: Endpoint Disponibili
```bash
curl https://welltechbackend-production.up.railway.app/api/workflows/clickbank/endpoints
```

### Test 3: Ordini (se disponibili)
```bash
curl "https://welltechbackend-production.up.railway.app/api/workflows/clickbank/orders?startDate=2024-12-01&limit=5"
```

---

## 🐛 Troubleshooting

### Errore: "ClickBank API key non configurata"
**Causa**: La variabile d'ambiente non è stata aggiunta o il deploy non è stato completato.

**Soluzione**:
1. Verifica che la variabile `CLICKBANK_API_KEY` sia presente in Railway
2. Assicurati che il deploy sia completato
3. Riavvia il servizio se necessario

### Errore: "401 Unauthorized" o "403 Forbidden"
**Causa**: L'API key potrebbe non essere valida o non avere i permessi necessari.

**Soluzione**:
1. Verifica che l'API key sia corretta
2. Controlla che l'API key non sia scaduta
3. Verifica i permessi dell'API key su ClickBank

### Errore: "Connection timeout"
**Causa**: Problemi di rete o API ClickBank non raggiungibile.

**Soluzione**:
1. Verifica che l'API ClickBank sia online
2. Controlla i log di Railway per dettagli
3. Riprova dopo qualche minuto

---

## 📊 Monitoraggio

### Visualizza Log
1. Vai su Railway Dashboard → Servizio API → **"Deployments"**
2. Clicca sull'ultimo deploy
3. Vai su **"Logs"** per vedere i log in tempo reale

### Verifica Variabili
1. Railway Dashboard → Servizio API → **"Variables"**
2. Verifica che `CLICKBANK_API_KEY` sia presente e corretta

---

## ✅ Checklist Finale

- [ ] Variabile `CLICKBANK_API_KEY` aggiunta su Railway
- [ ] Deploy completato con successo
- [ ] Test endpoint `/api/workflows/clickbank/test` funzionante
- [ ] Verificati endpoint disponibili con `/api/workflows/clickbank/endpoints`
- [ ] Log Railway non mostrano errori

---

## 🎉 Completato!

Una volta completato il setup, potrai:
- ✅ Testare la connessione ClickBank
- ✅ Recuperare ordini e statistiche
- ✅ Integrare nel workflow n8n per ricerca automatica prodotti

---

## 📞 Supporto

Se hai problemi:
1. Controlla i log su Railway
2. Verifica la documentazione in `CLICKBANK_SETUP.md`
3. Testa l'endpoint `/api/workflows/clickbank/endpoints` per vedere cosa è disponibile

