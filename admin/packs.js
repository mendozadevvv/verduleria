(() => {
  "use strict";
  const $ = (s, el=document) => el.querySelector(s);

  const tbody = $("#tbody");
  const btnAdd = $("#btnAdd");
  const btnExport = $("#btnExport");
  const btnImport = $("#btnImport");
  const fileInput = $("#fileInput");

  const modal = $("#modal");
  const backdrop = $("#modalBackdrop");
  const btnClose = $("#btnClose");
  const btnCancel = $("#btnCancel");
  const btnSave = $("#btnSave");
  const btnDelete = $("#btnDelete");
  const modalTitle = $("#modalTitle");

  const f_id = $("#f_id");
  const f_nombre = $("#f_nombre");
  const f_descripcion = $("#f_descripcion");
  const f_items = $("#f_items");

  let packs = [];
  let editingIdx = -1;

  function escapeHtml(s){
    return String(s)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function openModal(title){
    modalTitle.textContent = title;
    backdrop.hidden = false;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeModal(){
    backdrop.hidden = true;
    modal.hidden = true;
    document.body.style.overflow = "";
    editingIdx = -1;
  }

  function normalize(pk){
    const items = Array.isArray(pk.items) ? pk.items : [];
    return {
      id: String(pk.id || "pack-" + Math.random().toString(16).slice(2,8)),
      nombre: String(pk.nombre || "Pack").trim(),
      descripcion: String(pk.descripcion || "").trim(),
      items: items.map(it=>({
        id: String(it.id||"").trim(),
        qty: Number(it.qty||0)
      })).filter(it=>it.id && it.qty > 0)
    };
  }

  function render(){
    tbody.innerHTML = packs.map((pk, idx)=>{
      const count = (pk.items||[]).length;
      return `
        <tr data-idx="${idx}">
          <td data-label="Nombre">${escapeHtml(pk.nombre)}</td>
          <td data-label="ID"><span class="muted">${escapeHtml(pk.id)}</span></td>
          <td data-label="Items">${count}</td>
          <td data-label="Descripción"><span class="muted">${escapeHtml(pk.descripcion||"")}</span></td>
          <td data-label="Acción"><div class="row-actions"><button class="icon btnEdit" title="Editar">✎</button></div></td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll(".btnEdit").forEach(btn=>{
      btn.addEventListener("click", (e)=>{
        const idx = Number(e.target.closest("tr").getAttribute("data-idx"));
        edit(idx);
      });
    });
  }

  function fillForm(pk){
    f_id.value = pk.id || "";
    f_nombre.value = pk.nombre || "";
    f_descripcion.value = pk.descripcion || "";
    f_items.value = JSON.stringify(pk.items || [], null, 2);
  }

  function readForm(){
    const id = (f_id.value||"").trim();
    const nombre = (f_nombre.value||"").trim();
    if (!id || !nombre){ alert("ID y nombre requeridos"); return null; }

    let items = [];
    try{
      items = JSON.parse(f_items.value || "[]");
      if (!Array.isArray(items)) throw new Error("items debe ser array");
    }catch(e){
      alert("Items inválidos (JSON): " + e.message);
      return null;
    }

    return normalize({
      id,
      nombre,
      descripcion: (f_descripcion.value||"").trim(),
      items
    });
  }

  function newPack(){
    editingIdx = -1;
    btnDelete.hidden = true;
    fillForm(normalize({ id:"pack-", nombre:"", descripcion:"", items:[] }));
    openModal("Nuevo pack");
  }

  function edit(idx){
    const pk = packs[idx];
    if (!pk) return;
    editingIdx = idx;
    btnDelete.hidden = false;
    fillForm(pk);
    openModal("Editar pack");
  }

  function save(){
    const pk = readForm();
    if (!pk) return;

    if (editingIdx >= 0) packs[editingIdx] = pk;
    else packs.unshift(pk);

    closeModal();
    render();
  }

  function del(){
    if (editingIdx < 0) return;
    if (!confirm("¿Eliminar este pack?")) return;
    packs.splice(editingIdx, 1);
    closeModal();
    render();
  }

  function exportJson(){
    const blob = new Blob([JSON.stringify(packs, null, 2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "packs.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
  }

  function importJson(file){
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const arr = JSON.parse(String(reader.result||"[]"));
        if (!Array.isArray(arr)) throw new Error("Formato inválido");
        packs = arr.map(normalize);
        render();
      }catch(e){
        alert("No se pudo importar: " + e.message);
      }
    };
    reader.readAsText(file);
  }

  async function init(){
    btnAdd.addEventListener("click", newPack);
    btnExport.addEventListener("click", exportJson);
    btnImport.addEventListener("click", ()=>fileInput.click());

    fileInput.addEventListener("change", (e)=>{
      const f = e.target.files && e.target.files[0];
      if (f) importJson(f);
      fileInput.value = "";
    });

    btnClose.addEventListener("click", closeModal);
    btnCancel.addEventListener("click", closeModal);
    backdrop.addEventListener("click", closeModal);
    btnSave.addEventListener("click", save);
    btnDelete.addEventListener("click", del);

    try{
      const res = await fetch("../data/packs.json", {cache:"no-store"});
      if (res.ok){
        const json = await res.json();
        packs = Array.isArray(json) ? json.map(normalize) : [];
      } else packs = [];
    }catch{ packs = []; }

    render();
  }

  init();
})();
