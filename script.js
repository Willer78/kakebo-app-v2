/* Kakebo v3.8.2 — FULL (offline-first, no cloud) */
// ===== Config & helpers =====
const CATEGORIE = {
  Sopravvivenza:["Alimentazione","Farmacia","Cane","Telefono fisso","Acqua","Gas","Elettricità","Auto","Moto"],
  Optional:["Ristorante","Spese di casa","Cosmesi/ capelli","Shopping","Sport","Cellulare"],
  Cultura:["Libri","Musica","Scuola Eva","Scuola Elena"],
  Extra:["Viaggi","Regali","Spese casa grandi"],
  Entrate:["Stipendio","Assegni familiari","Fotovoltaico","Altre entrate"]
};
const $ = s=>document.querySelector(s);
const pad=n=>String(n).padStart(2,"0");
const todayStr=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const parseDate=s=>{const [Y,M,D]=s.split("-").map(Number);return new Date(Y,M-1,D)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const startOfMondayWeek=d=>{const day=d.getDay();const offset=(day===0?-6:1-day);return addDays(d,offset)};
const endOfSundayWeek=d=> addDays(startOfMondayWeek(d),6);
function contabileMonthBounds(year,month/*1-12*/){
  const first=new Date(year,month-1,1);
  const last=new Date(year,month,0);
  const prevLast=new Date(year,month-1,0);
  const prevLastDow=prevLast.getDay();
  const startMonday=(prevLastDow>=1 && prevLastDow<=3) ? startOfMondayWeek(prevLast) : startOfMondayWeek(first);
  const lastDow=last.getDay();
  const endSunday=(lastDow===4 || lastDow===5 || lastDow===6 || lastDow===0) ? endOfSundayWeek(last) : addDays(startOfMondayWeek(last), -1);
  return { startMonday, endExclusiveMonday:addDays(endSunday,1) };
}
const KEY="kakebo_movimenti_v1";
let MOVIMENTI=[];try{MOVIMENTI=JSON.parse(localStorage.getItem(KEY)||"[]")}catch{MOVIMENTI=[]}
const salva=()=>localStorage.setItem(KEY, JSON.stringify(MOVIMENTI));
const fmtMoney=n=>`€ ${Number(n||0).toFixed(2)}`;

// ===== Theme =====
(function(){
  const saved=localStorage.getItem("kakebo_theme")||"light";
  document.documentElement.setAttribute("data-theme", saved);
  $("#theme-toggle").addEventListener("click", ()=>{
    const cur=document.documentElement.getAttribute("data-theme");
    const next=cur==="light"?"dark":"light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("kakebo_theme", next);
  });
})();

// ===== Tabs =====
const tabIns=$("#tab-inserimento"), tabRiep=$("#tab-riepilogo"), tabSett=$("#tab-riepilogo-sett"), tabTri=$("#tab-riepilogo-tri"), tabAnn=$("#tab-riepilogo-ann"), tabDash=$("#tab-dashboard");
const secIns=$("#sezione-inserimento"), secRiep=$("#sezione-riepilogo"), secSett=$("#sezione-riepilogo-sett"), secTri=$("#sezione-riepilogo-tri"), secAnn=$("#sezione-riepilogo-ann"), secDash=$("#sezione-dashboard");
function switchTab(which){
  [tabIns,tabRiep,tabSett,tabTri,tabAnn,tabDash].forEach(t=>t.classList.remove("active"));
  [secIns,secRiep,secSett,secTri,secAnn,secDash].forEach(s=>s.classList.add("hidden"));
  if(which==="ins"){tabIns.classList.add("active");secIns.classList.remove("hidden");}
  else if(which==="riep"){tabRiep.classList.add("active");secRiep.classList.remove("hidden");aggiornaRiepilogo();}
  else if(which==="sett"){tabSett.classList.add("active");secSett.classList.remove("hidden");aggiornaRiepilogoSettimanale();}
  else if(which==="tri"){tabTri.classList.add("active");secTri.classList.remove("hidden");aggiornaRiepilogoTrimestri();}
  else if(which==="ann"){tabAnn.classList.add("active");secAnn.classList.remove("hidden");aggiornaRiepilogoAnnuale();}
  else {tabDash.classList.add("active");secDash.classList.remove("hidden");aggiornaDashboard();}
}
tabIns.addEventListener("click",()=>switchTab("ins"));
tabRiep.addEventListener("click",()=>switchTab("riep"));
tabSett.addEventListener("click",()=>switchTab("sett"));
tabTri.addEventListener("click",()=>switchTab("tri"));
tabAnn.addEventListener("click",()=>switchTab("ann"));
tabDash.addEventListener("click",()=>switchTab("dash"));

// ===== Form =====
const inputData=$("#data"), inputImporto=$("#importo"), selTipo=$("#tipo"), selMacro=$("#macro"), selCat=$("#categoria"), inputNota=$("#nota");
inputData.value=todayStr();

function refreshMacroETree(){
  const tipo=selTipo.value;
  selMacro.innerHTML=""; selCat.innerHTML="";
  if (tipo==="mutuo"){
    selMacro.disabled=true; selCat.disabled=true;
    const o1=document.createElement("option"); o1.value=""; o1.textContent="— (non richiesto)"; selMacro.appendChild(o1);
    const o2=document.createElement("option"); o2.value=""; o2.textContent="— (non richiesto)"; selCat.appendChild(o2);
    return;
  } else {
    selMacro.disabled=false; selCat.disabled=false;
  }
  let macros=[];
  if(tipo==="entrata"){ macros=["Entrate"]; }
  else { macros=["Sopravvivenza","Optional","Cultura","Extra"]; }
  for(const m of macros){ const o=document.createElement("option"); o.value=m; o.textContent=m; selMacro.appendChild(o); }
  refreshCategorie();
}
function refreshCategorie(){
  selCat.innerHTML="";
  const macro=selMacro.value;
  for(const v of (CATEGORIE[macro]||[])){ const o=document.createElement("option"); o.value=v; o.textContent=v; selCat.appendChild(o); }
}
selTipo.addEventListener("change", refreshMacroETree);
selMacro.addEventListener("change", refreshCategorie);
refreshMacroETree();

document.getElementById("form-movimento").addEventListener("submit",(e)=>{
  e.preventDefault();
  const data=inputData.value; const importo=parseFloat(inputImporto.value); const tipo=selTipo.value;
  if(!data || isNaN(importo)){ alert("Controlla data e importo."); return; }
  let macro="", categoria="";
  if(tipo==="mutuo"){ macro="Mutuo"; categoria="—"; }
  else if(tipo==="entrata"){ macro="Entrate"; categoria=selCat.value||""; if(!categoria){ alert("Seleziona la voce di entrata."); return; } }
  else { macro=selMacro.value||""; categoria=selCat.value||""; if(!macro || !categoria){ alert("Seleziona macro e sotto-categoria."); return; } }
  const nota=(inputNota.value||"").trim();
  const mov={ id:crypto.randomUUID(), data, importo:Number(importo), tipo, macro, categoria, nota, updated_at:new Date().toISOString() };
  MOVIMENTI.unshift(mov); salva(); renderTabella(); e.target.reset(); inputData.value=todayStr(); refreshMacroETree(); aggiornaTutti();
});

document.getElementById("pulisci").addEventListener("click", ()=>{ document.getElementById("form-movimento").reset(); inputData.value=todayStr(); refreshMacroETree(); });
document.getElementById("cancella-tutto").addEventListener("click", ()=>{
  if(confirm("Sei sicuro di voler svuotare l'archivio locale?")){ MOVIMENTI=[]; salva(); renderTabella(); aggiornaTutti(); }
});

// ===== Tabella movimenti =====
function renderTabella(){
  const tbody=document.querySelector("#tabella-movimenti tbody"); tbody.innerHTML="";
  for(const m of MOVIMENTI){
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${m.data}</td><td>${m.tipo}</td><td>${m.macro||""}</td><td>${m.categoria||""}</td><td>€ ${Number(m.importo).toFixed(2)}</td><td>${m.nota||""}</td><td><button class="del" data-id="${m.id}">Elimina</button></td>`;
    tbody.appendChild(tr);
  }
  tbody.querySelectorAll("button.del").forEach(btn=>btn.addEventListener("click",(ev)=>{
    const id=ev.currentTarget.getAttribute("data-id"); MOVIMENTI=MOVIMENTI.filter(x=>x.id!==id); salva(); renderTabella(); aggiornaTutti();
  }));
}
renderTabella();

// ===== Backup =====
document.getElementById("btn-backup-export").addEventListener("click", ()=>{
  const payload={version:"3.8.2", exportedAt:new Date().toISOString(), data:Array.isArray(MOVIMENTI)?MOVIMENTI:[]};
  const ym=(()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}`;})();
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`Kakebo_backup_${ym}.kakebo`; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},0);
});
document.getElementById("btn-backup-import").addEventListener("click", ()=> document.getElementById("input-backup").click());
document.getElementById("input-backup").addEventListener("change", (e)=>{
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const obj=JSON.parse(reader.result);
      if(!obj || !Array.isArray(obj.data)) throw new Error("Formato non valido: manca 'data' come array.");
      const merge=confirm("OK = Unisci i dati del backup; Annulla = Sostituisci completamente.");
      if(merge){
        const byId=new Map(MOVIMENTI.map(m=>[m.id,m])); for(const m of obj.data){ if(m && m.id){ byId.set(m.id,m); } } MOVIMENTI=Array.from(byId.values());
      }else{ MOVIMENTI=obj.data; }
      MOVIMENTI.sort((a,b)=>(b.updated_at||b.data||"").localeCompare(a.updated_at||a.data||""));
      salva(); renderTabella(); aggiornaTutti(); alert("Import completato.");
    }catch(err){ alert("Impossibile importare il backup: "+err.message); }
    e.target.value="";
  };
  reader.readAsText(file);
});

