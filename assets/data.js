/* =========================================================================
   AGRIMART — SHARED DATA & STATE (assets/data.js)
   Loaded by every page. Cart/Wishlist/Orders/Addresses persist across pages
   using localStorage, since this is now a real multi-page website (not a
   single in-chat preview) — closing/reopening the site keeps your cart.
   ========================================================================= */

const IMG = {
  hero: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=1200&auto=format&fit=crop",
  rice: "https://images.unsplash.com/photo-1568347355280-d33fdf130bad?q=80&w=800&auto=format&fit=crop",
  compost: "https://images.unsplash.com/photo-1585314540083-4a2e6b0b6f6e?q=80&w=800&auto=format&fit=crop",
  npk: "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?q=80&w=800&auto=format&fit=crop",
  drip: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?q=80&w=800&auto=format&fit=crop",
  drill: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=800&auto=format&fit=crop",
  veg: "https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=800&auto=format&fit=crop",
  neem: "https://images.unsplash.com/photo-1615671524827-c1fe3973b648?q=80&w=800&auto=format&fit=crop",
  sprayer: "https://images.unsplash.com/photo-1592982573971-2c0c3e0b6b3a?q=80&w=800&auto=format&fit=crop",
  cultivator: "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?q=80&w=800&auto=format&fit=crop",
  soil: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800&auto=format&fit=crop",
  field: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=1200&auto=format&fit=crop"
};

const CATEGORIES = [
  {id:'seeds', name:'Seeds', icon:'🌱', count:128},
  {id:'fertilizers', name:'Fertilizers', icon:'🧪', count:96},
  {id:'crop-protection', name:'Crop Protection', icon:'🛡️', count:74},
  {id:'tools', name:'Farming Tools', icon:'🔧', count:112},
  {id:'irrigation', name:'Irrigation', icon:'💧', count:53},
  {id:'machinery', name:'Machinery', icon:'🚜', count:41},
  {id:'organic', name:'Organic Products', icon:'🍃', count:87},
  {id:'gardening', name:'Gardening', icon:'🪴', count:65},
];

const SELLERS = [
  {id:'s1', name:'Krishna AgroTraders', location:'Patna, Bihar', rating:4.7, verified:true, products:210},
  {id:'s2', name:'GreenField Organics', location:'Nashik, Maharashtra', rating:4.9, verified:true, products:88},
  {id:'s3', name:'Bharat Farm Supplies', location:'Ludhiana, Punjab', rating:4.5, verified:true, products:156},
  {id:'s4', name:'Sunrise Agro Inputs', location:'Guntur, Andhra Pradesh', rating:4.6, verified:true, products:74},
];

