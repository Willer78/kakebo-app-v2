# Guida setup v3.8 — Supabase (Login + Sync)

## 1) Crea progetto
- Vai su supabase.com → New Project
- Copia **Project URL** e **anon public key**

## 2) Esegui lo schema
- Apri SQL Editor → incolla `supabase_schema.sql` → Run
  - Crea tabella `movements`
  - Abilita RLS e policy per utente

## 3) Configura Authentication
- Authentication → Providers → Email
  - Abilita **Email OTP (Magic Link)**
  - (Opzionale) disabilita signup con password
- Authentication → URL
  - **Site URL**: l’URL della tua app su Vercel
  - **Redirect URLs**: aggiungi lo stesso URL

## 4) Imposta le chiavi nel frontend
- In `script.js` cambia:
  ```js
  const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
  const SUPABASE_ANON_KEY = "YOUR-ANON-KEY";
  ```

## 5) Deploy
- GitHub → carica i file v3.8
- Vercel → Redeploy (Output = .)

## 6) Test rapido
1) Apri l’app → clic su **Login** → inserisci mail → apri il magic link
2) Aggiungi un paio di movimenti → clic **↻ Sincronizza ora**
3) Apri su un **secondo device** (o altro browser), fai login con la stessa mail → **↻ Sincronizza ora** → dovresti vedere i movimenti
4) Elimina un movimento su un device → **↻ Sincronizza ora** su entrambi → deve sparire su entrambi

### Domande frequenti
- **Serve essere loggati per usare l’app?** No: funziona anche offline/locale.
- **I miei dati sono privati?** Sì: grazie a RLS ogni utente vede solo i propri dati.
- **Cosa succede se sono offline?** Lavori su `localStorage`; al login o alla pressione del bottone **↻** facciamo sync bidirezionale.