# ===== Riepilogo mensile =====
const inputMese=$("#mese-riepilogo");
(function(){const d=new Date(); inputMese.value=`${d.getFullYear()}-${pad(d.getMonth()+1)}`;})();
function aggiornaRiepilogo(){
  if(!inputMese.value) return;
  const prefix=inputMese.value;
  const delmese=MOVIMENTI.filter(m=>(m.data||"").startsWith(prefix));
  const totali={}; let entrate=0, spese=0;
  for(const m of delmese){
    if(m.tipo==="entrata") entrate+=Number(m.importo);
    else if(m.tipo==="mutuo"){ spese+=Number(m.importo); totali["Mutuo"]=(totali["Mutuo"]||0)+Number(m.importo); }
    else { spese+=Number(m.importo); const key=m.macro||"Altro"; totali[key]=(totali[key]||0)+Number(m.importo); }
  }
  const ul=$("#totali-macro"); ul.innerHTML="";
  const order=["Sopravvivenza","Optional","Cultura","Extra","Mutuo","Altro"]; let printed=false;
  for(const k of order){ if((totali[k]||0)>0){ const li=document.createElement("li"); li.textContent=`${k}: € ${(totali[k]).toFixed(2)}`; ul.appendChild(li); printed=true; } }
  if(!printed){ const li=document.createElement("li"); li.textContent="Nessuna spesa registrata nel mese selezionato."; ul.appendChild(li); }
  const saldo=entrate-spese; $("#saldo-mese").textContent=`Entrate: € ${entrate.toFixed(2)} – Spese: € ${spese.toFixed(2)} → Saldo: € ${saldo.toFixed(2)}`;
}
inputMese.addEventListener("change", aggiornaRiepilogo);

