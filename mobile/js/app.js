//

  function syncOnlyChips(){
    if (!elOnlyChips || !elOnlyChips.length) return;
    elOnlyChips.forEach(btn=>{
      const v = btn.getAttribute("data-only");
      btn.classList.toggle("is-active", v===state.only);
      btn.setAttribute("aria-pressed", v===state.only ? "true":"false");
    });
  }
  function setOnly(v){
    state.only = v || "all";
    saveUI();
    syncOnlyChips();
    render();
  }
/* =========================================================
   Verdulería Pack — app.js (sin librerías)
   - Catálogo desde data/productos.json
   - Carrito liviano en localStorage
   - Pedido WhatsApp (solo retiro)
   ========================================================= */
(() => {
  "use strict";
  // ✅ Configurable (sin backend): editás /data/config.json desde el Admin.
  // whatsapp_phone (sin +): ej Argentina Mendoza => 549261XXXXXXXX
  const DEFAULT_CONFIG = {
    business_name: "Verdulería Natural",
    whatsapp_phone: "549000000000",
    order_mode: "pickup", // pickup | delivery | both
    headline: "Armá tu pedido en 1 minuto. Fresco todos los días.",
    lead: "Elegí frutas y verduras por kg o unidad/atado. Te confirmamos por WhatsApp y lo preparamos.",
    micro_note: "Catálogo actualizado con stock, destacados y ofertas.",
    currency: "ARS"
  };

  const CONFIG_URL = "data/config.json";
  const PACKS_URL = "data/packs.json";
  const CART_KEY = "vn_cart_v1";
  const UI_KEY = "vn_ui_v1";
  const $ = (sel, el = document) => el.querySelector(sel);

  const elGrid = $("#gridProducts");
  const elQ = $("#q");
  const elCat = $("#cat");
  const elOnlyChips = document.querySelectorAll('[data-only]');
  const btnClear = $("#btnClear");

  const btnOpenCart = $("#btnOpenCart");
  const btnCloseCart = $("#btnCloseCart");
  const drawer = $("#cartDrawer");
  const backdrop = $("#drawerBackdrop");

  const elCartCount = $("#cartCount");
  const elCartItems = $("#cartItems");
  const elCartTotal = $("#cartTotal");

  const buyerName = $("#buyerName");
  const pickupTime = $("#pickupTime");
  const addressWrap = $("#addressWrap");
  const address = $("#address");
  const note = $("#note");
  const btnWhatsApp = $("#btnWhatsApp");
  const btnClearCart = $("#btnClearCart");

  // Hero / micro proof
  const heroKicker = $("#heroKicker");
  const heroTitle = $("#heroTitle");
  const heroLead = $("#heroLead");
  const lastUpdate = $("#lastUpdate");
  const skuCount = $("#skuCount");
  const catalogLead = $("#catalogLead");
  const drawerModeTitle = $("#drawerModeTitle");

  // Packs
  const packsEl = $("#packs");

  // Mobile bar
  const mobileBar = $("#mobileBar");
  const btnOpenCart2 = $("#btnOpenCart2");
  const btnWhatsApp2 = $("#btnWhatsApp2");
  const elCartCount2 = $("#cartCount2");

  const yearEl = $("#year");

  let config = { ...DEFAULT_CONFIG };
  let packs = [];

  let productos = [];
  let state = { q: "", cat: "all", only: "all" };
  let cart = {};

  function moneyARS(n) {
    try { return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }); }
    catch { return "$" + Math.round(n); }
  }

  function loadCart(){ try { cart = JSON.parse(localStorage.getItem(CART_KEY) || "{}") || {}; } catch { cart = {}; } }
  function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
  function loadUI(){ try { const u = JSON.parse(localStorage.getItem(UI_KEY) || "{}") || {}; if (typeof u.q==="string") state.q=u.q; if (typeof u.cat==="string") state.cat=u.cat; if (typeof u.only==="string") state.only=u.only; } catch {} }
  function saveUI(){ localStorage.setItem(UI_KEY, JSON.stringify(state)); }

  function qtyStepFor(unit){ return unit === "kg" ? 0.25 : 1; }
  function qtyMinFor(unit){ return unit === "kg" ? 0.25 : 1; }
  function qtyFormat(qty, unit){ return unit === "kg" ? qty.toFixed(2).replace(".", ",") + " kg" : String(Math.round(qty)) + " u."; }
  function effectivePrice(p){
    const hasOffer = p.oferta && Number.isFinite(p.precio_oferta) && p.precio_oferta > 0 && p.precio_oferta < p.precio;
    return hasOffer ? p.precio_oferta : p.precio;
  }
  function cartCount(){ return Object.keys(cart).length; }
  function cartTotal(){
    let total = 0;
    for (const id of Object.keys(cart)) {
      const p = productos.find(x => x.id === id);
      if (!p) continue;
      total += (effectivePrice(p) * cart[id].qty);
    }
    return total;
  }
  function escapeHtml(s){
    return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }

  function ensureCategories(){
    const cats = Array.from(new Set(productos.map(p => p.categoria))).sort((a,b)=>a.localeCompare(b,"es"));
    const current = state.cat;
    elCat.innerHTML = '<option value="all">Todas</option>' + cats.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    if (cats.includes(current) || current==="all") elCat.value = current; else elCat.value = "all";
  }

  function filteredProducts(){
    const q = state.q.trim().toLowerCase();
    return productos.filter(p=>{
      if (state.only==="destacados" && !p.destacado) return false;
      if (state.only==="ofertas" && !p.oferta) return false;
      if (state.only==="mas-vendidos" && !p.mas_vendido) return false;
      if (state.only==="con-stock" && !p.stock) return false;
      if (state.cat!=="all" && p.categoria!==state.cat) return false;
      if (!q) return true;
      return (p.nombre + " " + p.categoria).toLowerCase().includes(q);
    });
  }

  function productCard(p){
    const img = p.img ? p.img : "../assets/img/no-image.svg";
    const unitLabel = (p.unidad === "kg") ? "kg" : "u./atado";
    const hasOffer = (p.oferta && Number(p.precio_oferta||0) > 0);
    const price = hasOffer ? Number(p.precio_oferta||0) : Number(p.precio||0);
    const badge = hasOffer ? `<span class="pill pill-hot">Oferta</span>` : (p.destacado ? `<span class="pill">Destacado</span>` : "");
    const stockDot = p.stock ? `<span class="dot ok" title="En stock"></span>` : `<span class="dot off" title="Sin stock"></span>`;

    return `
      <article class="card ${p.stock ? "" : "is-off"}" data-id="${esc(p.id)}">
        <div class="card-media">
          <img src="${esc(img)}" alt="${esc(p.nombre)}" loading="lazy" />
          <div class="card-badges">
            ${stockDot}
            ${badge}
          </div>
        </div>

        <div class="card-body">
          <div class="card-top">
            <h3 class="card-title">${esc(p.nombre)}</h3>
            <div class="card-price">
              <span class="price">$${money(price)}</span>
              <span class="unit">/ ${unitLabel}</span>
            </div>
          </div>

          <div class="card-actions">
            <div class="qty">
              <button class="qty-btn" data-act="dec" type="button" aria-label="Quitar">−</button>
              <input class="qty-inp" inputmode="decimal" pattern="[0-9.,]*" value="${money(cartQty(p.id), false)}" aria-label="Cantidad" />
              <button class="qty-btn" data-act="inc" type="button" aria-label="Agregar">+</button>
            </div>
            <button class="btn btn-primary btn-add" data-act="add" type="button">Agregar</button>
          </div>
        </div>
      </article>
    `;
  }

  function wireProductButtons(list){
    for (const p of list){
      const card = elGrid.querySelector(`article[data-id="${CSS.escape(p.id)}"]`);
      if (!card) continue;
      const minus = card.querySelector(".qty-minus");
      const plus = card.querySelector(".qty-plus");
      const add = card.querySelector(".btn-add");
      const value = card.querySelector(".qty-value");
      const step = qtyStepFor(p.unidad);
      const min = qtyMinFor(p.unidad);

      function setQty(q){
        if (q <= 0){ delete cart[p.id]; value.textContent="—"; add.textContent="Agregar"; }
        else { cart[p.id] = { qty: q }; value.textContent=qtyFormat(q,p.unidad); add.textContent="Agregar"; }
        saveCart(); updateCartUI();
      }

      minus?.addEventListener("click", ()=>{
        const curr = cart[p.id]?.qty || 0;
        const next = p.unidad==="kg" ? Math.max(0, +(curr-step).toFixed(2)) : Math.max(0, Math.round(curr-step));
        if (next>0 && next<min) setQty(min); else setQty(next);
      });
      plus?.addEventListener("click", ()=>{
        const curr = cart[p.id]?.qty || 0;
        const next = p.unidad==="kg" ? +(curr+step).toFixed(2) : Math.round(curr+step);
        setQty(next<min ? min : next);
      });
      add?.addEventListener("click", ()=>{
        const curr = cart[p.id]?.qty || 0;
        if (!curr) setQty(min); else setQty(curr);
        openCart();
      });
    }
  }

  function render(){
    const list = filteredProducts();
    if (!list.length){
      elGrid.innerHTML = `<div class="notice" style="grid-column:1/-1"><div class="notice-title">No encontramos resultados</div><div class="notice-body">Probá otra búsqueda o limpiá filtros.</div></div>`;
      return;
    }
    elGrid.innerHTML = list.map(productCard).join("");
    wireProductButtons(list);
  }

  function renderSkeleton(){
    const n = 8;
    elGrid.innerHTML = Array.from({length:n}).map(()=>{
      return `
        <article class="card">
          <div class="card-top">
            <div class="skeleton sk-img"></div>
          </div>
          <div class="card-body">
            <div class="skeleton sk-line"></div>
            <div class="skeleton sk-line"></div>
            <div class="skeleton sk-pill"></div>
            <div class="card-actions">
              <div class="qty"><div class="skeleton sk-pill" style="height:32px;width:140px"></div></div>
              <div class="skeleton sk-pill" style="height:40px;width:120px"></div>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderPacks(){
    if (!packsEl) return;
    if (!packs.length){
      packsEl.innerHTML = `<div class="notice"><div class="notice-title">Sin combos</div><div class="notice-body">Podés cargar combos desde Admin → Packs.</div></div>`;
      return;
    }

    packsEl.innerHTML = packs.map(pk=>{
      const items = Array.isArray(pk.items) ? pk.items : [];
      const lines = items.map(it=>{
        const p = productos.find(x=>x.id===String(it.id));
        const name = p ? p.nombre : String(it.id);
        const qty = Number(it.qty||0);
        const unit = p ? (p.unidad==="kg" ? "kg" : "u.") : "";
        return `<li>${escapeHtml(name)} <span class="muted">(${qty}${unit})</span></li>`;
      }).join("");

      return `
        <div class="pack" data-pack="${escapeHtml(pk.id||"")}">
          <div class="pack-head">
            <div>
              <div class="pack-title">${escapeHtml(pk.nombre||"Combo")}</div>
              <div class="muted">${escapeHtml(pk.descripcion||"")}</div>
            </div>
            <button class="btn btn-primary pack-add" type="button">Sumar</button>
          </div>
          <ul class="pack-list">${lines}</ul>
        </div>
      `;
    }).join("");

    packsEl.querySelectorAll(".pack-add").forEach((btn, idx)=>{
      btn.addEventListener("click", ()=>{
        const pk = packs[idx];
        const items = Array.isArray(pk.items) ? pk.items : [];
        for (const it of items){
          const id = String(it.id);
          const p = productos.find(x=>x.id===id);
          if (!p || !p.stock) continue;
          const qty = Number(it.qty||0);
          if (!qty || qty <= 0) continue;
          const current = cart[id]?.qty || 0;
          const next = p.unidad==="kg" ? +(current + qty).toFixed(2) : Math.round(current + qty);
          cart[id] = { qty: next };
        }
        saveCart(); updateCartUI(); syncProductCard(id);
      openCart();
      });
    });
  }

  function syncProductCard(id){
    try{
      if (!elGrid) return;
      const card = elGrid.querySelector(`article[data-id="${CSS.escape(id)}"]`);
      if (!card) return;
      const p = productos.find(x=>x.id===id);
      if (!p) return;
      const value = card.querySelector(".qty-value");
      const add = card.querySelector(".btn-add");
      const q = cart[id]?.qty || 0;
      if (value) value.textContent = q ? qtyFormat(q,p.unidad) : "—";
      if (add) add.textContent = "Agregar"; // siempre
    }catch(e){}
  }

function wireCartButtons(){
    elCartItems.querySelectorAll(".cart-item").forEach(node=>{
      const id = node.getAttribute("data-id");
      const p = productos.find(x=>x.id===id);
      if (!p) return;
      const step = qtyStepFor(p.unidad);
      const min = qtyMinFor(p.unidad);

      node.querySelector(".c-minus")?.addEventListener("click", ()=>{
        const curr = cart[id]?.qty || 0;
        const next = p.unidad==="kg" ? Math.max(0, +(curr-step).toFixed(2)) : Math.max(0, Math.round(curr-step));
        if (next>0 && next<min) cart[id].qty = min;
        else if (next<=0) delete cart[id];
        else cart[id].qty = next;
        saveCart(); updateCartUI(); syncProductCard(id);
      });

      node.querySelector(".c-plus")?.addEventListener("click", ()=>{
        const curr = cart[id]?.qty || 0;
        const next = p.unidad==="kg" ? +(curr+step).toFixed(2) : Math.round(curr+step);
        cart[id] = { qty: next<min ? min : next };
        saveCart(); updateCartUI(); syncProductCard(id);
      });

      node.querySelector(".c-remove")?.addEventListener("click", ()=>{
        delete cart[id];
        saveCart(); updateCartUI(); syncProductCard(id);
      });
    });
  }

  function updateCartUI(){
    elCartCount.textContent = String(cartCount());
    if (elCartCount2) elCartCount2.textContent = String(cartCount());
    const ids = Object.keys(cart);
    if (!ids.length){
      elCartItems.innerHTML = `<div class="notice"><div class="notice-title">Tu pedido está vacío</div><div class="notice-body">Agregá productos del catálogo.</div></div>`;
      elCartTotal.textContent = moneyARS(0);
      return;
    }

    elCartItems.innerHTML = ids.map(id=>{
      const p = productos.find(x=>x.id===id);
      if (!p) return "";
      const item = cart[id];
      const unitLabel = p.unidad==="kg" ? "kg" : "u./atado";
      const unitPrice = effectivePrice(p);
      const sub = unitPrice * item.qty;
      return `
        <div class="cart-item" data-id="${escapeHtml(id)}">
          <div class="cart-row">
            <div>
              <div class="cart-name">${escapeHtml(p.nombre)}</div>
              <div class="cart-sub">${moneyARS(unitPrice)} / ${unitLabel} • ${escapeHtml(p.categoria)}</div>
            </div>
            <div style="text-align:right">
              <div class="cart-name">${moneyARS(sub)}</div>
              <div class="cart-sub">${qtyFormat(item.qty,p.unidad)}</div>
            </div>
          </div>
          <div class="cart-controls">
            <div class="qty" aria-label="Cantidad">
              <button type="button" class="c-minus" aria-label="Restar">−</button>
              <span class="qty-value">${qtyFormat(item.qty,p.unidad)}</span>
              <button type="button" class="c-plus" aria-label="Sumar">+</button>
            </div>
            <button class="btn btn-ghost c-remove" type="button">Quitar</button>
          </div>
        </div>
      `;
    }).join("");

    elCartTotal.textContent = moneyARS(cartTotal());
    wireCartButtons();
  }

  function openCart(){ backdrop.hidden=false; drawer.hidden=false; document.body.style.overflow="hidden"; }
  function closeCart(){ backdrop.hidden=true; drawer.hidden=true; document.body.style.overflow=""; }

  function buildWhatsAppText(){
    const ids = Object.keys(cart);
    let lines = [];
    const mode = config.order_mode || "pickup";
    const modeText = mode === "delivery" ? "ENTREGA" : (mode === "both" ? "RETIRO o ENTREGA" : "RETIRO");
    lines.push(`Hola! Quiero hacer un pedido para ${modeText}:`);
    lines.push("");
    let total = 0;
    for (const id of ids){
      const p = productos.find(x=>x.id===id);
      if (!p) continue;
      const q = cart[id].qty;
      const unitPrice = effectivePrice(p);
      const sub = unitPrice * q;
      total += sub;
      const unitLabel = p.unidad==="kg" ? "kg" : "u./atado";
      const qtyTxt = p.unidad==="kg" ? q.toFixed(2).replace(".", ",") : String(Math.round(q));
      const base = (p.oferta && p.precio_oferta && p.precio_oferta < p.precio) ? ` (OFERTA: ${moneyARS(p.precio)}→${moneyARS(unitPrice)})` : "";
      lines.push(`• ${p.nombre} (${unitLabel}): ${qtyTxt} × ${moneyARS(unitPrice)} = ${moneyARS(sub)}${base}`);
    }
    lines.push("");
    lines.push(`Total estimado: ${moneyARS(total)}`);
    lines.push("");

    const name = (buyerName.value||"").trim();
    const time = (pickupTime.value||"").trim();
    const addr = (address.value||"").trim();
    const n = (note.value||"").trim();
    if (name) lines.push(`Nombre: ${name}`);
    if (time) lines.push(mode === "delivery" ? `Horario aproximado: ${time}` : `Horario retiro: ${time}`);
    if (addr) lines.push(`Dirección: ${addr}`);
    if (n) lines.push(`Nota: ${n}`);
    lines.push(""); lines.push("Gracias!");
    return lines.join("\n");
  }

  function sendWhatsApp(){
    if (!Object.keys(cart).length){ alert("Tu pedido está vacío."); return; }
    const phone = String(config.whatsapp_phone || "").trim();
    if (!phone || phone === "549000000000"){ alert("Falta configurar el número de WhatsApp. Abrí Admin → Configuración y completá whatsapp_phone."); return; }
    const text = buildWhatsAppText();
    const url = `https://wa.me/${encodeURIComponent(phone)}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function loadConfig(){
    try{
      const res = await fetch(CONFIG_URL, { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      if (json && typeof json === "object") config = { ...DEFAULT_CONFIG, ...json };
    }catch{ /* ignore */ }
  }

  function applyConfigToUI(){
    const name = String(config.business_name || DEFAULT_CONFIG.business_name);
    document.title = `${name} — Fresco todos los días`;

    heroTitle && (heroTitle.textContent = String(config.headline || DEFAULT_CONFIG.headline));
    heroLead && (heroLead.innerHTML = escapeHtml(String(config.lead || DEFAULT_CONFIG.lead)).replaceAll("kg", "<strong>kg</strong>").replaceAll("unidad/atado", "<strong>unidad/atado</strong>"));

    const mode = config.order_mode || "pickup";
    const kicker = mode === "delivery" ? "Entrega • WhatsApp" : (mode === "both" ? "Retiro o entrega • WhatsApp" : "Retiro • WhatsApp");
    heroKicker && (heroKicker.textContent = kicker);

    catalogLead && (catalogLead.textContent = "Elegí productos, cantidades y generá el pedido por WhatsApp." + (mode==="pickup" ? " (Retiro)" : mode==="delivery" ? " (Entrega)" : ""));
    drawerModeTitle && (drawerModeTitle.textContent = mode === "delivery" ? "Coordinación de entrega" : (mode==="both" ? "Coordinación (retiro/entrega)" : "Coordinación para retiro"));
    if (addressWrap) addressWrap.hidden = !(mode === "delivery" || mode === "both");
  }

  async function loadPacks(){
    try{
      const res = await fetch(PACKS_URL, { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      packs = Array.isArray(json) ? json : [];
    }catch{ packs = []; }
  }

  async function init(){
    yearEl.textContent = String(new Date().getFullYear());
    loadUI(); loadCart();
    elQ.value = state.q; syncOnlyChips();

    const syncMobileBar = ()=>{
      if (!mobileBar) return;
      const isMobile = window.matchMedia("(max-width: 780px)").matches;
      mobileBar.hidden = !isMobile;
      // Evita que la barra móvil tape el contenido al final
      document.body.classList.toggle("has-mobilebar", isMobile);
    };
    syncMobileBar();
    window.addEventListener("resize", syncMobileBar);

    btnOpenCart.addEventListener("click", openCart);
    btnOpenCart2 && btnOpenCart2.addEventListener("click", openCart);
    btnCloseCart.addEventListener("click", closeCart);
    backdrop.addEventListener("click", closeCart);
    document.addEventListener("keydown", (e)=>{ if (e.key==="Escape" && !drawer.hidden) closeCart(); });

    btnWhatsApp.addEventListener("click", sendWhatsApp);
    btnWhatsApp2 && btnWhatsApp2.addEventListener("click", sendWhatsApp);
    btnClearCart.addEventListener("click", ()=>{
      if (!confirm("¿Vaciar el pedido?")) return;
      cart = {}; saveCart(); updateCartUI(); syncProductCard(id);
      });

    btnClear.addEventListener("click", ()=>{
      state = { q:"", cat:"all", only:"all" };
      elQ.value=""; setOnly("all"); elCat.value="all";
      saveUI(); render();
    });

    elQ.addEventListener("input", ()=>{ state.q = elQ.value; saveUI(); render(); });
    elCat.addEventListener("change", ()=>{ state.cat = elCat.value; saveUI();

  if (elOnlyChips && elOnlyChips.length){
    elOnlyChips.forEach(btn=>{
      btn.addEventListener("click", ()=>{
        setOnly(btn.getAttribute("data-only") || "all");
      });
    });
  }
 render(); });

    // First paint: skeleton + cart counters
    renderSkeleton();
    updateCartUI();

    await loadConfig();
    applyConfigToUI();

    try{
      const res = await fetch("data/productos.json", { cache:"no-store" });
      if (!res.ok) throw new Error("No se pudo cargar productos.json");
      productos = await res.json();
      productos = productos.map(p=>({
        id:String(p.id),
        nombre:String(p.nombre||"").trim(),
        categoria:String(p.categoria||"General").trim(),
        unidad:p.unidad==="kg" ? "kg" : "unidad",
        precio:Number(p.precio||0),
        precio_oferta: Number(p.precio_oferta||0),
        stock:Boolean(p.stock),
        destacado:Boolean(p.destacado),
        nuevo: Boolean(p.nuevo),
        oferta: Boolean(p.oferta),
        mas_vendido: Boolean(p.mas_vendido),
        stock_bajo: Number(p.stock_bajo||0),
        img:p.img ? String(p.img) : ""
      }));

      // Micro proof
      if (skuCount) skuCount.textContent = String(productos.length);
      if (lastUpdate) lastUpdate.textContent = new Date().toLocaleDateString("es-AR", { year:"numeric", month:"short", day:"2-digit" });

      ensureCategories();
      elCat.value = state.cat;
      syncOnlyChips();
      render();
      updateCartUI();

      // Packs
      await loadPacks();
      renderPacks();
    }catch(err){
      console.error(err);
      elGrid.innerHTML = `<div class="notice" style="grid-column:1/-1"><div class="notice-title">Error cargando catálogo</div><div class="notice-body">Revisá que exista <code>data/productos.json</code> y que el hosting permita fetch.</div></div>`;
    }
  }
  init();
})();