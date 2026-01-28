/* =========================================================
   Verdulería Pack — app.js (sin librerías)
   - Catálogo desde data/productos.json
   - Carrito liviano en localStorage
   - Pedido WhatsApp (solo retiro)
   ========================================================= */
(() => {
  "use strict";
  // ✅ REEMPLAZÁ ESTE NÚMERO por el WhatsApp real (formato internacional sin +)
  // Ej: Argentina Mendoza: 549261XXXXXXXX
  const WHATSAPP_PHONE = "549000000000";
  const CART_KEY = "vn_cart_v1";
  const UI_KEY = "vn_ui_v1";
  const $ = (sel, el = document) => el.querySelector(sel);

  const elGrid = $("#gridProducts");
  const elQ = $("#q");
  const elCat = $("#cat");
  const elOnly = $("#only");
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
  const note = $("#note");
  const btnWhatsApp = $("#btnWhatsApp");
  const btnClearCart = $("#btnClearCart");

  const yearEl = $("#year");

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
  function cartCount(){ return Object.keys(cart).length; }
  function cartTotal(){
    let total = 0;
    for (const id of Object.keys(cart)) {
      const p = productos.find(x => x.id === id);
      if (!p) continue;
      total += (p.precio * cart[id].qty);
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
      if (state.only==="con-stock" && !p.stock) return false;
      if (state.cat!=="all" && p.categoria!==state.cat) return false;
      if (!q) return true;
      return (p.nombre + " " + p.categoria).toLowerCase().includes(q);
    });
  }

  function productCard(p){
    const img = p.img ? p.img : "img/no-image.svg";
    const unitLabel = p.unidad === "kg" ? "kg" : "u./atado";
    const badge = p.stock ? `<span class="badge ok">En stock</span>` : `<span class="badge off">Sin stock</span>`;
    const inCartQty = cart[p.id]?.qty || 0;
    return `
      <article class="card" data-id="${escapeHtml(p.id)}">
        <div class="card-top">
          <img src="${escapeHtml(img)}" alt="${escapeHtml(p.nombre)}" loading="lazy" />
          ${p.destacado ? '<span class="badge ok" style="right:12px;left:auto">★ Destacado</span>' : ""}
          ${badge}
        </div>
        <div class="card-body">
          <div class="card-title">
            <h3 class="h3">${escapeHtml(p.nombre)}</h3>
            <div style="text-align:right">
              <div class="price">${moneyARS(p.precio)}</div>
              <div class="unit">por ${unitLabel}</div>
            </div>
          </div>

          <div class="meta">
            <span>• ${escapeHtml(p.categoria)}</span>
            <span>• ${p.unidad === "kg" ? "Se pesa" : "Por unidad/atado"}</span>
          </div>

          <div class="card-actions">
            <div class="qty" aria-label="Cantidad">
              <button type="button" class="qty-minus" ${p.stock ? "" : "disabled"} aria-label="Restar">−</button>
              <span class="qty-value">${inCartQty ? qtyFormat(inCartQty, p.unidad) : "—"}</span>
              <button type="button" class="qty-plus" ${p.stock ? "" : "disabled"} aria-label="Sumar">+</button>
            </div>

            <button class="btn btn-primary btn-add" type="button" ${p.stock ? "" : "disabled"}>
              ${inCartQty ? "Actualizar" : "Agregar"}
            </button>
          </div>

          <div class="muted" style="font-size:.92rem">${p.stock ? "Listo para preparar." : "Volvé a mirar más tarde."}</div>
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
        else { cart[p.id] = { qty: q }; value.textContent=qtyFormat(q,p.unidad); add.textContent="Actualizar"; }
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
        saveCart(); updateCartUI(); render();
      });

      node.querySelector(".c-plus")?.addEventListener("click", ()=>{
        const curr = cart[id]?.qty || 0;
        const next = p.unidad==="kg" ? +(curr+step).toFixed(2) : Math.round(curr+step);
        cart[id] = { qty: next<min ? min : next };
        saveCart(); updateCartUI(); render();
      });

      node.querySelector(".c-remove")?.addEventListener("click", ()=>{
        delete cart[id];
        saveCart(); updateCartUI(); render();
      });
    });
  }

  function updateCartUI(){
    elCartCount.textContent = String(cartCount());
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
      const sub = p.precio * item.qty;
      return `
        <div class="cart-item" data-id="${escapeHtml(id)}">
          <div class="cart-row">
            <div>
              <div class="cart-name">${escapeHtml(p.nombre)}</div>
              <div class="cart-sub">${moneyARS(p.precio)} / ${unitLabel} • ${escapeHtml(p.categoria)}</div>
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
    lines.push("Hola! Quiero hacer un pedido para RETIRO:");
    lines.push("");
    let total = 0;
    for (const id of ids){
      const p = productos.find(x=>x.id===id);
      if (!p) continue;
      const q = cart[id].qty;
      const sub = p.precio * q;
      total += sub;
      const unitLabel = p.unidad==="kg" ? "kg" : "u./atado";
      const qtyTxt = p.unidad==="kg" ? q.toFixed(2).replace(".", ",") : String(Math.round(q));
      lines.push(`• ${p.nombre} (${unitLabel}): ${qtyTxt} × ${moneyARS(p.precio)} = ${moneyARS(sub)}`);
    }
    lines.push("");
    lines.push(`Total estimado: ${moneyARS(total)}`);
    lines.push("");

    const name = (buyerName.value||"").trim();
    const time = (pickupTime.value||"").trim();
    const n = (note.value||"").trim();
    if (name) lines.push(`Nombre: ${name}`);
    if (time) lines.push(`Horario retiro: ${time}`);
    if (n) lines.push(`Nota: ${n}`);
    lines.push(""); lines.push("Gracias!");
    return lines.join("\n");
  }

  function sendWhatsApp(){
    if (!Object.keys(cart).length){ alert("Tu pedido está vacío."); return; }
    if (WHATSAPP_PHONE === "549000000000"){ alert("Falta configurar el número de WhatsApp en js/app.js (WHATSAPP_PHONE)."); return; }
    const text = buildWhatsAppText();
    const url = `https://wa.me/${encodeURIComponent(WHATSAPP_PHONE)}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function init(){
    yearEl.textContent = String(new Date().getFullYear());
    loadUI(); loadCart();
    elQ.value = state.q; elOnly.value = state.only;

    btnOpenCart.addEventListener("click", openCart);
    btnCloseCart.addEventListener("click", closeCart);
    backdrop.addEventListener("click", closeCart);
    document.addEventListener("keydown", (e)=>{ if (e.key==="Escape" && !drawer.hidden) closeCart(); });

    btnWhatsApp.addEventListener("click", sendWhatsApp);
    btnClearCart.addEventListener("click", ()=>{
      if (!confirm("¿Vaciar el pedido?")) return;
      cart = {}; saveCart(); updateCartUI(); render();
    });

    btnClear.addEventListener("click", ()=>{
      state = { q:"", cat:"all", only:"all" };
      elQ.value=""; elOnly.value="all"; elCat.value="all";
      saveUI(); render();
    });

    elQ.addEventListener("input", ()=>{ state.q = elQ.value; saveUI(); render(); });
    elOnly.addEventListener("change", ()=>{ state.only = elOnly.value; saveUI(); render(); });
    elCat.addEventListener("change", ()=>{ state.cat = elCat.value; saveUI(); render(); });

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
        stock:Boolean(p.stock),
        destacado:Boolean(p.destacado),
        img:p.img ? String(p.img) : ""
      }));
      ensureCategories();
      elCat.value = state.cat;
      render();
      updateCartUI();
    }catch(err){
      console.error(err);
      elGrid.innerHTML = `<div class="notice" style="grid-column:1/-1"><div class="notice-title">Error cargando catálogo</div><div class="notice-body">Revisá que exista <code>data/productos.json</code> y que el hosting permita fetch.</div></div>`;
    }
  }
  init();
})();