# ===== Riepilogo settimanale =====
const inputMeseSett=$("#mese-riepilogo-sett");
(function(){const d=new Date(); inputMeseSett.value=`${d.getFullYear()}-${pad(d.getMonth()+1)}`;})();
function formatRange(a,b){const dd=x=>String(x).padStart(2,"0");return `${dd(a.getDate())}/${dd(a.getMonth()+1)} – ${dd(b.getDate())}/${dd(b.getMonth()+1)}`;}
function aggiornaRiepilogoSettimanale(){
  if(!inputMeseSett.value) return;
  const [Y,M]=inputMeseSett.value.split("-").map(Number);
  const { startMonday, endExclusiveMonday } = contabileMonthBounds(Y,M);
  const tbody=document.querySelector("#tabella-riepilogo-sett tbody"); tbody.innerHTML="";
  for(let cur=new Date(startMonday); cur<endExclusiveMonday; cur=addDays(cur,7)){
    const weekStart=new Date(cur), weekEnd=endOfSundayWeek(weekStart);
    let entrate=0, speseSenzaMutuo=0;
    for(const m of MOVIMENTI){
      if(!m.data) continue; const d=parseDate(m.data);
      if(d>=weekStart && d<=weekEnd){ if(m.tipo==="entrata") entrate+=Number(m.importo); else if(m.tipo==="spesa") speseSenzaMutuo+=Number(m.importo); }
    }
    const saldo=entrate-speseSenzaMutuo;
    const tr=document.createElement("tr"); tr.innerHTML=`<td>${formatRange(weekStart,weekEnd)}</td><td>${fmtMoney(entrate)}</td><td>${fmtMoney(speseSenzaMutuo)}</td><td>${fmtMoney(saldo)}</td>`; tbody.appendChild(tr);
  }
}
inputMeseSett.addEventListener("change", aggiornaRiepilogoSettimanale);

