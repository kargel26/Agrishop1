/* Admin contact-message control */
(function(){
  const STATUSES=['new','read','replied','closed'];
  let messages=[];
  let filter='all';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=v=>v?new Date(v).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'—';
  const chip=v=>`<span class="status-chip chip-${String(v||'').toLowerCase().replace(/\s+/g,'-')}">${esc(v||'—')}</span>`;

  function menuLink(){
    const menu=document.getElementById('adminMenu');
    if(!menu||menu.querySelector('[data-tab="contact-messages"]'))return;
    const a=document.createElement('a');
    a.href='#';a.dataset.tab='contact-messages';a.id='contactMessagesMenu';
    a.onclick=e=>{e.preventDefault();window.setAdminTab('contact-messages');};
    a.textContent='Contact Messages';
    menu.appendChild(a);updateBadge();
  }
  function updateBadge(){
    const a=document.getElementById('contactMessagesMenu');if(!a)return;
    const n=messages.filter(x=>(x.status||'new')==='new').length;
    a.innerHTML=`Contact Messages${n?` <span style="margin-left:auto;min-width:21px;height:21px;padding:0 6px;border-radius:999px;background:#c7352c;color:#fff;font-size:11px;display:inline-flex;align-items:center;justify-content:center">${n}</span>`:''}`;
  }
  async function load(){
    const {data,error}=await window.agriSupabase.from('contact_messages').select('id,name,contact,subject,message,user_id,status,created_at').order('created_at',{ascending:false});
    if(error)throw error;messages=data||[];updateBadge();
  }
  function closeReply(){const el=document.getElementById('contactReplyModal');if(el)el.remove();}
  function replyMessage(id){
    const m=messages.find(x=>x.id===id);if(!m)return;
    closeReply();
    const raw=String(m.contact||'').trim();
    const emailMatch=raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const email=emailMatch?emailMatch[0]:'';
    const subject='Re: '+String(m.subject||'AgriMart Contact');
    const defaultBody=`Hello ${m.name||'Customer'},\n\nThank you for contacting AgriMart.\n\nRegarding: ${m.subject||'Your enquiry'}\n\nYour message:\n${m.message||''}\n\nReply:\n\nRegards,\nAgriMart Support`;
    const modal=document.createElement('div');modal.id='contactReplyModal';
    modal.innerHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px" onclick="if(event.target===this)window.closeContactReply()"><div style="background:#fff;width:min(720px,100%);max-height:90vh;overflow:auto;border-radius:16px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.25)"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px"><div><h2 style="margin:0">Reply to Customer</h2><div style="font-size:12px;color:#667085;margin-top:4px">${esc(m.name||'Customer')} · ${esc(m.contact||'No email provided')}</div></div><button type="button" class="btn" onclick="window.closeContactReply()">✕</button></div><div style="display:grid;gap:10px"><label style="font-size:12px;font-weight:700">To</label><input id="replyToEmail" value="${esc(email)}" placeholder="customer@email.com" type="email" style="width:100%;border:1px solid var(--line);border-radius:9px;padding:10px;font:inherit"><label style="font-size:12px;font-weight:700">Subject</label><input id="replySubject" value="${esc(subject)}" style="width:100%;border:1px solid var(--line);border-radius:9px;padding:10px;font:inherit"><label style="font-size:12px;font-weight:700">Reply message</label><textarea id="replyBody" style="width:100%;min-height:230px;border:1px solid var(--line);border-radius:9px;padding:10px;font:inherit;resize:vertical">${esc(defaultBody)}</textarea><div style="font-size:12px;color:#667085">Click <b>Open Email</b> to open the device email app with this reply pre-filled. The message will be marked Replied after opening.</div><div style="display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap"><button type="button" class="btn" onclick="window.closeContactReply()">Cancel</button><button type="button" class="btn btn-primary" onclick="window.sendContactReply('${m.id}')">✉ Open Email & Mark Replied</button></div></div></div></div>`;
    document.body.appendChild(modal);
  }
  async function sendContactReply(id){
    const to=(document.getElementById('replyToEmail')?.value||'').trim();
    const subject=document.getElementById('replySubject')?.value||'Re: AgriMart Contact';
    const body=document.getElementById('replyBody')?.value||'';
    if(!to||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)){alert('Please enter a valid customer email address.');return;}
    const mailto='mailto:'+encodeURIComponent(to)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    window.location.href=mailto;
    try{await updateStatus(id,'replied');}catch(e){console.warn(e);}
    closeReply();
  }
  function panel(){
    const rows=messages.filter(m=>filter==='all'||(m.status||'new')===filter);
    const counts={new:0,read:0,replied:0,closed:0};messages.forEach(m=>{const s=m.status||'new';if(counts[s]!==undefined)counts[s]++;});
    return `<div class="panel-card"><div class="admin-toolbar"><div><h2>Contact Messages</h2><div class="muted">Customer enquiries received from the Contact page.</div></div><button type="button" class="btn btn-primary" onclick="window.refreshContactMessages()">↻ Refresh</button></div><div class="stat-grid" style="grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:18px"><div class="stat-card" style="min-height:78px"><div class="val">${counts.new}</div><div class="lbl">New</div></div><div class="stat-card" style="min-height:78px"><div class="val">${counts.read}</div><div class="lbl">Read</div></div><div class="stat-card" style="min-height:78px"><div class="val">${counts.replied}</div><div class="lbl">Replied</div></div><div class="stat-card" style="min-height:78px"><div class="val">${counts.closed}</div><div class="lbl">Closed</div></div></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">${['all',...STATUSES].map(s=>`<button type="button" class="btn ${filter===s?'btn-primary':''}" onclick="window.filterContactMessages('${s}')">${s==='all'?'All':s.charAt(0).toUpperCase()+s.slice(1)}${s!=='all'?` (${counts[s]})`:''}</button>`).join('')}</div>${rows.length?`<table class="data-table" style="min-width:1120px"><thead><tr><th>Customer</th><th>Mobile / Email</th><th>Subject</th><th>Message</th><th>Date & Time</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map(m=>`<tr><td><strong>${esc(m.name||'—')}</strong></td><td>${esc(m.contact||'—')}</td><td>${esc(m.subject||'—')}</td><td style="max-width:340px;white-space:pre-wrap;overflow-wrap:anywhere">${esc(m.message||'—')}</td><td>${date(m.created_at)}</td><td>${chip(m.status||'new')}</td><td style="white-space:nowrap"><button type="button" class="btn btn-primary" onclick="window.replyContactMessage('${m.id}')">✉ Reply</button><select aria-label="Update message status" style="margin-left:6px" onchange="window.updateContactMessageStatus('${m.id}',this.value)">${STATUSES.map(s=>`<option value="${s}" ${(m.status||'new')===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table>`:`<div class="admin-empty">No contact messages found${filter!=='all'?` with status “${esc(filter)}”`:''}.</div>`}</div>`;
  }
  async function refresh(){try{await load();if(typeof adminTab!=='undefined'&&adminTab==='contact-messages')window.renderAdminContent();}catch(e){alert('Unable to load contact messages: '+(e.message||e));}}
  async function updateStatus(id,status){
    if(!STATUSES.includes(status))return;
    const previous=messages.find(m=>m.id===id)?.status||'new';if(previous===status)return;
    const {error}=await window.agriSupabase.from('contact_messages').update({status}).eq('id',id);
    if(error)throw error;
    const m=messages.find(x=>x.id===id);if(m)m.status=status;updateBadge();
    if(typeof adminTab!=='undefined'&&adminTab==='contact-messages')window.renderAdminContent();
  }
  function install(){
    if(!window.agriSupabase||!document.getElementById('adminMenu'))return;
    const original=window.adminContent;if(typeof original!=='function')return;
    window.adminContent=function(){return typeof adminTab!=='undefined'&&adminTab==='contact-messages'?panel():original();};
    const originalSet=window.setAdminTab;
    window.setAdminTab=function(t){adminTab=t;document.querySelectorAll('#adminMenu a').forEach(a=>a.classList.toggle('active',a.dataset.tab===t));window.renderAdminContent();if(t==='contact-messages')refresh();};
    window.refreshContactMessages=refresh;window.updateContactMessageStatus=(id,status)=>updateStatus(id,status).catch(e=>alert('Unable to update message status: '+(e.message||e)));window.replyContactMessage=replyMessage;window.sendContactReply=sendContactReply;window.closeContactReply=closeReply;window.filterContactMessages=s=>{filter=s;window.renderAdminContent();};
    menuLink();
    const menu=document.getElementById('adminMenu');
    if(menu&&!menu.__contactObserver){const observer=new MutationObserver(()=>menuLink());observer.observe(menu,{childList:true});menu.__contactObserver=observer;}
    load().then(()=>{updateBadge();if(typeof adminTab!=='undefined'&&adminTab==='contact-messages')window.renderAdminContent();}).catch(e=>console.warn('Contact messages load failed',e));
  }
  function boot(){let tries=0;const timer=setInterval(()=>{tries++;if(typeof window.adminContent==='function'&&typeof window.renderAdminContent==='function'&&document.getElementById('adminMenu')){clearInterval(timer);install();}else if(tries>100)clearInterval(timer);},100);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();