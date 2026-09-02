/* Admin delivery tracking controls. Loaded only on admin pages via common.js. */
(function(){
  const STATUSES=['pending','confirmed','processing','shipped','delivered','cancelled','refunded'];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=v=>v?new Date(v).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'—';
  let ready=false;
  async function saveStatus(id,status){
    const btn=document.querySelector('[data-track-save="'+id+'"]');
    if(btn){btn.disabled=true;btn.textContent='Saving…';}
    try{
      const r=await window.agriSupabase.from('orders').update({status,updated_at:new Date().toISOString()}).eq('id',id);
      if(r.error)throw r.error;
      if(typeof loadAdminData==='function')await loadAdminData();
      if(typeof renderAdminContent==='function')renderAdminContent();
      setTimeout(render,100);
    }catch(e){alert(e.message||'Unable to update delivery status.');if(btn){btn.disabled=false;btn.textContent='Update';}}
  }
  function render(){
    if(!ready||!window.db||!document.getElementById('adminContent'))return;
    const orders=Array.isArray(db.orders)?db.orders:[];
    const box=document.getElementById('adminTrackingPanel');
    const html='<div class="panel-card" style="margin-bottom:18px;border-left:4px solid var(--primary)"><div class="admin-toolbar"><div><h3 style="margin:0">🚚 Delivery Tracking Control</h3><div class="muted">Admin can update the delivery status. Customer can only view the resulting timeline.</div></div><span class="status-chip chip-confirmed">Live</span></div><div class="data-table-wrap" style="overflow:auto"><table class="data-table"><tr><th>Order</th><th>Customer</th><th>Current Status</th><th>Last Updated</th><th>Set Delivery Status</th><th>Action</th></tr>'+orders.slice(0,50).map(o=>{const customer=(db.profiles||[]).find(p=>p.id===o.user_id);return '<tr><td><b>'+esc(o.order_number||o.id.slice(0,8))+'</b></td><td>'+esc(customer?.full_name||'Customer')+'</td><td>'+esc(o.status||'pending')+'</td><td>'+date(o.updated_at||o.created_at)+'</td><td><select data-track-select="'+esc(o.id)+'">'+STATUSES.map(s=>'<option value="'+s+'" '+(s===String(o.status||'pending')?'selected':'')+'>'+s.charAt(0).toUpperCase()+s.slice(1)+'</option>').join('')+'</select></td><td><button class="btn primary btn-sm" data-track-save="'+esc(o.id)+'">Update</button></td></tr>';}).join('')+'</table></div></div>';
    if(box)box.innerHTML=html;else{document.getElementById('adminContent').insertAdjacentHTML('afterbegin','<div id="adminTrackingPanel"></div>');document.getElementById('adminContent').insertAdjacentHTML('afterbegin',html);}
    document.querySelectorAll('[data-track-save]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.getAttribute('data-track-save');const sel=document.querySelector('[data-track-select="'+id+'"]');if(sel)saveStatus(id,sel.value);}));
  }
  function init(){ready=true;setTimeout(render,300);setInterval(()=>{if(document.getElementById('adminContent')&&typeof db!=='undefined'&&db.orders)render();},15000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
