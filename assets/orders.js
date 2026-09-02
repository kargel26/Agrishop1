/* AgriMart Supabase order bridge */
(function () {
  async function getUser(){if(!window.agriSupabase)return null;const {data,error}=await window.agriSupabase.auth.getUser();if(error)throw error;return data?.user||null;}
  async function saveAddress(userId,address){const payload={user_id:userId,name:address.name,phone:address.phone,line:address.line,village:address.village||null,city:address.city,district:address.district||null,state:address.state,pin:address.pin,is_default:!!address.isDefault};const {data,error}=await window.agriSupabase.from('addresses').insert(payload).select().single();if(error)throw error;return data;}
  async function resolveProducts(ids){const selected=ids.map(id=>byId(id)).filter(Boolean);if(selected.length!==ids.length)throw new Error('One or more cart products could not be loaded. Please refresh the page.');const {data,error}=await window.agriSupabase.from('products').select('id,name').in('name',selected.map(p=>p.name));if(error)throw error;const byName=Object.fromEntries((data||[]).map(p=>[p.name,p.id]));const resolved=Object.create(null);selected.forEach(p=>{if(byName[p.name])resolved[p.id]=byName[p.name];});if(selected.some(p=>!resolved[p.id]))throw new Error('Could not find cart product(s) in the database. Please remove and add them again.');return {selected,resolved};}
  async function createOrder(){const user=await getUser();if(!user)throw new Error('Please sign in before placing an order.');const cart=state.cart||{},ids=Object.keys(cart);if(!ids.length)throw new Error('Your cart is empty.');const {resolved}=await resolveProducts(ids);const {data:products,error:pe}=await window.agriSupabase.from('products').select('id,name,price,stock,seller_id,is_active').in('id',ids.map(id=>resolved[id]));if(pe)throw pe;const byDbId=Object.fromEntries((products||[]).map(p=>[p.id,p]));const items=[];let subtotal=0;for(const id of ids){const p=byDbId[resolved[id]],qty=Number(cart[id]);if(!p||!p.is_active)throw new Error('A product in your cart is no longer available.');if(!Number.isInteger(qty)||qty<1||qty>p.stock)throw new Error(`${p.name} has insufficient stock.`);subtotal+=Number(p.price)*qty;items.push({product_id:p.id,seller_id:p.seller_id,product_name:p.name,unit_price:Number(p.price),quantity:qty});}const a=state.addresses.find(x=>x.id===state.selectedAddress)||state.addresses[0];if(!a)throw new Error('Please select a delivery address.');const {data:savedAddress,error:ae}=await window.agriSupabase.from('addresses').insert({user_id:user.id,name:a.name,phone:a.phone,line:a.line,village:a.village||null,city:a.city,district:a.district||null,state:a.state,pin:a.pin,is_default:!!a.isDefault}).select('id').single();if(ae)throw ae;const t=cartTotals();const {data:order,error:oe}=await window.agriSupabase.from('orders').insert({user_id:user.id,address_id:savedAddress.id,subtotal,discount:Number(t.couponDiscount||0),delivery_fee:Number(t.delivery||0),tax:Number(t.tax||0),total:Number(t.total||0),status:'pending'}).select().single();if(oe)throw oe;const {error:ie}=await window.agriSupabase.from('order_items').insert(items.map(x=>({...x,order_id:order.id})));if(ie){await window.agriSupabase.from('orders').delete().eq('id',order.id);throw ie;}return {order,orderItems:items};}

  // Load order, address, items and payment independently so one optional
  // relationship/RLS issue cannot break the View Order page.
  async function getOrderByNumber(n){
    const user=await getUser();
    if(!user)return null;
    const value=String(n||'').trim();
    if(!value)return null;
    const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let q=window.agriSupabase.from('orders').select('id,order_number,user_id,address_id,status,subtotal,discount,delivery_fee,tax,total,created_at,updated_at').eq('user_id',user.id);
    q=uuidPattern.test(value)?q.eq('id',value):q.eq('order_number',value);
    const {data:order,error}=await q.maybeSingle();
    if(error)throw error;
    if(!order)return null;

    const addressPromise=order.address_id?window.agriSupabase.from('addresses').select('id,name,phone,line,village,city,district,state,pin').eq('id',order.address_id).eq('user_id',user.id).maybeSingle():Promise.resolve({data:null,error:null});
    const itemsPromise=window.agriSupabase.from('order_items').select('id,product_id,product_name,unit_price,quantity,line_total').eq('order_id',order.id).order('id');
    const paymentPromise=window.agriSupabase.from('payments').select('id,order_id,provider,razorpay_order_id,razorpay_payment_id,amount,status,method,paid_at,created_at').eq('order_id',order.id).eq('user_id',user.id).order('created_at',{ascending:false}).limit(1);
    const [addressResult,itemsResult,paymentResult]=await Promise.all([addressPromise,itemsPromise,paymentPromise]);
    if(addressResult.error)throw addressResult.error;
    if(itemsResult.error)throw itemsResult.error;
    return {...order,addresses:addressResult.data||null,order_items:itemsResult.data||[],payments:paymentResult.error?[]:(paymentResult.data||[])};
  }
  async function getOrderById(id){return getOrderByNumber(id);}
  async function getOrders(){const user=await getUser();if(!user)return [];const {data,error}=await window.agriSupabase.from('orders').select('id,order_number,user_id,address_id,status,subtotal,discount,delivery_fee,tax,total,created_at,updated_at,addresses(name,phone,line,village,city,district,state,pin),order_items(id,product_id,product_name,unit_price,quantity,line_total)').eq('user_id',user.id).order('created_at',{ascending:false});if(error)throw error;return data||[];}
  async function getTransactions(){const user=await getUser();if(!user)return [];const {data,error}=await window.agriSupabase.from('payments').select('id,order_id,provider,razorpay_order_id,razorpay_payment_id,amount,status,method,paid_at,created_at,orders(order_number,status)').eq('user_id',user.id).order('created_at',{ascending:false});if(error)throw error;return data||[];}
  async function cancelOrder(id){const user=await getUser();if(!user)throw new Error('Please sign in.');const {data,error}=await window.agriSupabase.from('orders').update({status:'cancelled',updated_at:new Date().toISOString()}).eq('id',id).eq('user_id',user.id).eq('status','pending').select('id,order_number,status').maybeSingle();if(error)throw error;if(!data)throw new Error('Only pending orders can be cancelled.');return data;}
  async function getTracking(id){const user=await getUser();if(!user)throw new Error('Please sign in.');const {data,error}=await window.agriSupabase.from('orders').select('id,order_number,status,created_at,updated_at').eq('id',id).eq('user_id',user.id).maybeSingle();if(error)throw error;return data;}
  window.AgriOrders={createOrder,saveAddress,getOrders,getOrderByNumber,getOrderById,getTransactions,cancelOrder,getTracking};
})();
