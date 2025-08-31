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
const download = (filename, content, type="text/plain;charset=utf-8") => {
  const blob = new Blob([content], {type});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(()=>{ URL.revokeObjectURL(link.href); link.remove(); }, 0);
};

// === Theme ===
(function initTheme(){
  const saved = localStorage.getItem("kakebo_theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  $("#theme-toggle").addEventListener("click", ()=>{
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("kakebo_theme", next);
  });
})();

// === Storage ===
const KEY = "kakebo_movimenti_v1";
let MOVIMENTI = [];
try { MOVIMENTI = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { MOVIMENTI = []; }
const salva = () => localStorage.setItem(KEY, JSON.stringify(MOVIMENTI));

// === Date utils ===
const pad = (n) => String(n).padStart(2,"0");
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
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
const tabDash = document.getElementById("tab-dashboard");

const secIns = document.getElementById("sezione-inserimento");
const secRiep = document.getElementById("sezione-riepilogo");
const secSett = document.getElementById("sezione-riepilogo-sett");
const secTri  = document.getElementById("sezione-riepilogo-tri");
const secAnn  = document.getElementById("sezione-riepilogo-ann");
const secDash = document.getElementById("sezione-dashboard");

function switchTab(which){
  [tabIns,tabRiep,tabSett,tabTri,tabAnn,tabDash].forEach(t=>t.classList.remove("active"));
  [secIns,secRiep,secSett,secTri,secAnn,secDash].forEach(s=>s.classList.add("hidden"));
  if(which==="ins"){ tabIns.classList.add("active"); secIns.classList.remove("hidden"); }
  else if(which==="riep"){ tabRiep.classList.add("active"); secRiep.classList.remove("hidden"); aggiornaRiepilogo(); }
  else if(which==="sett"){ tabSett.classList.add("active"); secSett.classList.remove("hidden"); aggiornaRiepilogoSettimanale(); }
  else if(which==="tri"){ tabTri.classList.add("active"); secTri.classList.remove("hidden"); aggiornaRiepilogoTrimestri(); }
  else if(which==="ann"){ tabAnn.classList.add("active"); secAnn.classList.remove("hidden"); aggiornaRiepilogoAnnuale(); }
  else { tabDash.classList.add("active"); secDash.classList.remove("hidden"); aggiornaDashboard(); }
}
tabIns.addEventListener("click", ()=>switchTab("ins"));
tabRiep.addEventListener("click", ()=>switchTab("riep"));
tabSett.addEventListener("click", ()=>switchTab("sett"));
tabTri .addEventListener("click", ()=>switchTab("tri"));
tabAnn .addEventListener("click", ()=>switchTab("ann"));
tabDash.addEventListener("click", ()=>switchTab("dash"));

// === Form ===
const inputData = $("#data");
const inputImporto = $("#importo");
const selTipo = $("#tipo");
const selMacro = $("#macro");
const selCat = $("#categoria");
const inputNota = $("#nota");

inputData.value = todayStr();

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
  if (tipo === "entrata") { macro = "Entrate"; categoria = selCat.value || ""; }
  else if (tipo === "mutuo") { macro = "Mutuo"; categoria = "—"; }
  else { macro = selMacro.value || ""; categoria = selCat.value || ""; }
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
  aggiornaTutti();
});

function aggiornaTutti(){ aggiornaRiepilogo(); aggiornaRiepilogoSettimanale(); aggiornaRiepilogoTrimestri(); aggiornaRiepilogoAnnuale(); aggiornaDashboard(); }

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
    aggiornaTutti();
  }
});

