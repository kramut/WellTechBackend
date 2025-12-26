# ⚡ Setup ClickBank su Railway - Quick Guide

## 🎯 In 5 Minuti

### Step 1: Vai su Railway
👉 [railway.app](https://railway.app) → Login → Seleziona progetto **welltech-api**

### Step 2: Apri il Servizio
👉 Clicca sul servizio **"welltech-api"** (quello con il backend)

### Step 3: Variabili d'Ambiente
👉 Menu laterale → **"Variables"** → **"+ New Variable"**

### Step 4: Aggiungi ClickBank Key
```
Nome:  CLICKBANK_API_KEY
Valore: API-NI7DS1RRE1AD61T1GGAYUKZ3AL81C1AV60CG
```
👉 Clicca **"Add"**

### Step 5: Attendi Deploy
👉 Railway deployerà automaticamente (1-2 minuti)

### Step 6: Testa
```bash
curl https://welltechbackend-production.up.railway.app/api/workflows/clickbank/test
```

## ✅ Fatto!

Se vedi `{"success": true, ...}` → Tutto OK! 🎉

---

## 📸 Screenshot Guide

### Dove Trovare "Variables"
1. Dashboard Railway → Progetto → Servizio API
2. Menu laterale sinistro → **"Variables"** (icona chiave 🔑)

### Come Aggiungere Variabile
1. Clicca **"+ New Variable"** (in alto a destra)
2. Inserisci:
   - **Key**: `CLICKBANK_API_KEY`
   - **Value**: `API-NI7DS1RRE1AD61T1GGAYUKZ3AL81C1AV60CG`
3. Clicca **"Add"**

### Verifica Deploy
1. Vai su **"Deployments"** nel menu laterale
2. Vedi l'ultimo deploy → dovrebbe dire "Deploy successful" ✅

---

## 🐛 Problemi?

**"ClickBank API key non configurata"**
→ Verifica che la variabile sia stata aggiunta e il deploy completato

**"401 Unauthorized"**
→ Verifica che l'API key sia corretta (copia-incolla esatto)

**Deploy non parte**
→ Controlla i log in "Deployments" → "Logs"

---

## 📞 Endpoint Disponibili

Dopo il setup, puoi usare:

- `GET /api/workflows/clickbank/test` - Test connessione
- `GET /api/workflows/clickbank/endpoints` - Lista endpoint disponibili
- `GET /api/workflows/clickbank/orders` - Ordini ClickBank
- `GET /api/workflows/clickbank/stats` - Statistiche

---

**Tempo totale: ~5 minuti** ⏱️

