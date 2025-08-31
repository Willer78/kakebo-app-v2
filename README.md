# Kakebo App v3.8 — Login + Sync (base)
Questa versione aggiunge **login via magic link** e **sync cloud** (Supabase). Offline locale sempre disponibile.

## Cosa contiene lo ZIP
- `index.html`, `style.css`, `script.js` (frontend)
- `supabase_schema.sql` (schema DB, RLS, policy)
- `README_3.8_SETUP.md` (guida passo-passo)

## Requisiti
- Account **Supabase** (free)
- URL del progetto e **anon key**

## Note privacy
- I dati sono isolati per utente tramite **Row Level Security (RLS)**.
- Tutto il traffico è su **HTTPS**.
- Questa è la versione **minima** (Step A). La cifratura end‑to‑end (client‑side) può essere aggiunta come Step B.

Build: 2025-08-31_091842
