/* Kakebo v3.8.2 — HOTFIX macro select
   - Forza tipo='spesa' al boot
   - Gestione robusta enable/disable macro/categoria
   - Ripopolamento sempre affidabile */
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

// Riferimenti
const inputData=$("#data"), inputImporto=$("#importo"), selTipo=$("#tipo"), selMacro=$("#macro"), selCat=$("#categoria"), inputNota=$("#nota");

// --- Boot sicuro ---
(function boot(){
  if (inputData) inputData.value = todayStr();
  // Forza sempre 'spesa' all'avvio per evitare stato "mutuo" ereditato dal SW/PWA
  if (selTipo) selTipo.value = "spesa";
  refreshMacroETree();
  // Eventi
  selTipo?.addEventListener("change", refreshMacroETree);
  selMacro?.addEventListener("change", refreshCategorie);
})();

function enableSelect(el){ if(!el) return; el.removeAttribute("disabled"); el.classList.remove("disabled"); }
function disableSelect(el){ if(!el) return; el.setAttribute("disabled","disabled"); el.classList.add("disabled"); }

function refreshMacroETree(){
  if(!selTipo || !selMacro || !selCat) return;
  const tipo = selTipo.value;
  selMacro.innerHTML = "";
  selCat.innerHTML = "";

  if (tipo === "mutuo"){
    disableSelect(selMacro); disableSelect(selCat);
    const o1=document.createElement("option"); o1.value=""; o1.textContent="— (non richiesto)"; selMacro.appendChild(o1);
    const o2=document.createElement("option"); o2.value=""; o2.textContent="— (non richiesto)"; selCat.appendChild(o2);
    return;
  }
  enableSelect(selMacro); enableSelect(selCat);

  const macros = (tipo==="entrata") ? ["Entrate"] : ["Sopravvivenza","Optional","Cultura","Extra"];
  for(const m of macros){ const o=document.createElement("option"); o.value=m; o.textContent=m; selMacro.appendChild(o); }
  refreshCategorie();
  // Se per qualche motivo non ha popolato, riprova una volta dopo un tick (SW/PWA race)
  if(!selMacro.options.length){
    setTimeout(()=>{
      for(const m of macros){ const o=document.createElement("option"); o.value=m; o.textContent=m; selMacro.appendChild(o); }
      refreshCategorie();
    },0);
  }
}

function refreshCategorie(){
  if(!selMacro || !selCat) return;
  selCat.innerHTML = "";
  const macro = selMacro.value;
  (CATEGORIE[macro]||[]).forEach(v=>{
    const o=document.createElement("option"); o.value=v; o.textContent=v; selCat.appendChild(o);
  });
}

// ---- Il resto del file originale rimane invariato ----