# ===== Riepilogo trimestrale =====
const inputAnnoTri=$("#anno-tri"); (function(){const d=new Date(); inputAnnoTri.value=d.getFullYear();})();
function aggiornaRiepilogoTrimestri(){
  const year=parseInt(inputAnnoTri.value,10); if(isNaN(year)) return;
  const tbody=document.querySelector("#tabella-riepilogo-tri tbody"); tbody.innerHTML="";
  for(let q=1;q<=4;q++){
    const startMonth=(q-1)*3; const start=new Date(year,startMonth,1); const end=new Date(year,startMonth+3,0);
    let entrate=0,spese=0,mutuo=0;
    for(const m of MOVIMENTI){
      if(!m.data) continue; const d=parseDate(m.data);
      if(d>=start && d<=end){ if(m.tipo==="entrata") entrate+=Number(m.importo); else if(m.tipo==="mutuo"){ spese+=Number(m.importo); mutuo+=Number(m.importo);} else spese+=Number(m.importo); }
    }
    const saldo=entrate-spese;
    const periodStr=`${String(start.getDate()).padStart(2,"0")}/${String(start.getMonth()+1).padStart(2,"0")}–${String(end.getDate()).padStart(2,"0")}/${String(end.getMonth()+1).padStart(2,"0")}`;
    const tr=document.createElement("tr"); tr.innerHTML=`<td>Q${q}</td><td>${periodStr}</td><td>${fmtMoney(entrate)}</td><td>${fmtMoney(spese)}</td><td>${fmtMoney(mutuo)}</td><td>${fmtMoney(saldo)}</td>`; tbody.appendChild(tr);
  }
}
inputAnnoTri.addEventListener("change", aggiornaRiepilogoTrimestri);

