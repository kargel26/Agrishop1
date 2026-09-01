/* AgriMart Supabase order bridge — Phase 3/4 */
(function () {
  async function getUser() {
    if (!window.agriSupabase) return null;
    const { data } = await window.agriSupabase.auth.getUser();
    return data?.user || null;
  }

  async function saveAddress(userId, address) {
    const payload = {
      user_id: userId, name: address.name, phone: address.phone, line: address.line,
      village: address.village || null, city: address.city, district: address.district || null,
      state: address.state, pin: address.pin, is_default: !!address.isDefault
    };
    const { data, error } = await window.agriSupabase.from('addresses').insert(payload).select().single();
    if (error) throw error;
    return data;
  }

  async function resolveProducts(ids) {
    await (window.AgriCatalog?.ready || Promise.resolve());
    const selected = ids.map(id => byId(id)).filter(Boolean);
    if (selected.length !== ids.length) throw new Error('One or more cart products could not be loaded. Please refresh the page.');

    // Normal path: catalog-v2 attaches the real Supabase UUID as dbId.
    const direct = selected.filter(p => p.dbId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(p.dbId)));
    const resolved = Object.create(null);
    direct.forEach(p => { resolved[p.id] = p.dbId; });

    // Fallback path: older carts may contain p1..p12 objects without dbId.
    // Resolve them by the immutable product name in Supabase, avoiding any
    // attempt to insert a legacy id such as "p3" into a UUID column.
    const unresolved = selected.filter(p => !resolved[p.id]);
    if (unresolved.length) {
      const names = unresolved.map(p => p.name);
      const { data, error } = await window.agriSupabase.from('products').select('id,name').in('name', names);
      if (error) throw error;
      const byName = Object.fromEntries((data || []).map(p => [p.name, p.id]));
      unresolved.forEach(p => { if (byName[p.name]) resolved[p.id] = byName[p.name]; });
    }

    const missing = selected.filter(p => !resolved[p.id]);
    if (missing.length) throw new Error('Could not match cart product(s) with the product database. Please remove the old cart items, add them again, and retry.');
    return { selected, resolved };
  }

  async function createOrder() {
    const user = await getUser();
    if (!user) throw new Error('Please sign in before placing an order.');
    const cart = state.cart || {};
    const ids = Object.keys(cart);
    if (!ids.length) throw new Error('Your cart is empty.');

    const { selected, resolved } = await resolveProducts(ids);
    const dbIds = ids.map(id => resolved[id]);
    const { data: products, error: productError } = await window.agriSupabase
      .from('products').select('id,name,price,stock,seller_id,is_active').in('id', dbIds);
    if (productError) throw productError;
    const byDbId = Object.fromEntries((products || []).map(p => [p.id, p]));

    const items = [];
    let subtotal = 0;
    for (const id of ids) {
      const p = byDbId[resolved[id]];
      const qty = Number(cart[id]);
      if (!p || !p.is_active) throw new Error('A product in your cart is no longer available.');
      if (!Number.isInteger(qty) || qty < 1 || qty > p.stock) throw new Error(`${p.name} has insufficient stock.`);
      subtotal += Number(p.price) * qty;
      items.push({ product_id: p.id, seller_id: p.seller_id, product_name: p.name, unit_price: Number(p.price), quantity: qty });
    }

    const localAddress = state.addresses.find(a => a.id === state.selectedAddress) || state.addresses[0];
    if (!localAddress) throw new Error('Please select a delivery address.');
    const { data: savedAddress, error: addressError } = await window.agriSupabase.from('addresses').insert({
      user_id: user.id, name: localAddress.name, phone: localAddress.phone, line: localAddress.line,
      village: localAddress.village || null, city: localAddress.city, district: localAddress.district || null,
      state: localAddress.state, pin: localAddress.pin, is_default: !!localAddress.isDefault
    }).select('id').single();
    if (addressError) throw addressError;

    const t = cartTotals();
    const { data: order, error: orderError } = await window.agriSupabase.from('orders').insert({
      user_id: user.id, address_id: savedAddress.id, subtotal,
      discount: Number(t.couponDiscount || 0), delivery_fee: Number(t.delivery || 0),
      tax: Number(t.tax || 0), total: Number(t.total || 0), status: 'pending'
    }).select().single();
    if (orderError) throw orderError;

    const { error: itemsError } = await window.agriSupabase.from('order_items').insert(items.map(x => ({ ...x, order_id: order.id })));
    if (itemsError) {
      await window.agriSupabase.from('orders').delete().eq('id', order.id);
      throw itemsError;
    }

    const { data: cartRow } = await window.agriSupabase.from('carts').select('id').eq('user_id', user.id).maybeSingle();
    if (cartRow?.id) {
      const { error: clearError } = await window.agriSupabase.from('cart_items').delete().eq('cart_id', cartRow.id);
      if (clearError) console.warn('Cart cleanup failed:', clearError);
    }
    return { order, orderItems: items };
  }

  window.AgriOrders = { createOrder, saveAddress };
})();