// === BACKUP / RESTORE ===
document.getElementById("btn-backup-export").addEventListener("click", ()=>{
  const payload = { version:"3.7", exportedAt:new Date().toISOString(), data:Array.isArray(MOVIMENTI)?MOVIMENTI:[] };
  const ym = (()=>{ const d=new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}`; })();
  download(`Kakebo_backup_${ym}.kakebo`, JSON.stringify(payload,null,2), "application/json");
});

document.getElementById("btn-backup-import").addEventListener("click", ()=>{
  document.getElementById("input-backup").click();
});

document.getElementById("input-backup").addEventListener("change", (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (ev)=>{
    try{
      const obj = JSON.parse(ev.target.result);
      if(!obj || !Array.isArray(obj.data)) throw new Error("Formato non valido: manca 'data' come array.");
      const merge = confirm("Vuoi UNIRE (merge) i dati del backup con quelli esistenti?\nOK = Unisci, Annulla = Sostituisci completamente.");
      if(merge){
        const byId = new Map(MOVIMENTI.map(m=>[m.id,m]));
        for(const m of obj.data){ if(m && m.id){ byId.set(m.id, m); } }
        MOVIMENTI = Array.from(byId.values());
      } else {
        MOVIMENTI = obj.data;
      }
      // riordino (più recenti in alto)
      MOVIMENTI.sort((a,b)=>{
        if(a.data===b.data) return (b.id||"").localeCompare(a.id||"");
        return (b.data||"").localeCompare(a.data||"");
      });
      salva();
      renderTabella();
      aggiornaTutti();
      alert("Import completato con successo.");
    }catch(err){
      console.error(err);
      alert("Impossibile importare il backup: " + err.message);
    } finally {
      e.target.value = "";
    }
  };
  reader.readAsText(file);
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
      aggiornaTutti();
    });
  });
}
renderTabella();

// Riepilogo mensile
const inputMese = document.getElementById("mese-riepilogo");
(function(){ const d=new Date(); inputMese.value=`${d.getFullYear()}-${pad(d.getMonth()+1)}`; })();
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

// Riepilogo settimanale
const inputMeseSett = document.getElementById("mese-riepilogo-sett");
(function(){ const d=new Date(); inputMeseSett.value=`${d.getFullYear()}-${pad(d.getMonth()+1)}`; })();
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
(function(){ const d = new Date(); inputAnnoTri.value = d.getFullYear(); })();
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
    const periodStr = `${String(start.getDate()).padStart(2,"0")}/${String(start.getMonth()+1).padStart(2,"0")}–${String(end.getDate()).padStart(2,"0")}/${String(end.getMonth()+1,"0")}`;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>Q${q}</td><td>${periodStr}</td><td>${fmtMoney(entrate)}</td><td>${fmtMoney(spese)}</td><td>${fmtMoney(mutuo)}</td><td>${fmtMoney(saldo)}</td>`;
    tbody.appendChild(tr);
  }
}
inputAnnoTri.addEventListener("change", aggiornaRiepilogoTrimestri);

// Riepilogo annuale
const inputAnnoAnn = document.getElementById("anno-ann");
(function(){ const d = new Date(); inputAnnoAnn.value = d.getFullYear(); })();
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

// === PDF EXPORT (html2pdf) ===
function exportPDF(filename, titleText, subtitleText, tableNodeOrListNode, extraFooterText){
  if(typeof html2pdf === "undefined"){ alert("Impossibile generare PDF (libreria non caricata)."); return; }
  const container = document.createElement("div");
  const title = document.createElement("h2"); title.className = "pdf-title"; title.textContent = titleText;
  const sub = document.createElement("p"); sub.className = "pdf-sub"; sub.textContent = subtitleText;
  container.appendChild(title); container.appendChild(sub);
  container.appendChild(tableNodeOrListNode.cloneNode(true));
  if(extraFooterText){ const foot = document.createElement("p"); foot.className = "pdf-footer"; foot.textContent = extraFooterText; container.appendChild(foot); }
  const opt = { margin:10, filename, image:{type:'jpeg',quality:0.98}, html2canvas:{scale:2,useCORS:true}, jsPDF:{unit:'mm',format:'a4',orientation:'portrait'} };
  html2pdf().set(opt).from(container).save();
}

// === CSV EXPORT ===
function rowsToCSV(rows){
  return rows.map(r => r.map(v => {
    const s = String(v ?? "");
    if (s.includes(';') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g,'""') + '"';
    return s;
  }).join(';')).join('\n');
}

function exportMonthlyCSV(){
  const ym = inputMese.value || "(mese)";
  const prefix = ym;
  const delmese = MOVIMENTI.filter(m => (m.data || "").startsWith(prefix));
  const totali = {}; let entrate=0, spese=0;
  for(const m of delmese){
    if(m.tipo==="entrata") entrate+=m.importo;
    else if(m.tipo==="mutuo"){ spese+=m.importo; totali["Mutuo"]=(totali["Mutuo"]||0)+m.importo; }
    else { spese+=m.importo; const key=m.macro||"Altro"; totali[key]=(totali[key]||0)+m.importo; }
  }
  const order=["Sopravvivenza","Optional","Cultura","Extra","Mutuo","Altro"];
  const rows=[["Macro","Importo (€)"]];
  for(const k of order){ if(totali[k]>0) rows.push([k, totali[k].toFixed(2)]); }
  rows.push([]); rows.push(["Entrate", entrate.toFixed(2)]); rows.push(["Spese", spese.toFixed(2)]); rows.push(["Saldo", (entrate-spese).toFixed(2)]);
  download(`Kakebo_Mensile_${ym}.csv`, rowsToCSV(rows));
}

function exportWeeklyCSV(){
  const ym = inputMeseSett.value || "(mese)";
  const [Y,M]=ym.split("-").map(Number);
  const { startMonday, endExclusiveMonday } = contabileMonthBounds(Y,M);
  const rows=[["Settimana","Entrate","Spese (no mutuo)","Saldo"]];
  for(let cur=new Date(startMonday); cur<endExclusiveMonday; cur=addDays(cur,7)){
    const weekStart=new Date(cur), weekEnd=endOfSundayWeek(weekStart);
    let entrate=0, speseSenzaMutuo=0;
    for(const m of MOVIMENTI){
      if(!m.data) continue; const d=parseDate(m.data);
      if(d>=weekStart && d<=weekEnd){ if(m.tipo==="entrata") entrate+=m.importo; else if(m.tipo==="spesa") speseSenzaMutuo+=m.importo; }
    }
    rows.push([`${weekStart.toLocaleDateString()}–${weekEnd.toLocaleDateString()}`, entrate.toFixed(2), speseSenzaMutuo.toFixed(2), (entrate-speseSenzaMutuo).toFixed(2)]);
  }
  download(`Kakebo_Settimanale_${ym}.csv`, rowsToCSV(rows));
}

function exportQuarterlyCSV(){
  const y = document.getElementById("anno-tri").value || "(anno)";
  const rows=[["Trimestre","Periodo","Entrate","Spese (incl. mutuo)","Mutuo","Saldo"]];
  for(let q=1;q<=4;q++){
    const {start,end}=quarterRange(parseInt(y,10),q);
    let entrate=0, spese=0, mutuo=0;
    for(const m of MOVIMENTI){
      if(!m.data) continue; const d=parseDate(m.data);
      if(d>=start && d<=end){ if(m.tipo==="entrata") entrate+=m.importo; else if(m.tipo==="mutuo"){ spese+=m.importo; mutuo+=m.importo; } else spese+=m.importo; }
    }
    rows.push([`Q${q}`, `${start.toLocaleDateString()}–${end.toLocaleDateString()}`, entrate.toFixed(2), spese.toFixed(2), mutuo.toFixed(2), (entrate-spese).toFixed(2)]);
  }
  download(`Kakebo_Trimestrale_${y}.csv`, rowsToCSV(rows));
}

function exportAnnualCSV(){
  const y = document.getElementById("anno-ann").value || "(anno)";
  const rows=[["Mese","Entrate","Spese (incl. mutuo)","Mutuo","Saldo mese","Montante"]];
  let montante=0;
  for(let m=0;m<12;m++){
    const start=new Date(parseInt(y,10),m,1);
    const end=new Date(parseInt(y,10),m+1,0);
    let entrate=0,spese=0,mutuo=0;
    for(const mov of MOVIMENTI){
      if(!mov.data) continue; const d=parseDate(mov.data);
      if(d>=start && d<=end){ if(mov.tipo==="entrata") entrate+=mov.importo; else if(mov.tipo==="mutuo"){spese+=mov.importo;mutuo+=mov.importo;} else spese+=mov.importo; }
    }
    const saldo=entrate-spese; montante+=saldo;
    rows.push([[ "Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic" ][m], entrate.toFixed(2), spese.toFixed(2), mutuo.toFixed(2), saldo.toFixed(2), montante.toFixed(2)]);
  }
  download(`Kakebo_Annuale_${y}.csv`, rowsToCSV(rows));
}

// Bind PDF buttons
document.getElementById("btn-pdf-mensile").addEventListener("click", ()=>{
  aggiornaRiepilogo();
  const ym = inputMese.value || "(mese)";
  const ul = document.getElementById("totali-macro");
  const saldoTxt = document.getElementById("saldo-mese").textContent;
  exportPDF(`Kakebo_Mensile_${ym}.pdf`, "Kakebo – Riepilogo mensile", `Mese: ${ym}`, ul, saldoTxt);
});
document.getElementById("btn-pdf-sett").addEventListener("click", ()=>{
  aggiornaRiepilogoSettimanale();
  const ym = inputMeseSett.value || "(mese)";
  const tbl = document.getElementById("tabella-riepilogo-sett");
  exportPDF(`Kakebo_Settimanale_${ym}.pdf`, "Kakebo – Riepilogo settimanale", `Mese contabile: ${ym}`, tbl, "Nota: il mutuo è escluso dai totali settimanali.");
});
document.getElementById("btn-pdf-tri").addEventListener("click", ()=>{
  aggiornaRiepilogoTrimestri();
  const y = document.getElementById("anno-tri").value || "(anno)";
  const tbl = document.getElementById("tabella-riepilogo-tri");
  exportPDF(`Kakebo_Trimestrale_${y}.pdf`, "Kakebo – Riepilogo trimestrale", `Anno: ${y}`, tbl, "Il mutuo è incluso nelle spese e mostrato separatamente.");
});
document.getElementById("btn-pdf-ann").addEventListener("click", ()=>{
  aggiornaRiepilogoAnnuale();
  const y = document.getElementById("anno-ann").value || "(anno)";
  const tbl = document.getElementById("tabella-riepilogo-ann");
  exportPDF(`Kakebo_Annuale_${y}.pdf`, "Kakebo – Riepilogo annuale", `Anno: ${y}`, tbl, "Il montante è la somma cumulata dei saldi mese.");
});

// Bind CSV buttons
document.getElementById("btn-csv-mensile").addEventListener("click", exportMonthlyCSV);
document.getElementById("btn-csv-sett").addEventListener("click", exportWeeklyCSV);
document.getElementById("btn-csv-tri").addEventListener("click", exportQuarterlyCSV);
document.getElementById("btn-csv-ann").addEventListener("click", exportAnnualCSV);

// === Dashboard (Chart.js) ===
let chart;
const inputMeseDash = document.getElementById("mese-dashboard");
(function(){ const d=new Date(); inputMeseDash.value=`${d.getFullYear()}-${pad(d.getMonth()+1)}`; })();
function aggiornaDashboard(){
  if(!inputMeseDash.value) return;
  const prefix = inputMeseDash.value;
  const delmese = MOVIMENTI.filter(m => (m.data || "").startsWith(prefix));
  const keys = ["Sopravvivenza","Optional","Cultura","Extra","Mutuo"];
  const values = {Sopravvivenza:0,Optional:0,Cultura:0,Extra:0,Mutuo:0};
  for(const m of delmese){
    if(m.tipo==="spesa"){ values[m.macro||"Altro"] = (values[m.macro||"Altro"]||0) + m.importo; }
    else if(m.tipo==="mutuo"){ values["Mutuo"] += m.importo; }
  }
  const ctx = document.getElementById("chart-macro").getContext("2d");
  if(chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "bar",
    data: { labels: keys, datasets: [{ label: "Spese per macro (€)", data: keys.map(k=>values[k]||0) }] },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}
inputMeseDash.addEventListener("change", aggiornaDashboard);
