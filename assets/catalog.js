/* AgriMart Supabase catalog + authenticated cart bridge.
   Keeps the existing UI/data.js helpers while making products and logged-in
   cart state database-backed. Guest carts continue to work locally.
*/
(function () {
  const fallbackImages = {};
  const legacyImages = (typeof IMG !== 'undefined') ? IMG : {};

  function mapProduct(p) {
    return {
      id: p.id,
      name: p.name,
      brand: p.brand || 'AgriMart',
      category: p.categories?.slug || 'other',
      seller: p.seller_id || null,
      sellerName: p.sellers?.business_name || 'AgriMart Seller',
      sellerLocation: p.sellers?.location || '',
      sellerRating: p.sellers?.rating || 0,
      sellerVerified: !!p.sellers?.verified,
      price: Number(p.price || 0),
      mrp: Number(p.mrp || p.price || 0),
      rating: Number(p.rating || 0),
      reviews: Number(p.review_count || 0),
      stock: Number(p.stock || 0),
      img: p.image_url || legacyImages.field || '',
      badge: p.badge || '',
      desc: p.description || '',
      specs: p.specs || {},
      usage: p.usage || ''
    };
  }

  async function fetchProducts() {
    if (!window.agriSupabase) return [];
    const { data, error } = await window.agriSupabase
      .from('products')
      .select('*, categories(slug,name), sellers(business_name,location,rating,verified)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapProduct);
  }

  async function currentUser() {
    if (!window.agriSupabase) return null;
    const { data } = await window.agriSupabase.auth.getUser();
    return data?.user || null;
  }

  async function ensureCart(userId) {
    const { data, error } = await window.agriSupabase
      .from('carts').select('id').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    if (data) return data.id;
    const { data: created, error: createError } = await window.agriSupabase
      .from('carts').insert({ user_id: userId }).select('id').single();
    if (createError) throw createError;
    return created.id;
  }

  async function getRemoteCart(userId) {
    const cartId = await ensureCart(userId);
    const { data, error } = await window.agriSupabase
      .from('cart_items').select('product_id,quantity').eq('cart_id', cartId);
    if (error) throw error;
    const cart = {};
    (data || []).forEach(item => { cart[item.product_id] = item.quantity; });
    return { cartId, cart };
  }

  async function writeRemoteCart(userId, cart) {
    const cartId = await ensureCart(userId);
    const entries = Object.entries(cart).filter(([id, qty]) => Number(qty) > 0 && byId(id));
    if (entries.length) {
      const rows = entries.map(([product_id, quantity]) => ({ cart_id: cartId, product_id, quantity: Number(quantity) }));
      const { error } = await window.agriSupabase.from('cart_items').upsert(rows, { onConflict: 'cart_id,product_id' });
      if (error) throw error;
    }
    const keep = new Set(entries.map(([id]) => id));
    const { data: existing, error: readError } = await window.agriSupabase
      .from('cart_items').select('id,product_id').eq('cart_id', cartId);
    if (readError) throw readError;
    const removeIds = (existing || []).filter(x => !keep.has(x.product_id)).map(x => x.id);
    if (removeIds.length) {
      const { error: deleteError } = await window.agriSupabase.from('cart_items').delete().in('id', removeIds);
      if (deleteError) throw deleteError;
    }
  }

  async function syncCartForUser(userId) {
    const local = state.cart || {};
    const remote = await getRemoteCart(userId);
    const merged = { ...remote.cart };
    Object.entries(local).forEach(([id, qty]) => {
      merged[id] = Number(merged[id] || 0) + Number(qty || 0);
    });
    const cleaned = {};
    Object.entries(merged).forEach(([id, qty]) => {
      const p = byId(id);
      if (p && p.stock > 0) cleaned[id] = Math.min(Number(qty), p.stock);
    });
    state.cart = cleaned;
    await writeRemoteCart(userId, cleaned);
    if (typeof updateBadges === 'function') updateBadges();
    if (typeof onCartChanged === 'function') onCartChanged();
  }

  async function persistCart() {
    const user = await currentUser();
    if (user) await writeRemoteCart(user.id, state.cart);
  }

  window.AgriCatalog = {
    products: [],
    ready: (async function () {
      try {
        const products = await fetchProducts();
        if (products.length) window.AgriCatalog.products = products;
        else window.AgriCatalog.products = (typeof PRODUCTS !== 'undefined') ? [...PRODUCTS] : [];
        if (window.AgriCatalog.products.length) window.AGRI_PRODUCTS = window.AgriCatalog.products;
        const user = await currentUser();
        if (user) await syncCartForUser(user.id);
      } catch (error) {
        console.error('Supabase catalog load failed:', error);
        window.AgriCatalog.products = (typeof PRODUCTS !== 'undefined') ? [...PRODUCTS] : [];
        window.AGRI_PRODUCTS = window.AgriCatalog.products;
      }
      return window.AgriCatalog.products;
    })()
  };

  window.addToCart = async function (id, qty) {
    qty = Number(qty || 1);
    const p = byId(id);
    if (!p || p.stock <= 0) { toast('This product is currently out of stock.', 'error'); return; }
    const cart = state.cart;
    cart[id] = Math.min((cart[id] || 0) + qty, p.stock);
    state.cart = cart;
    updateBadges();
    toast('Added to cart: ' + p.name.slice(0, 34) + (p.name.length > 34 ? '…' : ''));
    try { await persistCart(); } catch (e) { console.error(e); toast('Saved locally; cloud cart sync failed.', 'error'); }
    if (typeof onCartChanged === 'function') onCartChanged();
  };

  window.removeFromCart = async function (id) {
    const cart = state.cart; delete cart[id]; state.cart = cart; updateBadges();
    try { await persistCart(); } catch (e) { console.error(e); }
    if (typeof onCartChanged === 'function') onCartChanged();
  };

  window.setCartQty = async function (id, qty) {
    const p = byId(id); const cart = state.cart;
    if (!p) return;
    qty = Math.max(1, Math.min(Number(qty), p.stock));
    cart[id] = qty; state.cart = cart; updateBadges();
    try { await persistCart(); } catch (e) { console.error(e); }
    if (typeof onCartChanged === 'function') onCartChanged();
  };
})();
