/* Admin contact-message control: loaded automatically on admin.html */
(function(){
  const STATUSES=['new','read','replied','closed'];
  let messages=[];
  let filter='all';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=v=>v?new Date(v).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'—';
  const chip=v=>`<span class="status-chip chip-${String(v||'').toLowerCase()}">${esc(v||'—')}</span>`;
  function menuLink(){
    const menu=document.getElementById('adminMenu');
    if(!menu || menu.querySelector('[data-tab="contact-messages"]')) return;
    const a=document.createElement('a');
    a.href='#'; a.dataset.tab='contact-messages'; a.id='contactMessagesMenu';
    a.onclick=e=>{e.preventDefault(); window.setAdminTab('contact-messages');};
    menu.appendChild(a); updateBadge();
  }
  function updateBadge(){
    const a=document.getElementById('contactMessagesMenu'); if(!a)return;
    const n=messages.filter(x=>(x.status||'new')==='new').length;
    a.innerHTML=`Contact Messages${n?` <span style="margin-left:auto;min-width:21px;height:21px;padding:0 6px;border-radius:999px;background:#c7352c;color:#fff;font-size:11px;display:inline-flex;align-items:center;justify-content:center">${n}</span>`:''}`;
  }
  async function load(){
    const {data,error}=await window.agriSupabase.from('contact_messages').select('id,name,contact,subject,message,user_id,status,created_at').order('created_at',{ascending:false});
    if(error) throw error;
    messages=data||[]; updateBadge();
  }
  function panel(){
    const rows=messages.filter(m=>filter==='all'||(m.status||'new')===filter);
    const counts={new:0,read:0,replied:0,closed:0};
    messages.forEach(m=>{const s=m.status||'new';if(counts[s]!==undefined)counts[s]++;});
    return `<div class="panel-card">
      <div class="admin-toolbar">
        <div><h2>Contact Messages</h2><div class="muted">Customer enquiries received from the Contact page.</div></div>
        <button type="button" class="btn btn-primary" onclick="window.refreshContactMessages()">↻ Refresh</button>
      </div>
      <div class="stat-grid" style="grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:18px">
        <div class="stat-card" style="min-height:78px"><div class="val">${counts.new}</div><div class="lbl">New</div></div>
        <div class="stat-card" style="min-height:78px"><div class="val">${counts.read}</div><div class="lbl">Read</div></div>
        <div class="stat-card" style="min-height:78px"><div class="val">${counts.replied}</div><div class="lbl">Replied</div></div>
        <div class="stat-card" style="min-height:78px"><div class="val">${counts.closed}</div><div class="lbl">Closed</div></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        ${['all',...STATUSES].map(s=>`<button type="button" class="btn ${filter===s?'btn-primary':''}" onclick="window.filterContactMessages('${s}')">${s==='all'?'All':s.charAt(0).toUpperCase()+s.slice(1)}${s!=='all'?` (${counts[s]})`:''}</button>`).join('')}
      </div>
      ${rows.length?`<table class="data-table" style="min-width:980px"><thead><tr><th>Customer</th><th>Mobile / Email</th><th>Subject</th><th>Message</th><th>Date & Time</th><th>Status</th><th>Update</th></tr></thead><tbody>${rows.map(m=>`<tr>
        <td><strong>${esc(m.name||'—')}</strong></td>
        <td>${esc(m.contact||'—')}</td>
        <td>${esc(m.subject||'—')}</td>
        <td style="max-width:340px;white-space:pre-wrap;overflow-wrap:anywhere">${esc(m.message||'—')}</td>
        <td>${date(m.created_at)}</td>
        <td>${chip(m.status||'new')}</td>
        <td><select aria-label="Update message status" onchange="window.updateContactMessageStatus('${m.id}',this.value)">${STATUSES.map(s=>`<option value="${s}" ${(m.status||'new')===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}</select></td>
      </tr>`).join('')}</tbody></table>`:`<div class="admin-empty">No contact messages found${filter!=='all'?` with status “${esc(filter)}”`:''}.</div>`}
    </div>`;
  }
  async function refresh(){
    try{await load(); if(window.adminTab==='contact-messages') window.renderAdminContent();}
    catch(e){alert('Unable to load contact messages: '+(e.message||e));}
  }
  async function updateStatus(id,status){
    if(!STATUSES.includes(status))return;
    const previous=messages.find(m=>m.id===id)?.status||'new';
    if(previous===status)return;
    try{
      const {error}=await window.agriSupabase.from('contact_messages').update({status}).eq('id',id);
      if(error)throw error;
      const m=messages.find(x=>x.id===id); if(m)m.status=status;
      updateBadge(); window.renderAdminContent();
    }catch(e){alert('Unable to update message status: '+(e.message||e)); window.renderAdminContent();}
  }
  function install(){
    if(!window.agriSupabase||!window.adminMenu)return;
    const original=window.adminContent;
    if(typeof original!=='function')return;
    window.adminContent=function(){return window.adminTab==='contact-messages'?panel():original();};
    const originalSet=window.setAdminTab;
    window.setAdminTab=function(t){
      window.adminTab=t;
      document.querySelectorAll('#adminMenu a').forEach(a=>a.classList.toggle('active',a.dataset.tab===t));
      window.renderAdminContent();
      if(t==='contact-messages'&&!messages.length)refresh();
    };
    window.renderAdminContent=window.renderAdminContent||function(){document.getElementById('adminContent').innerHTML=window.adminContent();};
    window.refreshContactMessages=refresh;
    window.updateContactMessageStatus=updateStatus;
    window.filterContactMessages=s=>{filter=s;window.renderAdminContent();};
    menuLink();
    load().then(()=>{updateBadge();if(window.adminTab==='contact-messages')window.renderAdminContent();}).catch(e=>console.warn('Contact messages load failed',e));
  }
  function boot(){
    let tries=0; const timer=setInterval(()=>{
      tries++;
      if(window.adminTab&&window.adminContent&&document.getElementById('adminMenu')){clearInterval(timer);install();}
      else if(tries>80)clearInterval(timer);
    },100);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