# ===== Riepilogo annuale =====
const inputAnnoAnn=$("#anno-ann"); (function(){const d=new Date(); inputAnnoAnn.value=d.getFullYear();})();
function monthLabel(i){return ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"][i];}
function aggiornaRiepilogoAnnuale(){
  const year=parseInt(inputAnnoAnn.value,10); if(isNaN(year)) return;
  const tbody=document.querySelector("#tabella-riepilogo-ann tbody"); tbody.innerHTML="";
  let totEntrate=0,totSpese=0,totMutuo=0,totSaldo=0,montante=0;
  for(let m=0;m<12;m++){
    const start=new Date(year,m,1), end=new Date(year,m+1,0);
    let entrate=0,spese=0,mutuo=0;
    for(const mov of MOVIMENTI){
      if(!mov.data) continue; const d=parseDate(mov.data);
      if(d>=start && d<=end){
        if(mov.tipo==="entrata") entrate+=Number(mov.importo);
        else if(mov.tipo==="mutuo"){ spese+=Number(mov.importo); mutuo+=Number(mov.importo); }
        else spese+=Number(mov.importo);
      }
    }
    const saldo=entrate-spese; montante+=saldo;
    totEntrate+=entrate; totSpese+=spese; totMutuo+=mutuo; totSaldo+=saldo;
    const tr=document.createElement("tr"); tr.innerHTML=`<td>${monthLabel(m)}</td><td>${fmtMoney(entrate)}</td><td>${fmtMoney(spese)}</td><td>${fmtMoney(mutuo)}</td><td>${fmtMoney(saldo)}</td><td>${fmtMoney(montante)}</td>`; tbody.appendChild(tr);
  }
  document.getElementById("ann-tot-entrate").textContent=fmtMoney(totEntrate);
  document.getElementById("ann-tot-spese").textContent=fmtMoney(totSpese);
  document.getElementById("ann-tot-mutuo").textContent=fmtMoney(totMutuo);
  document.getElementById("ann-tot-saldo").textContent=fmtMoney(totSaldo);
  document.getElementById("ann-tot-montante").textContent=fmtMoney(montante);
}
inputAnnoAnn.addEventListener("change", aggiornaRiepilogoAnnuale);

# ===== PDF Export =====
function exportPDF(filename, titleText, subtitleText, node, extraFooterText){
  if(typeof html2pdf==="undefined"){ alert("Impossibile generare PDF (libreria non caricata)."); return; }
  const container=document.createElement("div");
  const title=document.createElement("h2"); title.className="pdf-title"; title.textContent=titleText;
  const sub=document.createElement("p"); sub.className="pdf-sub"; sub.textContent=subtitleText;
  container.appendChild(title); container.appendChild(sub); container.appendChild(node.cloneNode(true));
  if(extraFooterText){ const foot=document.createElement("p"); foot.className="pdf-footer"; foot.textContent=extraFooterText; container.appendChild(foot); }
  const opt={ margin:10, filename, image:{type:'jpeg',quality:0.98}, html2canvas:{scale:2,useCORS:true}, jsPDF:{unit:'mm',format:'a4',orientation:'portrait'} };
  html2pdf().set(opt).from(container).save();
}
document.getElementById("btn-pdf-mensile")?.addEventListener("click", ()=>{
  aggiornaRiepilogo();
  const ym=inputMese.value||"(mese)";
  exportPDF(`Kakebo_Mensile_${ym}.pdf`, "Kakebo – Riepilogo mensile", `Mese: ${ym}`, document.getElementById("riepilogo-risultati"), document.getElementById("saldo-mese").textContent);
});
document.getElementById("btn-pdf-sett")?.addEventListener("click", ()=>{
  aggiornaRiepilogoSettimanale();
  const ym=inputMeseSett.value||"(mese)";
  exportPDF(`Kakebo_Settimanale_${ym}.pdf`, "Kakebo – Riepilogo settimanale", `Mese contabile: ${ym}`, document.getElementById("tabella-riepilogo-sett"), "Nota: il mutuo è escluso dai totali settimanali.");
});
document.getElementById("btn-pdf-tri")?.addEventListener("click", ()=>{
  aggiornaRiepilogoTrimestri();
  const y=inputAnnoTri.value||"(anno)";
  exportPDF(`Kakebo_Trimestrale_${y}.pdf`, "Kakebo – Riepilogo trimestrale", `Anno: ${y}`, document.getElementById("tabella-riepilogo-tri"), "Il mutuo è incluso nelle spese e mostrato separatamente.");
});
document.getElementById("btn-pdf-ann")?.addEventListener("click", ()=>{
  aggiornaRiepilogoAnnuale();
  const y=inputAnnoAnn.value||"(anno)";
  exportPDF(`Kakebo_Annuale_${y}.pdf`, "Kakebo – Riepilogo annuale", `Anno: ${y}`, document.getElementById("tabella-riepilogo-ann"), "Il montante è la somma cumulata dei saldi mese.");
});

# ===== CSV Export =====
function rowsToCSV(rows){
  return rows.map(r=>r.map(v=>{const s=String(v??"");return (s.includes(';')||s.includes('"')||s.includes('\n'))?('"'+s.replace(/"/g,'""')+'"'):s;}).join(';')).join('\n');
}
document.getElementById("btn-csv-mensile")?.addEventListener("click", ()=>{
  const ym=inputMese.value||"(mese)";
  const delmese=MOVIMENTI.filter(m=>(m.data||"").startsWith(ym));
  const totali={}; let entrate=0,spese=0;
  for(const m of delmese){
    if(m.tipo==="entrata") entrate+=Number(m.importo);
    else if(m.tipo==="mutuo"){ spese+=Number(m.importo); totali["Mutuo"]=(totali["Mutuo"]||0)+Number(m.importo); }
    else { spese+=Number(m.importo); const key=m.macro||"Altro"; totali[key]=(totali[key]||0)+Number(m.importo); }
  }
  const order=["Sopravvivenza","Optional","Cultura","Extra","Mutuo","Altro"];
  const rows=[["Macro","Importo (€)"]];
  for(const k of order){ if((totali[k]||0)>0) rows.push([k,(totali[k]).toFixed(2)]); }
  rows.push([]); rows.push(["Entrate",entrate.toFixed(2)]); rows.push(["Spese",spese.toFixed(2)]); rows.push(["Saldo",(entrate-spese).toFixed(2)]);
  const csv=rowsToCSV(rows); const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download=`Kakebo_Mensile_${ym}.csv`; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},0);
});
document.getElementById("btn-csv-sett")?.addEventListener("click", ()=>{
  const ym=inputMeseSett.value||"(mese)"; const [Y,M]=ym.split("-").map(Number);
  const { startMonday, endExclusiveMonday } = contabileMonthBounds(Y,M);
  const rows=[["Settimana","Entrate","Spese (no mutuo)","Saldo"]];
  for(let cur=new Date(startMonday); cur<endExclusiveMonday; cur=addDays(cur,7)){
    const weekStart=new Date(cur), weekEnd=endOfSundayWeek(weekStart);
    let entrate=0, speseSenzaMutuo=0;
    for(const m of MOVIMENTI){
      if(!m.data) continue; const d=parseDate(m.data);
      if(d>=weekStart && d<=weekEnd){ if(m.tipo==="entrata") entrate+=Number(m.importo); else if(m.tipo==="spesa") speseSenzaMutuo+=Number(m.importo); }
    }
    rows.push([`${weekStart.toLocaleDateString()}–${weekEnd.toLocaleDateString()}`, entrate.toFixed(2), speseSenzaMutuo.toFixed(2), (entrate-speseSenzaMutuo).toFixed(2)]);
  }
  const csv=rowsToCSV(rows); const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download=`Kakebo_Settimanale_${ym}.csv`; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},0);
});
document.getElementById("btn-csv-tri")?.addEventListener("click", ()=>{
  const y=inputAnnoTri.value||"(anno)";
  const rows=[["Trimestre","Periodo","Entrate","Spese (incl. mutuo)","Mutuo","Saldo"]];
  for(let q=1;q<=4;q++){
    const startMonth=(q-1)*3; const start=new Date(parseInt(y,10),startMonth,1); const end=new Date(parseInt(y,10),startMonth+3,0);
    let entrate=0,spese=0,mutuo=0;
    for(const m of MOVIMENTI){
      if(!m.data) continue; const d=parseDate(m.data);
      if(d>=start && d<=end){ if(m.tipo==="entrata") entrate+=Number(m.importo); else if(m.tipo==="mutuo"){ spese+=Number(m.importo); mutuo+=Number(m.importo); } else spese+=Number(m.importo); }
    }
    rows.push([`Q${q}`, `${start.toLocaleDateString()}–${end.toLocaleDateString()}`, entrate.toFixed(2), spese.toFixed(2), mutuo.toFixed(2), (entrate-spese).toFixed(2)]);
  }
  const csv=rowsToCSV(rows); const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download=`Kakebo_Trimestrale_${y}.csv`; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},0);
});
document.getElementById("btn-csv-ann")?.addEventListener("click", ()=>{
  const y=inputAnnoAnn.value||"(anno)";
  const rows=[["Mese","Entrate","Spese (incl. mutuo)","Mutuo","Saldo mese","Montante"]];
  let montante=0;
  for(let m=0;m<12;m++){
    const start=new Date(parseInt(y,10),m,1), end=new Date(parseInt(y,10),m+1,0);
    let entrate=0,spese=0,mutuo=0;
    for(const mov of MOVIMENTI){
      if(!mov.data) continue; const d=parseDate(mov.data);
      if(d>=start && d<=end){ if(mov.tipo==="entrata") entrate+=Number(mov.importo); else if(mov.tipo==="mutuo"){ spese+=Number(mov.importo); mutuo+=Number(mov.importo); } else spese+=Number(mov.importo); }
    }
    const saldo=entrate-spese; montante+=saldo;
    rows.push([[ "Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic" ][m], entrate.toFixed(2), spese.toFixed(2), mutuo.toFixed(2), saldo.toFixed(2), montante.toFixed(2)]);
  }
  const csv=rowsToCSV(rows); const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download=`Kakebo_Annuale_${y}.csv`; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},0);
});

