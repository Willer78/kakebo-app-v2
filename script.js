// Kakebo v3.8.3-b — HOTFIX Macro selezione
document.addEventListener("DOMContentLoaded", () => {
  const CATEGORIE = {
    Sopravvivenza:["Alimentazione","Farmacia","Cane","Telefono fisso","Acqua","Gas","Elettricità","Auto","Moto"],
    Optional:["Ristorante","Spese di casa","Cosmesi/ capelli","Shopping","Sport","Cellulare"],
    Cultura:["Libri","Musica","Scuola Eva","Scuola Elena"],
    Extra:["Viaggi","Regali","Spese casa grandi"],
    Entrate:["Stipendio","Assegni familiari","Fotovoltaico","Altre entrate"]
  };
  const $=s=>document.querySelector(s);
  const pad=n=>String(n).padStart(2,"0");
  const todayStr=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};

  const inputData=$("#data"), selTipo=$("#tipo"), selMacro=$("#macro"), selCat=$("#categoria");

  function enable(el){ if(el){ el.disabled=false; el.removeAttribute("disabled"); } }
  function disable(el){ if(el){ el.disabled=true; el.setAttribute("disabled","disabled"); } }

  function refreshCategorie(){
    if(!selCat||!selMacro) return;
    selCat.innerHTML="";
    (CATEGORIE[selMacro.value]||[]).forEach(v=>{
      const o=document.createElement("option"); o.value=v; o.textContent=v; selCat.appendChild(o);
    });
  }

  function refreshMacroETree(){
    if(!selTipo||!selMacro||!selCat) return;
    const tipo=selTipo.value;
    console.log("[Kakebo] Tipo rilevato:", tipo);
    selMacro.innerHTML=""; selCat.innerHTML="";
    if(tipo==="mutuo"){
      disable(selMacro); disable(selCat);
      const o=document.createElement("option"); o.value=""; o.textContent="— (non richiesto)"; selMacro.appendChild(o);
      const o2=document.createElement("option"); o2.value=""; o2.textContent="— (non richiesto)"; selCat.appendChild(o2);
      return;
    }
    enable(selMacro); enable(selCat);
    const macros=(tipo==="entrata")?["Entrate"]:["Sopravvivenza","Optional","Cultura","Extra"];
    macros.forEach(m=>{ const o=document.createElement("option"); o.value=m; o.textContent=m; selMacro.appendChild(o); });
    refreshCategorie();
  }

  // BOOT: imposta data e forza sempre 'spesa'
  if(inputData) inputData.value=todayStr();
  if(selTipo){ selTipo.value="spesa"; }            // imposta
  setTimeout(()=>{                                  // dispatch e refresh (due volte per sicurezza)
    if(selTipo){ selTipo.dispatchEvent(new Event("change")); }
    refreshMacroETree();
    // assicurati che macro/categoria siano abilitati se non è mutuo
    if(selTipo && selTipo.value!=="mutuo"){ enable(selMacro); enable(selCat); }
  }, 0);

  // Event listeners
  selTipo?.addEventListener("change", ()=>{
    refreshMacroETree();
    if(selTipo.value!=="mutuo"){ enable(selMacro); enable(selCat); }
  });
  selMacro?.addEventListener("change", refreshCategorie);
});
