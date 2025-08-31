# Kakebo App v3.8.1 — Login + Sync base (offline‑first)
Questa build:
- carica **Supabase prima** di `script.js` (fix login che non si apriva);
- funziona **anche senza Supabase** (modalità locale completa);
- include tutte le funzioni: backup/import, PDF/CSV, riepiloghi mensile/settimanale/trimestrale/annuale, dashboard.

## Setup rapido
1) Carica su GitHub questi 4 file (`index.html`, `style.css`, `script.js`, `README.md`) e fai **Redeploy** su Vercel.
2) (Opzionale) Configura Supabase e imposta in `script.js`:
   ```js
   const SUPABASE_URL = "https://TUO-PROGETTO.supabase.co";
   const SUPABASE_ANON_KEY = "LA-TUA-ANON-KEY";
   ```
3) **Senza Supabase** l'app funziona in locale; il Login apre il modale ma la sincronizzazione resta disattivata.

Build: 2025-08-31_101218
