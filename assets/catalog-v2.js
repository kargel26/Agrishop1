/* Supabase-backed catalog and authenticated cart bridge. */
(function(){
  const legacyProducts = (typeof PRODUCTS !== 'undefined') ? PRODUCTS.slice() : [];
  function mapProduct(p){
    const old = legacyProducts.find(x => x.name === p.name);
    return {
      id: old ? old.id : p.id,
      dbId: p.id,
      name: p.name,
      brand: p.brand || (old && old.brand) || 'AgriMart',
      category: p.categories?.slug || (old && old.category) || 'other',
      seller: p.seller_id || (old && old.seller) || null,
      sellerName: p.sellers?.business_name || 'AgriMart Seller',
      sellerLocation: p.sellers?.location || '',
      sellerRating: Number(p.sellers?.rating || 0),
      sellerVerified: !!p.sellers?.verified,
      price: Number(p.price || 0), mrp: Number(p.mrp || p.price || 0),
      rating: Number(p.rating || 0), reviews: Number(p.review_count || 0),
      stock: Number(p.stock || 0), img: p.image_url || '',
      badge: p.badge || (old && old.badge) || '', desc: p.description || '',
      specs: p.specs || {}, usage: p.usage || ''
    };
  }
  async function user(){ if(!window.agriSupabase) return null; const {data}=await agriSupabase.auth.getUser(); return data?.user||null; }
  async function loadProducts(){
    if(!window.agriSupabase) { window.AGRI_PRODUCTS=[]; return; }
    const {data,error}=await agriSupabase.from('products').select('*,categories(slug,name),sellers(business_name,location,rating,verified)').eq('is_active',true).order('created_at',{ascending:false});
    if(error) throw error;
    const products=(data||[]).map(mapProduct).filter(p=>p.img);
    if(typeof PRODUCTS!=='undefined') PRODUCTS.splice(0,PRODUCTS.length,...products);
    window.AGRI_PRODUCTS=products;
  }
  async function cartId(uid){
    const {data,error}=await agriSupabase.from('carts').select('id').eq('user_id',uid).maybeSingle();
    if(error) throw error; if(data) return data.id;
    const {data:c,error:e}=await agriSupabase.from('carts').insert({user_id:uid}).select('id').single();
    if(e) throw e; return c.id;
  }
  async function syncCart(uid){
    const cid=await cartId(uid);
    const {data,error}=await agriSupabase.from('cart_items').select('id,product_id,quantity').eq('cart_id',cid);
    if(error) throw error;
    // Cloud cart is authoritative after login. Do not add local quantities again on every page load.
    const clean={};
    (data||[]).forEach(r=>{
      const p=(window.AGRI_PRODUCTS||[]).find(x=>x.dbId===r.product_id);
      if(p && p.stock>0) clean[p.id]=Math.min(Number(r.quantity)||0,p.stock);
    });
    state.cart=clean;
    updateBadges();
    if(typeof onCartChanged==='function')onCartChanged();
  }
  async function persist(){const u=await user();if(!u)return;const cid=await cartId(u.id);const rows=Object.entries(state.cart).map(([id,q])=>{const p=byId(id);return p?.dbId?{cart_id:cid,product_id:p.dbId,quantity:Number(q)}:null;}).filter(Boolean);const {data:old,error:oe}=await agriSupabase.from('cart_items').select('id,product_id').eq('cart_id',cid);if(oe)throw oe;const keep=new Set(rows.map(x=>x.product_id));const remove=(old||[]).filter(x=>!keep.has(x.product_id)).map(x=>x.id);if(remove.length){const {error:e}=await agriSupabase.from('cart_items').delete().in('id',remove);if(e)throw e;}if(rows.length){const {error:e}=await agriSupabase.from('cart_items').upsert(rows,{onConflict:'cart_id,product_id'});if(e)throw e;}}
  window.AgriCatalog={ready:(async()=>{try{await loadProducts();const u=await user();if(u)await syncCart(u.id);}catch(e){console.error('AgriMart Supabase catalog:',e);window.AGRI_PRODUCTS=[];if(typeof PRODUCTS!=='undefined') PRODUCTS.splice(0,PRODUCTS.length); }return window.AGRI_PRODUCTS||[];})()};
  window.addToCart=async function(id,qty){await window.AgriCatalog.ready;const p=byId(id);qty=Number(qty||1);if(!p||p.stock<=0){toast('This product is currently out of stock.','error');return;}const c=state.cart;c[id]=Math.min((c[id]||0)+qty,p.stock);state.cart=c;updateBadges();toast('Added to cart: '+p.name.slice(0,34)+(p.name.length>34?'…':''));try{await persist();}catch(e){console.error(e);toast('Saved locally; cloud cart sync failed.','error');}if(typeof onCartChanged==='function')onCartChanged();};
  window.removeFromCart=async function(id){const c=state.cart;delete c[id];state.cart=c;updateBadges();try{await persist();}catch(e){console.error(e);}if(typeof onCartChanged==='function')onCartChanged();};
  window.setCartQty=async function(id,q){const p=byId(id);if(!p)return;const c=state.cart;c[id]=Math.max(1,Math.min(Number(q),p.stock));state.cart=c;updateBadges();try{await persist();}catch(e){console.error(e);}if(typeof onCartChanged==='function')onCartChanged();};
})();