const PRODUCTS = [
  {id:'p1', name:'High Yield Hybrid Rice Seeds (5kg Pack)', brand:'AgriGrow', category:'seeds', seller:'s1', price:850, mrp:1050, rating:4.6, reviews:212, stock:340, img:IMG.rice, badge:'Best Seller',
    desc:'High-yield hybrid paddy seeds bred for strong tillering and disease resistance, suited to both irrigated and rainfed conditions.',
    specs:{'Crop Type':'Paddy (Rice)','Suitable Crops':'Kharif Rice','Pack Size':'5 kg','Germination Rate':'92%','Composition':'Certified Hybrid Seed','Manufacturer':'AgriGrow Seeds Pvt Ltd','Batch No.':'RS-2026-114','Expiry':'12 months from packing'},
    usage:'Sow in nursery beds 25–30 days before transplanting. Maintain 20x15 cm spacing. Suitable for both direct seeding and transplanting.'},
  {id:'p2', name:'Organic Vermicompost (25kg Bag)', brand:'GreenEarth', category:'organic', seller:'s2', price:420, mrp:550, rating:4.8, reviews:340, stock:180, img:IMG.compost, badge:'Organic',
    desc:'100% organic vermicompost made from cow dung and agricultural waste, rich in NPK and micronutrients for healthier soil.',
    specs:{'Crop Type':'All Crops','Application Method':'Soil mixing / top dressing','Dosage':'2–4 tonnes/acre','Pack Size':'25 kg','Composition':'Organic manure, earthworm castings','Manufacturer':'GreenEarth Organics','Certification':'FCO Certified'},
    usage:'Apply during land preparation or as top dressing every 30–45 days. Mix thoroughly into topsoil for best results.'},
  {id:'p3', name:'NPK 19:19:19 Water Soluble Fertilizer (1kg)', brand:'FarmChem', category:'fertilizers', seller:'s3', price:180, mrp:220, rating:4.4, reviews:156, stock:22, img:IMG.npk, badge:'',
    desc:'Balanced water-soluble NPK fertilizer for fertigation and foliar spray, promoting vigorous vegetative growth.',
    specs:{'Crop Type':'All Crops','Application Method':'Fertigation / Foliar Spray','Dosage':'2–3 g/litre water','Pack Size':'1 kg','Composition':'N19-P19-K19','Manufacturer':'FarmChem Industries'},
    usage:'Dissolve completely in water before application. Apply once every 10–15 days during vegetative stage.'},
  {id:'p4', name:'Drip Irrigation Kit (1 Acre)', brand:'AquaFlow', category:'irrigation', seller:'s3', price:8500, mrp:11000, rating:4.7, reviews:98, stock:14, img:IMG.drip, badge:'New',
    desc:'Complete drip irrigation system for 1-acre coverage, including main line, laterals, drippers and filters.',
    specs:{'Coverage':'1 Acre','Pack Contents':'Main pipe, laterals, drippers, filter, connectors','Material':'UV-stabilised HDPE/LLDPE','Warranty':'2 years','Manufacturer':'AquaFlow Irrigation Systems'},
    usage:'Suitable for row crops, orchards and vegetable fields. Professional installation recommended for best water efficiency.'},
  {id:'p5', name:'Manual Seed Drill (Single Row)', brand:'KisanTools', category:'tools', seller:'s1', price:2400, mrp:2900, rating:4.3, reviews:64, stock:38, img:IMG.drill, badge:'',
    desc:'Ergonomic manual seed drill for precise, uniform seed placement, reducing seed wastage and labour cost.',
    specs:{'Suitable Crops':'Wheat, Maize, Pulses, Vegetables','Material':'Mild steel body, cast iron wheel','Row Spacing':'Adjustable','Manufacturer':'KisanTools Mfg Co.'},
    usage:'Fill hopper with seeds, adjust row spacing, and push steadily across the field for uniform sowing depth.'},
  {id:'p6', name:'Vegetable Seeds Combo Pack (10 Varieties)', brand:'HaritKrishi', category:'seeds', seller:'s2', price:299, mrp:399, rating:4.5, reviews:410, stock:520, img:IMG.veg, badge:'Popular',
    desc:'A curated combo of 10 popular vegetable seed varieties for home and kitchen gardens — tomato, brinjal, chilli, okra and more.',
    specs:{'Varieties':'10 (Tomato, Chilli, Okra, Brinjal, etc.)','Pack Type':'Sachet pack','Germination Rate':'88%+','Manufacturer':'HaritKrishi Seeds'},
    usage:'Sow in seed trays or grow bags with well-drained potting mix. Keep soil moist until germination.'},
  {id:'p7', name:'Neem-Based Organic Plant Protection Spray (500ml)', brand:'NeemGuard', category:'crop-protection', seller:'s2', price:260, mrp:320, rating:4.6, reviews:187, stock:9, img:IMG.neem, badge:'Organic',
    desc:'Broad-spectrum neem-based botanical pesticide, safe for organic farming, effective against sucking and chewing pests.',
    specs:{'Crop Type':'Vegetables, Fruits, Cereals','Application Method':'Foliar spray','Dosage':'3–5 ml/litre water','Pack Size':'500 ml','Composition':'Azadirachtin 0.03% EC','Certification':'Organic input certified'},
    usage:'Spray during early morning or evening. Repeat every 7–10 days or after rainfall for effective pest control.'},
  {id:'p8', name:'Knapsack Garden Sprayer (16L, Manual)', brand:'SprayPro', category:'tools', seller:'s4', price:1150, mrp:1450, rating:4.2, reviews:143, stock:64, img:IMG.sprayer, badge:'',
    desc:'Durable 16-litre manual knapsack sprayer with adjustable nozzle for pesticide, fertilizer and herbicide application.',
    specs:{'Capacity':'16 Litres','Type':'Manual lever-operated','Material':'HDPE tank','Warranty':'1 year','Manufacturer':'SprayPro Equipment'},
    usage:'Fill tank with prepared solution, pump lever to build pressure, and spray evenly across crop canopy.'},
  {id:'p9', name:'Heavy Duty Hand Cultivator (3-Prong)', brand:'KisanTools', category:'tools', seller:'s1', price:320, mrp:400, rating:4.4, reviews:76, stock:150, img:IMG.cultivator, badge:'',
    desc:'Sturdy 3-prong hand cultivator for loosening soil, weeding and aerating small plots and garden beds.',
    specs:{'Material':'Carbon steel head, wooden handle','Length':'30 cm','Manufacturer':'KisanTools Mfg Co.'},
    usage:'Use to break up compact soil and remove weeds around plants. Ideal for raised beds and containers.'},
  {id:'p10', name:'Organic Soil Conditioner (10kg)', brand:'GreenEarth', category:'organic', seller:'s2', price:340, mrp:420, rating:4.7, reviews:120, stock:0, img:IMG.soil, badge:'Out of Stock',
    desc:'Improves soil structure, water retention and microbial activity — ideal for reviving depleted or compacted soils.',
    specs:{'Crop Type':'All Crops','Application Method':'Soil incorporation','Dosage':'1–2 kg/sq.m','Pack Size':'10 kg','Composition':'Biochar, compost, mineral blend','Manufacturer':'GreenEarth Organics'},
    usage:'Mix into topsoil 2–3 weeks before planting for best microbial activation.'},
  {id:'p11', name:'Bio NPK Consortium Fertilizer (1L)', brand:'FarmChem', category:'fertilizers', seller:'s4', price:210, mrp:260, rating:4.3, reviews:58, stock:75, img:IMG.npk, badge:'',
    desc:'Liquid bio-fertilizer with nitrogen-fixing and phosphate-solubilising bacteria to boost natural soil fertility.',
    specs:{'Crop Type':'All Crops','Application Method':'Soil drench / seed treatment','Dosage':'5 ml/litre water','Pack Size':'1 Litre','Manufacturer':'FarmChem Industries'},
    usage:'Apply at sowing or as soil drench during early crop stages for improved nutrient uptake.'},
  {id:'p12', name:'Battery Operated Backpack Sprayer (12L)', brand:'SprayPro', category:'machinery', seller:'s3', price:3200, mrp:3900, rating:4.5, reviews:91, stock:27, img:IMG.sprayer, badge:'New',
    desc:'Rechargeable battery-powered sprayer for effortless, consistent spraying across larger plots.',
    specs:{'Capacity':'12 Litres','Battery Life':'6–8 hours','Warranty':'1 year','Manufacturer':'SprayPro Equipment'},
    usage:'Charge fully before first use. Ideal for orchards, plantations and medium-sized farms.'},
];

