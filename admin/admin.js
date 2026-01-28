(() => {
  "use strict";
  const $ = (s, el=document) => el.querySelector(s);

  const tbody = $("#tbody");
  const search = $("#search");
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

  const f_nombre = $("#f_nombre");
  const f_categoria = $("#f_categoria");
  const f_unidad = $("#f_unidad");
  const f_precio = $("#f_precio");
  const f_stock = $("#f_stock");
  const f_destacado = $("#f_destacado");
  const f_img = $("#f_img");

  let productos = [];
  let editingId = null;

  function uid(){ return "p" + Math.random().toString(16).slice(2,10); }
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
    editingId = null;
  }

  function normalize(p){
    return {
      id: String(p.id || uid()),
      nombre: String(p.nombre || "").trim(),
      categoria: String(p.categoria || "General").trim(),
      unidad: p.unidad === "kg" ? "kg" : "unidad",
      precio: Number(p.precio || 0),
      stock: Boolean(p.stock),
      destacado: Boolean(p.destacado),
      img: p.img ? String(p.img) : ""
    };
  }

  function render(){
    const q = (search.value || "").trim().toLowerCase();
    const list = productos.filter(p=>{
      if (!q) return true;
      return (p.nombre + " " + p.categoria).toLowerCase().includes(q);
    });

    tbody.innerHTML = list.map(p => `
      <tr data-id="${escapeHtml(p.id)}">
        <td data-label="Nombre">${escapeHtml(p.nombre)}</td>

        <td data-label="Categoría">${escapeHtml(p.categoria)}</td>

        <td data-label="Unidad">${p.unidad === "kg" ? "kg" : "unidad/atado"}</td>

        <td data-label="Precio">$${Math.round(p.precio).toLocaleString("es-AR")}</td>

        <td data-label="Stock">
          ${p.stock ? '<span class="badge ok">Sí</span>' : '<span class="badge off">No</span>'}
        </td>

        <td data-label="Destacado">
          ${p.destacado ? '<span class="badge ok">Sí</span>' : '<span class="badge">No</span>'}
        </td>

        <td data-label="Img (ruta)" class="${p.img ? "" : "is-empty"}">
          <span class="muted">${escapeHtml(p.img || "")}</span>
        </td>

        <td data-label="Acción">
          <div class="row-actions">
            <button class="icon btnEdit" title="Editar">✎</button>
          </div>
        </td>
      </tr>
    `).join("");

    tbody.querySelectorAll(".btnEdit").forEach(btn=>{
      btn.addEventListener("click", (e)=>{
        const id = e.target.closest("tr").getAttribute("data-id");
        edit(id);
      });
    });
  }

  function fillForm(p){
    f_nombre.value = p.nombre;
    f_categoria.value = p.categoria;
    f_unidad.value = p.unidad;
    f_precio.value = String(Math.round(p.precio));
    f_stock.checked = !!p.stock;
    f_destacado.checked = !!p.destacado;
    f_img.value = p.img || "";
  }

  function readForm(){
    const nombre = f_nombre.value.trim();
    if (!nombre){ alert("Nombre requerido"); return null; }

    const precio = Number(f_precio.value);
    if (!Number.isFinite(precio) || precio < 0){
      alert("Precio inválido");
      return null;
    }

    return normalize({
      id: editingId || uid(),
      nombre,
      categoria: f_categoria.value.trim() || "General",
      unidad: f_unidad.value === "kg" ? "kg" : "unidad",
      precio,
      stock: f_stock.checked,
      destacado: f_destacado.checked,
      img: f_img.value.trim()
    });
  }

  function newProduct(){
    editingId = null;
    btnDelete.hidden = true;
    fillForm(normalize({ id: uid(), stock:true, destacado:false, unidad:"kg", precio:0 }));
    openModal("Nuevo producto");
  }

  function edit(id){
    const p = productos.find(x=>x.id===id);
    if (!p) return;
    editingId = id;
    btnDelete.hidden = false;
    fillForm(p);
    openModal("Editar producto");
  }

  function save(){
    const p = readForm();
    if (!p) return;

    const idx = productos.findIndex(x=>x.id===p.id);
    if (idx >= 0) productos[idx] = p;
    else productos.unshift(p);

    closeModal();
    render();
  }

  function del(){
    if (!editingId) return;
    if (!confirm("¿Eliminar este producto?")) return;

    productos = productos.filter(p=>p.id!==editingId);
    closeModal();
    render();
  }

  function exportJson(){
    const blob = new Blob([JSON.stringify(productos, null, 2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "productos.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
  }

  function importJson(file){
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const arr = JSON.parse(reader.result);
        if (!Array.isArray(arr)) throw new Error("Formato inválido");
        productos = arr.map(normalize);
        render();
      }catch(e){
        alert("No se pudo importar: " + e.message);
      }
    };
    reader.readAsText(file);
  }

  async function init(){
    btnAdd.addEventListener("click", newProduct);
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
    search.addEventListener("input", render);

    try{
      const res = await fetch("../data/productos.json", {cache:"no-store"});
      if (!res.ok) throw new Error("No se pudo cargar productos.json");
      const arr = await res.json();
      productos = Array.isArray(arr) ? arr.map(normalize) : [];
      render();
    }catch(e){
      productos = [];
      render();
      alert("No se pudo cargar ../data/productos.json. Si abrís con file:// puede fallar. Subilo a un hosting.");
    }
  }

  init();
})();
