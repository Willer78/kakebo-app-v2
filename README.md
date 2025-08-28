# Kakebo App v3.3
- Inserimento movimenti con tipo (spesa/entrata/mutuo), macro, sotto-categoria, nota
- **Fix Mutuo**: per il tipo Mutuo macro e sotto-categoria sono disabilitati e non richiesti (in tabella: macro="Mutuo", categoria="—")
- Lista movimenti (elimina riga)
- **Riepilogo mensile** per macro + saldo (mutuo separato nelle spese mensili)
- **Riepilogo settimanale "contabile"** (lun–dom) con regola: se il mese finisce gio–dom la settimana resta al mese; se finisce lun–mer, slitta al mese successivo. Il mutuo è escluso dai totali settimanali.
- **Nuovo: Riepilogo trimestrale** (Q1..Q4) con Entrate, Spese (incl. mutuo), Mutuo (separato), Saldo
- Salvataggio su localStorage

## Deploy su Vercel
Framework preset: Other  
Build Command: (vuoto)  
Output Directory: .