const REVIEWS_HOME = [
  {name:'Rajesh Kumar', loc:'Muzaffarpur, Bihar', text:'The hybrid rice seeds gave excellent germination. Delivery was fast and packaging was very good.', rating:5},
  {name:'Sunita Devi', loc:'Nashik, Maharashtra', text:'Vermicompost quality is genuinely organic. My vegetable garden has never looked better.', rating:5},
  {name:'Manpreet Singh', loc:'Ludhiana, Punjab', text:'Ordered the drip irrigation kit — saved a lot of water this season. Customer support helped with installation queries.', rating:4},
];

const COUPONS = {
  'AGRI10': {type:'percent', value:10, min:500, max:200, label:'10% off on orders above ₹500'},
  'FARM50': {type:'flat', value:50, min:300, max:50, label:'Flat ₹50 off on orders above ₹300'},
};

/* Business / support details shown across the site */
const CONTACT = {
  phone: '9334762443',
  email: 'kargel@zohomail.in',
  address: 'Vill - Barakendua, PO - Devinagar, PS - Maheshpur, Dist - Pakur, Jharkhand - 816106',
};

/* ---------- helpers ---------- */
function fmt(n){ return '₹' + Number(n).toLocaleString('en-IN'); }
function byId(id){ return PRODUCTS.find(p=>p.id===id); }
function sellerName(id){ const s = SELLERS.find(x=>x.id===id); return s?s.name:'AgriMart Seller'; }
function stars(rating){ const full = Math.round(rating); return '★'.repeat(full) + '☆'.repeat(5-full); }

