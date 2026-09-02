/* Admin controls for the public Categories page. Loaded only on admin pages. */
(function(){
  const DEFAULT_DESCS={
    seeds:'Certified and hybrid crop seeds for field crops, vegetables and kitchen gardens.',
    fertilizers:'NPK, organic manure and other crop nutrition products for healthier soil and crops.',
    'crop-protection':'Crop protection and botanical products for responsible pest and disease management.',
    tools:'Hand tools and practical farming equipment for sowing, weeding, cultivation and maintenance.',
    irrigation:'Drip and water-management products designed to improve irrigation efficiency.',
    machinery:'Farm machinery and powered equipment for larger and more efficient operations.',
    organic:'Organic inputs, soil conditioners and natural farming essentials.',
    gardening:'Seeds, tools and supplies for home gardens, nurseries and small growing spaces.'
  };
  const DEFAULT_PAGE={is_active:true,eyebrow:'Browse Agriculture Products',title:'Shop by Category',description:'Find seeds, fertilizers, crop protection products, farming tools, irrigation systems, machinery, organic inputs and gardening supplies in one organized marketplace.',info_title:'Everything you need for better farming',info_text:'AgriMart brings essential agricultural products together so farmers can compare categories, discover products from sellers and continue directly to the relevant product listings.'};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const chip=v=>`<span class="status-chip chip-${String(v||'').toLowerCase().replace(/\s+/g,'-')}">${esc(v||'—')}</span>`;
  async function loadCategoryAdminData(){
    const s=window.agriSupabase;
    const [cats,page]=await Promise.all([
      s.from('categories').select('id,slug,name,icon,description,product_count,is_active,sort_order').order('sort_order',{ascending:true}).order('name',{ascending:true}),
      s.from('category_page_settings').select('*').eq('id',1).maybeSingle()
    ]);
    if(cats.error)throw cats.error;if(page.error)throw page.error;
    db.categories=cats.data||[];db.categoryPage=page.data||{...DEFAULT_PAGE};
  }
  function categoryPagePanel(){
    const p={...DEFAULT_PAGE,...(db.categoryPage||{})};
    const cats=(db.categories||[]).slice().sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
    return `<div class="panel-card"><div class="admin-toolbar"><div><h2>Categories Page Control</h2><div class="muted">Control the complete <b>/categories.html</b> page: page text, category cards, order, icons, descriptions, product counts and visibility.</div></div>${chip(p.is_active?'published':'hidden')}</div>
      <div class="hero-form" style="margin-bottom:22px">
        <div class="hero-field"><label>Publish Categories page</label><label class="hero-check"><input id="catpage_active" type="checkbox" ${p.is_active!==false?'checked':''}> Show this page content publicly</label></div>
        <div class="hero-grid-2"><div class="hero-field"><label>Eyebrow</label><input id="catpage_eyebrow" value="${esc(p.eyebrow)}"></div><div class="hero-field"><label>Main heading</label><input id="catpage_title" value="${esc(p.title)}"></div></div>
        <div class="hero-field"><label>Page description</label><textarea id="catpage_description">${esc(p.description)}</textarea></div>
        <div class="hero-grid-2"><div class="hero-field"><label>Bottom info heading</label><input id="catpage_info_title" value="${esc(p.info_title)}"></div><div class="hero-field"><label>Bottom info text</label><textarea id="catpage_info_text">${esc(p.info_text)}</textarea></div></div>
        <div class="save-row"><span class="save-status" id="catpage_save_status"></span><button type="button" class="btn btn-primary" onclick="saveCategoryPageSettings()">Save Page Settings</button></div>
      </div>
      <div class="admin-toolbar"><div><h3 style="margin:0">Category Cards</h3><div class="muted">Changes here are reflected on the public Categories page.</div></div><button type="button" class="btn btn-primary" onclick="addCategoryCard()">+ Add Category</button></div>
      <div class="panel-card" style="box-shadow:none;padding:10px;overflow:auto"><table class="data-table"><thead><tr><th>Order</th><th>Icon</th><th>Name</th><th>Slug</th><th>Description</th><th>Products</th><th>Visible</th><th>Action</th></tr></thead><tbody>${cats.map(c=>`<tr><td><input class="cat-order" data-id="${c.id}" value="${Number(c.sort_order||0)}" type="number" style="width:65px"></td><td><input class="cat-icon" data-id="${c.id}" value="${esc(c.icon||'')}" style="width:65px"></td><td><input class="cat-name" data-id="${c.id}" value="${esc(c.name||'')}" style="min-width:130px"></td><td><input class="cat-slug" data-id="${c.id}" value="${esc(c.slug||'')}" style="min-width:120px"></td><td><input class="cat-desc" data-id="${c.id}" value="${esc(c.description||DEFAULT_DESCS[c.slug]||'')}" style="min-width:260px"></td><td><input class="cat-count" data-id="${c.id}" value="${Number(c.product_count||0)}" type="number" min="0" style="width:90px"></td><td><input class="cat-active" data-id="${c.id}" type="checkbox" ${c.is_active!==false?'checked':''}></td><td><button type="button" class="btn btn-primary" onclick="saveCategory('${c.id}')">Save</button> <button type="button" class="btn" onclick="deleteCategory('${c.id}','${esc(c.name)}')">Delete</button></td></tr>`).join('')}</tbody></table></div>
    </div>`;
  }
  async function refresh(){try{await loadCategoryAdminData();if(typeof renderAdminContent==='function')renderAdminContent();}catch(e){const box=document.getElementById('adminContent');if(box)box.innerHTML=`<div class="admin-error">Unable to load category controls: ${esc(e.message||e)}</div>`;}}
  window.saveCategoryPageSettings=async function(){const st=document.getElementById('catpage_save_status');st.textContent='Saving…';try{const payload={id:1,is_active:document.getElementById('catpage_active').checked,eyebrow:document.getElementById('catpage_eyebrow').value.trim(),title:document.getElementById('catpage_title').value.trim(),description:document.getElementById('catpage_description').value.trim(),info_title:document.getElementById('catpage_info_title').value.trim(),info_text:document.getElementById('catpage_info_text').value.trim(),updated_at:new Date().toISOString()};const {error}=await window.agriSupabase.from('category_page_settings').upsert(payload,{onConflict:'id'});if(error)throw error;db.categoryPage=payload;st.textContent='Saved successfully.';setTimeout(()=>st.textContent='',4000);}catch(e){st.textContent='Save failed: '+(e.message||e);}};
  window.saveCategory=async function(id){const row=document.querySelector(`.cat-name[data-id="${id}"]`)?.closest('tr');if(!row)return;const payload={name:row.querySelector('.cat-name').value.trim(),slug:row.querySelector('.cat-slug').value.trim(),icon:row.querySelector('.cat-icon').value.trim(),description:row.querySelector('.cat-desc').value.trim(),product_count:Math.max(0,Number(row.querySelector('.cat-count').value||0)),is_active:row.querySelector('.cat-active').checked,sort_order:Number(row.querySelector('.cat-order').value||0)};if(!payload.name||!payload.slug){alert('Category name and slug are required.');return;}try{const {error}=await window.agriSupabase.from('categories').update(payload).eq('id',id);if(error)throw error;await refresh();alert('Category saved successfully.');}catch(e){alert(e.message||'Unable to save category.');}};
  window.addCategoryCard=async function(){const name=prompt('Category name?');if(!name)return;const slug=(prompt('Category slug?',name.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''))||'').trim();if(!slug)return;const icon=prompt('Category icon/emoji?','🌱')||'🌱';const description=prompt('Category description?','Explore agricultural products in this category.')||'';const sort_order=((db.categories||[]).reduce((m,c)=>Math.max(m,Number(c.sort_order||0)),0)+1);try{const {error}=await window.agriSupabase.from('categories').insert({name,slug,icon,description,product_count:0,is_active:true,sort_order});if(error)throw error;await refresh();}catch(e){alert(e.message||'Unable to add category.');}};
  window.deleteCategory=async function(id,name){if(!confirm(`Delete "${name}"? If products still reference this category, the database may reject deletion.`))return;try{const {error}=await window.agriSupabase.from('categories').delete().eq('id',id);if(error)throw error;await refresh();}catch(e){alert(e.message||'Unable to delete category.');}};
  const originalLoad=window.loadAdminData,originalContent=window.adminContent;
  window.loadAdminData=async function(){await originalLoad();try{await loadCategoryAdminData();}catch(e){console.warn('Category admin data unavailable',e);}};
  window.adminContent=function(){if(window.adminTab==='categories')return categoryPagePanel();return originalContent();};
  window.setAdminTab=(function(orig){return function(t){orig(t);if(t==='categories')refresh();};})(window.setAdminTab);
  /* If the admin dashboard already initialized before this script loaded, refresh category data now. */
  if(document.body.getAttribute('data-page')==='admin')setTimeout(()=>{if(window.adminTab==='categories')refresh();},0);
})();
