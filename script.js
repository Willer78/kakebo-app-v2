function aggiungiSpesa() {
  const output = document.getElementById("output");
  const voce = prompt("Inserisci descrizione spesa:");
  const importo = prompt("Inserisci importo spesa in euro:");
  if (voce && importo) {
    const p = document.createElement("p");
    p.textContent = voce + " - €" + importo;
    output.appendChild(p);
  }
}