/* ---------- localStorage-backed state (persists across pages) ---------- */
const LS_KEYS = { cart:'agrimart_cart', wishlist:'agrimart_wishlist', orders:'agrimart_orders', addresses:'agrimart_addresses', role:'agrimart_role', selectedAddress:'agrimart_selected_address' };

function lsGet(key, fallback){
  try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch(e){ return fallback; }
}
function lsSet(key, value){ try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){} }

const state = {
  get cart(){ return lsGet(LS_KEYS.cart, {}); },
  set cart(v){ lsSet(LS_KEYS.cart, v); },
  get wishlistArr(){ return lsGet(LS_KEYS.wishlist, []); },
  set wishlistArr(v){ lsSet(LS_KEYS.wishlist, v); },
  get orders(){ return lsGet(LS_KEYS.orders, []); },
  set orders(v){ lsSet(LS_KEYS.orders, v); },
  get addresses(){ return lsGet(LS_KEYS.addresses, [
      {id:'a1', name:'Ramesh Yadav', phone:'98765 43210', line:'House No. 12, Krishna Nagar', village:'Danapur', city:'Patna', district:'Patna', state:'Bihar', pin:'801503', isDefault:true}
    ]); },
  set addresses(v){ lsSet(LS_KEYS.addresses, v); },
  get selectedAddress(){ return lsGet(LS_KEYS.selectedAddress, 'a1'); },
  set selectedAddress(v){ lsSet(LS_KEYS.selectedAddress, v); },
  get role(){ return lsGet(LS_KEYS.role, 'customer'); },
  set role(v){ lsSet(LS_KEYS.role, v); },
};
function isWishlisted(id){ return state.wishlistArr.includes(id); }