# ===== Dashboard (Chart.js) =====
let chart;
const inputMeseDash=$("#mese-dashboard"); (function(){const d=new Date(); inputMeseDash.value=`${d.getFullYear()}-${pad(d.getMonth()+1)}`;})();
function aggiornaDashboard(){
  if(!inputMeseDash.value) return;
  const prefix=inputMeseDash.value;
  const delmese=MOVIMENTI.filter(m=>(m.data||"").startsWith(prefix));
  const keys=["Sopravvivenza","Optional","Cultura","Extra","Mutuo"];
  const values={Sopravvivenza:0,Optional:0,Cultura:0,Extra:0,Mutuo:0};
  for(const m of delmese){
    if(m.tipo==="spesa"){ const key=m.macro||"Altro"; if(values[key]==null) values[key]=0; values[key]+=Number(m.importo); }
    else if(m.tipo==="mutuo"){ values["Mutuo"]+=Number(m.importo); }
  }
  const ctx=document.getElementById("chart-macro").getContext("2d");
  if(chart) chart.destroy();
  chart=new Chart(ctx,{ type:"bar", data:{ labels:keys, datasets:[{ label:"Spese per macro (€)", data:keys.map(k=>values[k]||0) }] }, options:{ responsive:true, scales:{ y:{ beginAtZero:true } } } });
}
inputMeseDash.addEventListener("change", aggiornaDashboard);

// ===== Boot =====
function aggiornaTutti(){ aggiornaRiepilogo(); aggiornaRiepilogoSettimanale(); aggiornaRiepilogoTrimestri(); aggiornaRiepilogoAnnuale(); aggiornaDashboard(); }
aggiornaTutti();
