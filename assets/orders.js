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
    const selected = ids.map(id => byId(id)).filter(Boolean);
    if (selected.length !== ids.length) {
      throw new Error('One or more cart products could not be loaded. Please refresh the page.');
    }

    // Do not trust the browser catalog/cache for database identity. Always
    // resolve the cart items against the authoritative Supabase products table.
    // This also handles legacy carts containing IDs such as p1, p2, p3.
    const names = selected.map(p => p.name);
    const { data, error } = await window.agriSupabase
      .from('products')
      .select('id,name')
      .in('name', names);
    if (error) throw error;

    const byName = Object.fromEntries((data || []).map(p => [p.name, p.id]));
    const resolved = Object.create(null);
    selected.forEach(p => {
      if (byName[p.name]) resolved[p.id] = byName[p.name];
    });

    const missing = selected.filter(p => !resolved[p.id]);
    if (missing.length) {
      throw new Error('Could not find '+missing.length+' cart product(s) in the database. Please remove those items and add them again.');
    }
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
      .from('products')
      .select('id,name,price,stock,seller_id,is_active')
      .in('id', dbIds);
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

    const { error: itemsError } = await window.agriSupabase.from('order_items').insert(
      items.map(x => ({ ...x, order_id: order.id }))
    );
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
