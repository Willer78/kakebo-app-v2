# Kakebo App v3.6 (mista)
Novità:
- **Tema chiaro/scuro** con switch in header (salvato in localStorage)
- **Esportazione CSV** per mensile, settimanale, trimestrale, annuale
- **Dashboard** con grafico a barre delle spese per macro nel mese selezionato (Chart.js)
- Confermati: PDF export (html2pdf), riepiloghi settimanale/trimestrale/annuale e fix Mutuo

## Deploy su Vercel
Framework preset: Other  
Build Command: (vuoto)  
Output Directory: .

## Note
- I CSV usano `;` come separatore (compatibile con Excel italiano).
- Il grafico usa Chart.js via CDN; se non appare, fai hard refresh (Ctrl/Cmd+Shift+R).
