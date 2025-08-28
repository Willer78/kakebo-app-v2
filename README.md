# Kakebo App v3.5
- Inserimento movimenti (spesa/entrata/mutuo) con **Mutuo** che disabilita macro/sotto-categoria
- Riepiloghi: **mensile**, **settimanale contabile**, **trimestrale**, **annuale (montante)**
- **Novità**: pulsanti **Esporta PDF** per tutte le sezioni (usa `html2pdf.js`, client-side)
- Salvataggio su localStorage

## Deploy su Vercel
Framework preset: Other  
Build Command: (vuoto)  
Output Directory: .

## Note PDF
- I PDF vengono generati sul browser e scaricati localmente.
- Per risultati migliori, usa hard refresh dopo il deploy per caricare la libreria html2pdf.