/* ---------- cart / wishlist actions ---------- */
function addToCart(id, qty){
  qty = qty || 1;
  const p = byId(id);
  if(!p || p.stock <= 0){ toast('This product is currently out of stock.','error'); return; }
  const cart = state.cart;
  cart[id] = (cart[id]||0) + qty;
  state.cart = cart;
  updateBadges();
  toast('Added to cart: ' + p.name.slice(0,34) + (p.name.length>34?'…':''));
}
function removeFromCart(id){ const cart = state.cart; delete cart[id]; state.cart = cart; updateBadges(); if(typeof onCartChanged==='function') onCartChanged(); }
function setCartQty(id, qty){
  const p = byId(id); const cart = state.cart;
  if(qty < 1) qty = 1;
  if(qty > p.stock){ toast('Only '+p.stock+' units available in stock.','error'); qty = p.stock; }
  cart[id] = qty; state.cart = cart; updateBadges(); if(typeof onCartChanged==='function') onCartChanged();
}
function toggleWishlist(id){
  let list = state.wishlistArr;
  if(list.includes(id)){ list = list.filter(x=>x!==id); toast('Removed from wishlist'); }
  else { list.push(id); toast('Added to wishlist'); }
  state.wishlistArr = list;
  updateBadges();
  if(typeof onWishlistChanged==='function') onWishlistChanged();
}
function updateBadges(){
  const cartCount = Object.values(state.cart).reduce((a,b)=>a+b,0);
  const cb = document.getElementById('cartBadge'); if(cb) cb.textContent = cartCount;
  const wb = document.getElementById('wishBadge'); if(wb) wb.textContent = state.wishlistArr.length;
}
function cartTotals(){
  const cart = state.cart;
  let subtotal=0, mrpTotal=0;
  Object.entries(cart).forEach(([id,qty])=>{ const p = byId(id); if(!p) return; subtotal += p.price*qty; mrpTotal += p.mrp*qty; });
  const productDiscount = mrpTotal - subtotal;
  const couponCode = sessionStorage.getItem('agrimart_coupon') || null;
  let couponDiscount = 0;
  if(couponCode && COUPONS[couponCode]){
    const c = COUPONS[couponCode];
    if(subtotal >= c.min) couponDiscount = c.type==='percent' ? Math.min(subtotal*c.value/100, c.max) : c.value;
  }
  const delivery = subtotal>0 && subtotal < 999 ? 60 : 0;
  const taxable = subtotal - couponDiscount;
  const tax = Math.round(taxable*0.05);
  const total = Math.max(0, Math.round(taxable + tax + delivery));
  return {subtotal, productDiscount, couponDiscount, delivery, tax, total, mrpTotal, couponCode};
}

/* ---------- toast ---------- */
function toast(msg, type){
  let wrap = document.getElementById('toastwrap');
  if(!wrap){ wrap = document.createElement('div'); wrap.id='toastwrap'; document.body.appendChild(wrap); }
  const el = document.createElement('div');
  el.className = 'toast' + (type==='error' ? ' error' : '');
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(()=>el.remove(),300); }, 2400);
}

/* ---------- shared product card markup ---------- */
function productCard(p){
  const discount = Math.round((1 - p.price/p.mrp)*100);
  const wished = isWishlisted(p.id);
  return `
  <div class="pcard">
    <a href="product.html?id=${p.id}" class="pimg-wrap">
      <img src="${p.img}" alt="${p.name}" loading="lazy">
      ${discount>0?`<span class="disc-badge">${discount}% OFF</span>`:''}
      ${p.stock<=0?`<span class="stock-badge">Out of Stock</span>`:(p.stock<15?`<span class="stock-badge">Only ${p.stock} left</span>`:'')}
    </a>
    <button class="wishbtn ${wished?'active':''}" onclick="toggleWishlist('${p.id}'); this.classList.toggle('active');" aria-label="Toggle wishlist">
      <svg viewBox="0 0 24 24" fill="${wished?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.5-4.6-10-9.3C.4 8 2 4 6 4c2.2 0 3.9 1.3 6 3.6C14.1 5.3 15.8 4 18 4c4 0 5.6 4 4 7.7C19.5 16.4 12 21 12 21z"/></svg>
    </button>
    <div class="pbody">
      <span class="pbrand">${p.brand}</span>
      <a href="product.html?id=${p.id}" class="pname">${p.name}</a>
      <div class="prating"><span class="stars">${stars(p.rating)}</span> ${p.rating} (${p.reviews})</div>
      <div class="pprice"><span class="now">${fmt(p.price)}</span>${p.mrp>p.price?`<span class="was">${fmt(p.mrp)}</span>`:''}</div>
      <div class="addcart">
        <button class="btn btn-primary" ${p.stock<=0?'disabled':''} onclick="addToCart('${p.id}',1)">Add to Cart</button>
      </div>
    </div>
  </div>`;
}
function barsChart(values, labels){
  const max = Math.max(...values);
  return `<div class="bars">${values.map((v,i)=>`<div class="bar-col"><div class="bar" style="height:${Math.max(6,(v/max*100))}%"></div><span class="bar-lbl">${labels[i]}</span></div>`).join('')}</div>`;
}
function qs(name){ return new URLSearchParams(window.location.search).get(name); }
