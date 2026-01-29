(() => {
  "use strict";
  const $ = (s, el=document) => el.querySelector(s);

  const btnExport = $("#btnExport");
  const btnImport = $("#btnImport");
  const fileInput = $("#fileInput");

  const fields = {
    business_name: $("#business_name"),
    whatsapp_phone: $("#whatsapp_phone"),
    order_mode: $("#order_mode"),
    headline: $("#headline"),
    lead: $("#lead"),
    micro_note: $("#micro_note")
  };

  const DEFAULTS = {
    business_name: "Verdulería Natural",
    whatsapp_phone: "549000000000",
    order_mode: "pickup",
    headline: "Armá tu pedido en 1 minuto. Fresco todos los días.",
    lead: "Elegí frutas y verduras por kg o unidad/atado. Te confirmamos por WhatsApp y lo preparamos.",
    micro_note: "Catálogo actualizado con stock, destacados y ofertas."
  };

  function readForm(){
    const out = {
      business_name: (fields.business_name.value||"").trim() || DEFAULTS.business_name,
      whatsapp_phone: (fields.whatsapp_phone.value||"").trim() || DEFAULTS.whatsapp_phone,
      order_mode: fields.order_mode.value || DEFAULTS.order_mode,
      headline: (fields.headline.value||"").trim() || DEFAULTS.headline,
      lead: (fields.lead.value||"").trim() || DEFAULTS.lead,
      micro_note: (fields.micro_note.value||"").trim() || DEFAULTS.micro_note
    };

    // Basic validate phone
    if (!/^\d{8,15}$/.test(out.whatsapp_phone)){
      alert("WhatsApp inválido. Usá solo números, sin +. Ej: 549261XXXXXXXX");
      return null;
    }
    return out;
  }

  function fillForm(cfg){
    const c = { ...DEFAULTS, ...(cfg||{}) };
    fields.business_name.value = c.business_name;
    fields.whatsapp_phone.value = c.whatsapp_phone;
    fields.order_mode.value = c.order_mode;
    fields.headline.value = c.headline;
    fields.lead.value = c.lead;
    fields.micro_note.value = c.micro_note;
  }

  function exportJson(){
    const cfg = readForm();
    if (!cfg) return;
    const blob = new Blob([JSON.stringify(cfg, null, 2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "config.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
  }

  function importJson(file){
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const json = JSON.parse(String(reader.result||"{}"));
        if (!json || typeof json !== "object") throw new Error("Formato inválido");
        fillForm(json);
      }catch(e){
        alert("No se pudo importar: " + e.message);
      }
    };
    reader.readAsText(file);
  }

  async function init(){
    btnExport.addEventListener("click", exportJson);
    btnImport.addEventListener("click", ()=>fileInput.click());
    fileInput.addEventListener("change", (e)=>{
      const f = e.target.files && e.target.files[0];
      if (f) importJson(f);
      fileInput.value = "";
    });

    try{
      const res = await fetch("../data/config.json", {cache:"no-store"});
      if (res.ok){
        const json = await res.json();
        fillForm(json);
        return;
      }
    }catch{}

    fillForm(DEFAULTS);
  }

  init();
})();
