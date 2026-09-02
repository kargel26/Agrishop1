/* Admin controls for the public About page. Loaded only on admin.html. */
(function(){
  const DEFAULT={
    is_active:true,
    page_title:'About Us — AgriMart',
    hero_visible:true,
    hero_eyebrow:'Our Story',
    hero_title:'Built for the people who feed the nation',
    hero_description:'AgriMart was founded to close the gap between India\'s farmers and the quality agricultural inputs they need — at fair prices, with verified sellers, and delivery that reaches every district.',
    stats_visible:true,
    stats:[{value:'2019',label:'Founded'},{value:'28 States',label:'Delivery Coverage'},{value:'500+',label:'Verified Sellers'},{value:'40,000+',label:'Farmers Served'}],
    mission_visible:true,
    mission_eyebrow:'Our mission',
    mission_title:'Quality inputs. Fair prices. Real support.',
    mission_text:'We work directly with manufacturers and verified regional distributors to bring authentic, quality-checked agricultural products to every farmer — with the same convenience, trust and support that urban shoppers expect from e-commerce.'
  };
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const chip=v=>`<span class="status-chip chip-${v?'published':'hidden'}">${v?'published':'hidden'}</span>`;
  async function loadAboutAdminData(){
    const {data,error}=await window.agriSupabase.from('about_page_settings').select('*').eq('id',1).maybeSingle();
    if(error)throw error;
    db.aboutPage=data||{...DEFAULT};
  }
  function aboutPagePanel(){
    const p={...DEFAULT,...(db.aboutPage||{})};
    const stats=Array.isArray(p.stats)&&p.stats.length?p.stats:DEFAULT.stats;
    return `<div class="panel-card"><div class="admin-toolbar"><div><h2>About Page Control</h2><div class="muted">Fully control the complete <b>/about.html</b> page: browser title, visibility, hero content, statistics and mission section.</div></div>${chip(p.is_active!==false)}</div>
      <div class="hero-form">
        <div class="hero-field"><label>Publish About page</label><label class="hero-check"><input id="about_active" type="checkbox" ${p.is_active!==false?'checked':''}> Show About page publicly</label></div>
        <div class="hero-field"><label>Browser / page title</label><input id="about_page_title" value="${esc(p.page_title)}"></div>
        <div class="hero-field"><label>Hero section</label><label class="hero-check"><input id="about_hero_visible" type="checkbox" ${p.hero_visible!==false?'checked':''}> Show hero section</label></div>
        <div class="hero-grid-2"><div class="hero-field"><label>Hero eyebrow</label><input id="about_hero_eyebrow" value="${esc(p.hero_eyebrow)}"></div><div class="hero-field"><label>Hero heading</label><input id="about_hero_title" value="${esc(p.hero_title)}"></div></div>
        <div class="hero-field"><label>Hero description</label><textarea id="about_hero_description">${esc(p.hero_description)}</textarea></div>
        <div class="hero-field"><label>Statistics section</label><label class="hero-check"><input id="about_stats_visible" type="checkbox" ${p.stats_visible!==false?'checked':''}> Show statistics section</label></div>
        <div class="admin-toolbar" style="margin:0"><div><h3 style="margin:0">Statistics</h3><div class="muted">Add, edit, remove and reorder the visible stat cards.</div></div><button type="button" class="btn btn-primary" onclick="window.addAboutStat()">+ Add Stat</button></div>
        <div id="aboutStatsEditor" class="stat-editor">${stats.map((s,i)=>`<div class="stat-editor-row" data-index="${i}"><input class="about-stat-value" value="${esc(s.value||'')}" placeholder="Value"><input class="about-stat-label" value="${esc(s.label||'')}" placeholder="Label"><button type="button" class="btn" onclick="window.removeAboutStat(${i})">Remove</button></div>`).join('')}</div>
        <div class="hero-field"><label>Mission section</label><label class="hero-check"><input id="about_mission_visible" type="checkbox" ${p.mission_visible!==false?'checked':''}> Show mission section</label></div>
        <div class="hero-grid-2"><div class="hero-field"><label>Mission eyebrow</label><input id="about_mission_eyebrow" value="${esc(p.mission_eyebrow)}"></div><div class="hero-field"><label>Mission heading</label><input id="about_mission_title" value="${esc(p.mission_title)}"></div></div>
        <div class="hero-field"><label>Mission text</label><textarea id="about_mission_text">${esc(p.mission_text)}</textarea></div>
        <div class="save-row"><span class="save-status" id="about_save_status"></span><button type="button" class="btn btn-primary" onclick="window.saveAboutPageSettings()">Save About Page</button></div>
      </div>
      <div class="panel-card" style="box-shadow:none;margin-top:20px;background:var(--bg-alt)"><h3>Live Preview</h3><div id="aboutAdminPreview"></div></div>
    </div>`;
  }
  function renderPreview(){
    const box=document.getElementById('aboutAdminPreview');if(!box)return;
    const p={...DEFAULT,...(db.aboutPage||{})};
    const stats=Array.isArray(p.stats)?p.stats:DEFAULT.stats;
    box.innerHTML=`<div style="background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden"><div style="padding:30px;background:var(--bg-alt)"><div style="font-size:11px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:.08em">${esc(p.hero_eyebrow)}</div><h3 style="font-family:var(--font-display);font-size:28px;margin:8px 0">${esc(p.hero_title)}</h3><p style="margin:0;max-width:720px;color:var(--ink-soft)">${esc(p.hero_description)}</p></div><div style="padding:22px"><div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px">${stats.slice(0,8).map(s=>`<div style="padding:14px;border:1px solid var(--line);border-radius:10px;text-align:center"><div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--primary)">${esc(s.value)}</div><div style="font-size:11px;color:var(--ink-soft)">${esc(s.label)}</div></div>`).join('')}</div><div style="margin-top:20px;padding:20px;border-radius:10px;background:var(--bg-alt)"><div style="font-size:11px;font-weight:700;color:var(--primary);text-transform:uppercase">${esc(p.mission_eyebrow)}</div><h4 style="font-size:20px;margin:7px 0">${esc(p.mission_title)}</h4><p style="margin:0;color:var(--ink-soft)">${esc(p.mission_text)}</p></div></div></div>`;
  }
  async function refresh(){try{await loadAboutAdminData();if(typeof renderAdminContent==='function')renderAdminContent();setTimeout(renderPreview,0);}catch(e){const box=document.getElementById('adminContent');if(box)box.innerHTML=`<div class="admin-error">Unable to load About page controls: ${esc(e.message||e)}</div>`;}}
  window.saveAboutPageSettings=async function(){
    const st=document.getElementById('about_save_status');if(!st)return;st.textContent='Saving…';
    try{
      const stats=[...document.querySelectorAll('#aboutStatsEditor .stat-editor-row')].map(row=>({value:row.querySelector('.about-stat-value').value.trim(),label:row.querySelector('.about-stat-label').value.trim()})).filter(x=>x.value&&x.label);
      const payload={id:1,is_active:document.getElementById('about_active').checked,page_title:document.getElementById('about_page_title').value.trim()||DEFAULT.page_title,hero_visible:document.getElementById('about_hero_visible').checked,hero_eyebrow:document.getElementById('about_hero_eyebrow').value.trim(),hero_title:document.getElementById('about_hero_title').value.trim(),hero_description:document.getElementById('about_hero_description').value.trim(),stats_visible:document.getElementById('about_stats_visible').checked,stats,mission_visible:document.getElementById('about_mission_visible').checked,mission_eyebrow:document.getElementById('about_mission_eyebrow').value.trim(),mission_title:document.getElementById('about_mission_title').value.trim(),mission_text:document.getElementById('about_mission_text').value.trim(),updated_at:new Date().toISOString()};
      const {error}=await window.agriSupabase.from('about_page_settings').upsert(payload,{onConflict:'id'});if(error)throw error;db.aboutPage=payload;st.textContent='Saved successfully.';setTimeout(()=>st.textContent='',4000);renderPreview();
    }catch(e){st.textContent='Save failed: '+(e.message||e);}
  };
  window.addAboutStat=function(){const editor=document.getElementById('aboutStatsEditor');if(!editor)return;const row=document.createElement('div');row.className='stat-editor-row';row.dataset.index=String(editor.children.length);row.innerHTML='<input class="about-stat-value" placeholder="Value"><input class="about-stat-label" placeholder="Label"><button type="button" class="btn" onclick="this.parentElement.remove()">Remove</button>';editor.appendChild(row);};
  window.removeAboutStat=function(i){const rows=document.querySelectorAll('#aboutStatsEditor .stat-editor-row');if(rows[i])rows[i].remove();};
  const originalLoad=window.loadAdminData,originalContent=window.adminContent;
  window.loadAdminData=async function(){await originalLoad();try{await loadAboutAdminData();}catch(e){console.warn('About page admin data unavailable',e);}};
  window.adminContent=function(){if(window.adminTab==='about-page')return aboutPagePanel();return originalContent();};
  window.setAdminTab=(function(orig){return function(t){orig(t);if(t==='about-page')refresh();};})(window.setAdminTab);
  function menuLink(){const menu=document.getElementById('adminMenu');if(!menu||menu.querySelector('[data-tab="about-page"]'))return;const a=document.createElement('a');a.href='#';a.dataset.tab='about-page';a.textContent='About Page';a.onclick=e=>{e.preventDefault();window.setAdminTab('about-page');};menu.appendChild(a);}
  function boot(){let tries=0;const timer=setInterval(()=>{tries++;menuLink();if(typeof window.adminContent==='function'&&typeof window.renderAdminContent==='function'&&document.getElementById('adminMenu')){clearInterval(timer);menuLink();}else if(tries>100)clearInterval(timer);},100);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
