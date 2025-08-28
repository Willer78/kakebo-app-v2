// === Categorie definite ===
const CATEGORIE = {
  Sopravvivenza: [
    "Alimentazione","Farmacia","Cane","Telefono fisso","Acqua","Gas",
    "Elettricità","Auto","Moto"
  ],
  Optional: [
    "Ristorante","Spese di casa","Cosmesi/ capelli","Shopping","Sport","Cellulare"
  ],
  Cultura: [
    "Libri","Musica","Scuola Eva","Scuola Elena"
  ],
  Extra: [
    "Viaggi","Regali","Spese casa grandi"
  ],
  Entrate: [
    "Stipendio","Assegni familiari","Fotovoltaico","Altre entrate"
  ]
};

// === Helper ===
const $ = (sel) => document.querySelector(sel);
const fmtMoney = (n) => `€ ${n.toFixed(2)}`;

// === Storage ===
const KEY = "kakebo_movimenti_v1";
let MOVIMENTI = [];
try { MOVIMENTI = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { MOVIMENTI = []; }
const salva = () => localStorage.setItem(KEY, JSON.stringify(MOVIMENTI));

// === Date utils ===
const pad = (n) => String(n).padStart(2,"0");
const todayStr = () => {
  const d = new Date(); 
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
};

// === Date helpers (settimanale/trimestri/annuale) ===
const parseDate = (s) => { const [Y,M,D] = s.split("-").map(Number); return new Date(Y, M-1, D); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const startOfMondayWeek = (d) => { const day = d.getDay(); const offset = (day === 0 ? -6 : 1 - day); return addDays(d, offset); };
const endOfSundayWeek = (d) => addDays(startOfMondayWeek(d), 6);
function contabileMonthBounds(year, month /*1-12*/){
  const first = new Date(year, month-1, 1);
  const last = new Date(year, month, 0);
  const prevLast = new Date(year, month-1, 0);
  const prevLastDow = prevLast.getDay();
  let start = (prevLastDow>=1 && prevLastDow<=3) ? startOfMondayWeek(prevLast) : startOfMondayWeek(first);
  const lastDow = last.getDay();
  let endSunday = (lastDow===4 || lastDow===5 || lastDow===6 || lastDow===0) ? endOfSundayWeek(last) : addDays(startOfMondayWeek(last), -1);
  const endExclusiveMonday = addDays(endSunday, 1);
  return { startMonday: start, endExclusiveMonday };
}
const quarterRange = (year, q) => { const startMonth=(q-1)*3; const start=new Date(year,startMonth,1); const end=new Date(year,startMonth+3,0); return {start,end}; };

// === UI: Tabs ===
const tabIns = document.getElementById("tab-inserimento");
const tabRiep = document.getElementById("tab-riepilogo");
const tabSett = document.getElementById("tab-riepilogo-sett");
const tabTri  = document.getElementById("tab-riepilogo-tri");
const tabAnn  = document.getElementById("tab-riepilogo-ann");

const secIns = document.getElementById("sezione-inserimento");
const secRiep = document.getElementById("sezione-riepilogo");
const secSett = document.getElementById("sezione-riepilogo-sett");
const secTri  = document.getElementById("sezione-riepilogo-tri");
const secAnn  = document.getElementById("sezione-riepilogo-ann");

function switchTab(which){
  [tabIns,tabRiep,tabSett,tabTri,tabAnn].forEach(t=>t.classList.remove("active"));
  [secIns,secRiep,secSett,secTri,secAnn].forEach(s=>s.classList.add("hidden"));
  if(which==="ins"){ tabIns.classList.add("active"); secIns.classList.remove("hidden"); }
  else if(which==="riep"){ tabRiep.classList.add("active"); secRiep.classList.remove("hidden"); aggiornaRiepilogo(); }
  else if(which==="sett"){ tabSett.classList.add("active"); secSett.classList.remove("hidden"); aggiornaRiepilogoSettimanale(); }
  else if(which==="tri"){ tabTri.classList.add("active"); secTri.classList.remove("hidden"); aggiornaRiepilogoTrimestri(); }
  else { tabAnn.classList.add("active"); secAnn.classList.remove("hidden"); aggiornaRiepilogoAnnuale(); }
}
tabIns.addEventListener("click", ()=>switchTab("ins"));
tabRiep.addEventListener("click", ()=>switchTab("riep"));
tabSett.addEventListener("click", ()=>switchTab("sett"));
tabTri .addEventListener("click", ()=>switchTab("tri"));
tabAnn .addEventListener("click", ()=>switchTab("ann"));

// === Form ===
const inputData = $("#data");
const inputImporto = $("#importo");
const selTipo = $("#tipo");
const selMacro = $("#macro");
const selCat = $("#categoria");
const inputNota = $("#nota");

inputData.value = todayStr();

// Popola macro e categorie in base al tipo (Mutuo disabilitato)
function refreshMacroETree(){
  const tipo = selTipo.value;
  selMacro.innerHTML = "";
  selCat.innerHTML = "";
  selMacro.disabled = false;
  selCat.disabled = false;

  if(tipo === "entrata"){
    const o = document.createElement("option");
    o.value = "Entrate"; o.textContent = "Entrate";
    selMacro.appendChild(o);
    refreshCategorie();
  } else if(tipo === "mutuo"){
    selMacro.disabled = true;
    selCat.disabled = true;
    const o1 = document.createElement("option"); o1.value = ""; o1.textContent = "— (non richiesto)"; selMacro.appendChild(o1);
    const o2 = document.createElement("option"); o2.value = ""; o2.textContent = "— (non richiesto)"; selCat.appendChild(o2);
  } else {
    ["Sopravvivenza","Optional","Cultura","Extra"].forEach(m=>{
      const o = document.createElement("option"); o.value = m; o.textContent = m; selMacro.appendChild(o);
    });
    refreshCategorie();
  }
}
function refreshCategorie(){
  selCat.innerHTML = "";
  const macro = selMacro.value;
  const voci = CATEGORIE[macro] || [];
  for(const v of voci){
    const o = document.createElement("option"); o.value = v; o.textContent = v; selCat.appendChild(o);
  }
}
selTipo.addEventListener("change", refreshMacroETree);
selMacro.addEventListener("change", refreshCategorie);
refreshMacroETree();

// Submit form
document.getElementById("form-movimento").addEventListener("submit", (e)=>{
  e.preventDefault();
  const data = inputData.value;
  const importo = parseFloat(inputImporto.value);
  const tipo = selTipo.value;

  let macro = "";
  let categoria = "";
  if (tipo === "entrata") {
    macro = "Entrate";
    categoria = selCat.value || "";
  } else if (tipo === "mutuo") {
    macro = "Mutuo"; categoria = "—";
  } else {
    macro = selMacro.value || "";
    categoria = selCat.value || "";
  }
  const nota = (inputNota.value || "").trim();

  if(!data || isNaN(importo)){ alert("Controlla data e importo."); return; }
  if(tipo==="entrata" && !categoria){ alert("Seleziona la voce di entrata."); return; }
  if(tipo==="spesa" && (!macro || !categoria)){ alert("Seleziona macro e sotto-categoria."); return; }

  const mov = { id: crypto.randomUUID(), data, importo, tipo, macro, categoria, nota };
  MOVIMENTI.unshift(mov);
  salva();
  renderTabella();
  inputData.value = todayStr();
  e.target.reset();
  refreshMacroETree();
  aggiornaRiepilogo();
  aggiornaRiepilogoSettimanale();
  aggiornaRiepilogoTrimestri();
  aggiornaRiepilogoAnnuale();
});

// Pulsanti extra
document.getElementById("pulisci").addEventListener("click", ()=>{
  document.getElementById("form-movimento").reset();
  inputData.value = todayStr();
  refreshMacroETree();
});
document.getElementById("cancella-tutto").addEventListener("click", ()=>{
  if(confirm("Sei sicuro di voler svuotare l'archivio locale? Questa azione è irreversibile.")){
    MOVIMENTI = [];
    salva();
    renderTabella();
    aggiornaRiepilogo();
    aggiornaRiepilogoSettimanale();
    aggiornaRiepilogoTrimestri();
    aggiornaRiepilogoAnnuale();
  }
});

// Tabella movimenti
function renderTabella(){
  const tbody = document.querySelector("#tabella-movimenti tbody");
  tbody.innerHTML = "";
  for(const m of MOVIMENTI){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.data}</td>
      <td>${m.tipo}</td>
      <td>${m.macro || ""}</td>
      <td>${m.categoria || ""}</td>
      <td>€ ${m.importo.toFixed(2)}</td>
      <td>${m.nota || ""}</td>
      <td><button class="del" data-id="${m.id}">Elimina</button></td>
    `;
    tbody.appendChild(tr);
  }
  tbody.querySelectorAll("button.del").forEach(btn=>{
    btn.addEventListener("click",(ev)=>{
      const id = ev.currentTarget.getAttribute("data-id");
      MOVIMENTI = MOVIMENTI.filter(x=>x.id!==id);
      salva();
      renderTabella();
      aggiornaRiepilogo();
      aggiornaRiepilogoSettimanale();
      aggiornaRiepilogoTrimestri();
      aggiornaRiepilogoAnnuale();
    });
  });
}
renderTabella();

// Riepilogo mensile
const inputMese = document.getElementById("mese-riepilogo");
(function setDefaultMonth(){ const d=new Date(); inputMese.value=`${d.getFullYear()}-${pad(d.getMonth()+1)}`; })();
function aggiornaRiepilogo(){
  if(!inputMese.value) return;
  const prefix = inputMese.value; // yyyy-mm
  const delmese = MOVIMENTI.filter(m => (m.data || "").startsWith(prefix));
  const totali = {}; let entrate = 0, spese = 0;
  for(const m of delmese){
    if(m.tipo === "entrata"){ entrate += m.importo; }
    else if(m.tipo === "mutuo"){ spese += m.importo; totali["Mutuo"] = (totali["Mutuo"] || 0) + m.importo; }
    else { spese += m.importo; const key = m.macro || "Altro"; totali[key] = (totali[key] || 0) + m.importo; }
  }
  const ul = document.getElementById("totali-macro"); ul.innerHTML = "";
  const order = ["Sopravvivenza","Optional","Cultura","Extra","Mutuo","Altro"]; let printed = false;
  for(const k of order){ if(totali[k] > 0){ const li = document.createElement("li"); li.textContent = `${k}: € ${totali[k].toFixed(2)}`; ul.appendChild(li); printed = true; } }
  if(!printed){ const li = document.createElement("li"); li.textContent = "Nessuna spesa registrata nel mese selezionato."; ul.appendChild(li); }
  const speseTot = Object.values(totali).reduce((a,b)=>a+b,0);
  const saldo = entrate - speseTot;
  document.getElementById("saldo-mese").textContent = `Entrate: € ${entrate.toFixed(2)} – Spese: € ${speseTot.toFixed(2)} → Saldo: € ${saldo.toFixed(2)}`;
}
inputMese.addEventListener("change", aggiornaRiepilogo);

// Riepilogo settimanale (contabile)
const inputMeseSett = document.getElementById("mese-riepilogo-sett");
(function setDefaultMonthSett(){ const d=new Date(); inputMeseSett.value=`${d.getFullYear()}-${pad(d.getMonth()+1)}`; })();
function formatRange(a,b){ const dd=(x)=>String(x).padStart(2,"0"); return `${dd(a.getDate())}/${dd(a.getMonth()+1)} – ${dd(b.getDate())}/${dd(b.getMonth()+1)}`; }
function aggiornaRiepilogoSettimanale(){
  if(!inputMeseSett.value) return;
  const [Y, M] = inputMeseSett.value.split("-").map(Number);
  const { startMonday, endExclusiveMonday } = contabileMonthBounds(Y, M);
  const tbody = document.querySelector("#tabella-riepilogo-sett tbody"); tbody.innerHTML = "";
  for(let cur = new Date(startMonday); cur < endExclusiveMonday; cur = addDays(cur, 7)){
    const weekStart = new Date(cur); const weekEnd = endOfSundayWeek(weekStart);
    let entrate = 0, speseSenzaMutuo = 0;
    for(const m of MOVIMENTI){
      if(!m.data) continue;
      const d = parseDate(m.data);
      if(d >= weekStart && d <= weekEnd){ if(m.tipo === "entrata") entrate += m.importo; else if(m.tipo === "spesa") speseSenzaMutuo += m.importo; }
    }
    const saldo = entrate - speseSenzaMutuo;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${formatRange(weekStart, weekEnd)}</td><td>${fmtMoney(entrate)}</td><td>${fmtMoney(speseSenzaMutuo)}</td><td>${fmtMoney(saldo)}</td>`;
    tbody.appendChild(tr);
  }
}
inputMeseSett.addEventListener("change", aggiornaRiepilogoSettimanale);

// Riepilogo trimestrale
const inputAnnoTri = document.getElementById("anno-tri");
(function setDefaultYearTri(){ const d = new Date(); inputAnnoTri.value = d.getFullYear(); })();
function aggiornaRiepilogoTrimestri(){
  const year = parseInt(inputAnnoTri.value, 10); if(isNaN(year)) return;
  const tbody = document.querySelector("#tabella-riepilogo-tri tbody"); tbody.innerHTML = "";
  for(let q=1; q<=4; q++){
    const {start, end} = quarterRange(year, q);
    let entrate = 0, spese = 0, mutuo = 0;
    for(const m of MOVIMENTI){
      if(!m.data) continue; const d = parseDate(m.data);
      if(d >= start && d <= end){ if(m.tipo === "entrata") entrate += m.importo; else if(m.tipo === "mutuo"){ spese += m.importo; mutuo += m.importo; } else spese += m.importo; }
    }
    const saldo = entrate - spese;
    const periodStr = `${String(start.getDate()).padStart(2,"0")}/${String(start.getMonth()+1).padStart(2,"0")}–${String(end.getDate()).padStart(2,"0")}/${String(end.getMonth()+1).padStart(2,"0")}`;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>Q${q}</td><td>${periodStr}</td><td>${fmtMoney(entrate)}</td><td>${fmtMoney(spese)}</td><td>${fmtMoney(mutuo)}</td><td>${fmtMoney(saldo)}</td>`;
    tbody.appendChild(tr);
  }
}
inputAnnoTri.addEventListener("change", aggiornaRiepilogoTrimestri);

// Riepilogo annuale
const inputAnnoAnn = document.getElementById("anno-ann");
(function setDefaultYearAnn(){ const d = new Date(); inputAnnoAnn.value = d.getFullYear(); })();
function monthLabel(i){ return ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"][i]; }
function aggiornaRiepilogoAnnuale(){
  const year = parseInt(inputAnnoAnn.value, 10); if(isNaN(year)) return;
  const tbody = document.querySelector("#tabella-riepilogo-ann tbody"); tbody.innerHTML = "";
  let totEntrate = 0, totSpese = 0, totMutuo = 0, totSaldo = 0, montante = 0;
  for(let m=0; m<12; m++){
    const start = new Date(year, m, 1);
    const end = new Date(year, m+1, 0);
    let entrate = 0, spese = 0, mutuo = 0;
    for(const mov of MOVIMENTI){
      if(!mov.data) continue; const d = parseDate(mov.data);
      if(d >= start && d <= end){
        if(mov.tipo === "entrata") entrate += mov.importo;
        else if(mov.tipo === "mutuo"){ spese += mov.importo; mutuo += mov.importo; }
        else spese += mov.importo;
      }
    }
    const saldo = entrate - spese;
    montante += saldo;
    totEntrate += entrate; totSpese += spese; totMutuo += mutuo; totSaldo += saldo;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${monthLabel(m)}</td><td>${fmtMoney(entrate)}</td><td>${fmtMoney(spese)}</td><td>${fmtMoney(mutuo)}</td><td>${fmtMoney(saldo)}</td><td>${fmtMoney(montante)}</td>`;
    tbody.appendChild(tr);
  }
  document.getElementById("ann-tot-entrate").textContent = fmtMoney(totEntrate);
  document.getElementById("ann-tot-spese").textContent  = fmtMoney(totSpese);
  document.getElementById("ann-tot-mutuo").textContent  = fmtMoney(totMutuo);
  document.getElementById("ann-tot-saldo").textContent  = fmtMoney(totSaldo);
  document.getElementById("ann-tot-montante").textContent = fmtMoney(montante);
}
inputAnnoAnn.addEventListener("change", aggiornaRiepilogoAnnuale);
