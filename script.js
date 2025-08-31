const CATEGORIE = {
  Sopravvivenza: ["Alimentazione","Farmacia","Cane","Telefono fisso","Acqua","Gas","Elettricità","Auto","Moto"],
  Optional: ["Ristorante","Spese di casa","Cosmesi/ capelli","Shopping","Sport","Cellulare"],
  Cultura: ["Libri","Musica","Scuola Eva","Scuola Elena"],
  Extra: ["Viaggi","Regali","Spese casa grandi"],
  Entrate: ["Stipendio","Assegni familiari","Fotovoltaico","Altre entrate"]
};

const $ = (sel) => document.querySelector(sel);
const KEY = "kakebo_movimenti_v1";
let MOVIMENTI = [];
try { MOVIMENTI = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { MOVIMENTI = []; }
const salva = () => localStorage.setItem(KEY, JSON.stringify(MOVIMENTI));
const pad = (n) => String(n).padStart(2,"0");
const todayStr = () => { const d = new Date(); return \`\${d.getFullYear()}-\${pad(d.getMonth()+1)}-\${pad(d.getDate())}\`; };

const tabIns = $("#tab-inserimento");
const tabRiep = $("#tab-riepilogo");
const secIns = $("#sezione-inserimento");
const secRiep = $("#sezione-riepilogo");

function switchTab(which){
  if(which==="ins"){
    tabIns.classList.add("active"); tabRiep.classList.remove("active");
    secIns.classList.remove("hidden"); secRiep.classList.add("hidden");
  } else {
    tabRiep.classList.add("active"); tabIns.classList.remove("active");
    secRiep.classList.remove("hidden"); secIns.classList.add("hidden");
    aggiornaRiepilogo();
  }
}
tabIns.addEventListener("click", ()=>switchTab("ins"));
tabRiep.addEventListener("click", ()=>switchTab("riep"));

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
  let macros = [];
  if(tipo === "entrata"){
    macros = ["Entrate"];
  } else if(tipo === "mutuo"){
    macros = [];  // mutuo non richiede macro/categoria
    selMacro.disabled = true;
    selCat.disabled = true;
    return;
  } else {
    macros = ["Sopravvivenza","Optional","Cultura","Extra"];
    selMacro.disabled = false;
    selCat.disabled = false;
  }
  for(const m of macros){
    const o = document.createElement("option");
    o.value = m; o.textContent = m;
    selMacro.appendChild(o);
  }
  refreshCategorie();
}

function refreshCategorie(){
  selCat.innerHTML = "";
  const macro = selMacro.value;
  const voci = CATEGORIE[macro] || [];
  for(const v of voci){
    const o = document.createElement("option");
    o.value = v; o.textContent = v;
    selCat.appendChild(o);
  }
}

selTipo.addEventListener("change", refreshMacroETree);
selMacro.addEventListener("change", refreshCategorie);
refreshMacroETree();

$("#form-movimento").addEventListener("submit", (e)=>{
  e.preventDefault();
  const data = inputData.value;
  const importo = parseFloat(inputImporto.value);
  const tipo = selTipo.value;
  const macro = selMacro.value || (tipo==="entrata" ? "Entrate" : "");
  const categoria = selCat.value || "";
  const nota = (inputNota.value || "").trim();

  if(!data || isNaN(importo)){ alert("Controlla data e importo."); return; }
  if(tipo!=="entrata" && tipo!=="mutuo" && (!macro || !categoria)){ alert("Seleziona macro e sotto-categoria."); return; }
  if(tipo==="entrata" && !categoria){ alert("Seleziona la voce di entrata."); return; }

  const mov = {
    id: crypto.randomUUID(),
    data, importo, tipo,
    macro: (tipo==="entrata" ? "Entrate" : macro),
    categoria, nota
  };
  MOVIMENTI.unshift(mov);
  salva();
  renderTabella();
  inputData.value = todayStr();
  e.target.reset();
  refreshMacroETree();
});

function renderTabella(){
  const tbody = document.querySelector("#tabella-movimenti tbody");
  tbody.innerHTML = "";
  for(const m of MOVIMENTI){
    const tr = document.createElement("tr");
    tr.innerHTML = \`
      <td>\${m.data}</td>
      <td>\${m.tipo}</td>
      <td>\${m.macro || ""}</td>
      <td>\${m.categoria || ""}</td>
      <td>€ \${m.importo.toFixed(2)}</td>
      <td>\${m.nota || ""}</td>
      <td><button class="del" data-id="\${m.id}">Elimina</button></td>
    \`;
    tbody.appendChild(tr);
  }
  tbody.querySelectorAll("button.del").forEach(btn=>{
    btn.addEventListener("click",(ev)=>{
      const id = ev.currentTarget.getAttribute("data-id");
      MOVIMENTI = MOVIMENTI.filter(x=>x.id!==id);
      salva();
      renderTabella();
      aggiornaRiepilogo();
    });
  });
}
renderTabella();

const inputMese = $("#mese-riepilogo");
(function setDefaultMonth(){
  const d = new Date();
  inputMese.value = \`\${d.getFullYear()}-\${pad(d.getMonth()+1)}\`;
})();

function aggiornaRiepilogo(){
  if(!inputMese.value) return;
  const prefix = inputMese.value;
  const delmese = MOVIMENTI.filter(m => (m.data || "").startsWith(prefix));

  const totali = {};
  let entrate = 0, spese = 0, mutuo = 0;

  for(const m of delmese){
    if(m.tipo === "entrata"){
      entrate += m.importo;
    } else if(m.tipo === "mutuo"){
      mutuo += m.importo;
      spese += m.importo;
      totali["Mutuo"] = (totali["Mutuo"] || 0) + m.importo;
    } else {
      spese += m.importo;
      const key = m.macro || "Altro";
      totali[key] = (totali[key] || 0) + m.importo;
    }
  }

  const ul = $("#totali-macro");
  ul.innerHTML = "";
  const order = ["Sopravvivenza","Optional","Cultura","Extra","Mutuo","Altro"];
  let printed = false;
  for(const k of order){
    if(totali[k] > 0){
      const li = document.createElement("li");
      li.textContent = \`\${k}: € \${totali[k].toFixed(2)}\`;
      ul.appendChild(li);
      printed = true;
    }
  }
  if(!printed){
    const li = document.createElement("li");
    li.textContent = "Nessuna spesa registrata nel mese selezionato.";
    ul.appendChild(li);
  }

  const saldo = entrate - spese;
  $("#saldo-mese").textContent = \`Entrate: € \${entrate.toFixed(2)} – Spese: € \${spese.toFixed(2)} → Saldo: € \${saldo.toFixed(2)}\`;
}
inputMese.addEventListener("change", aggiornaRiepilogo);