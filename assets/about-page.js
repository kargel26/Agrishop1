/* Public About page renderer. Content is controlled from the admin dashboard. */
(function(){
  const DEFAULT={
    is_active:true,
    page_title:'About Us — AgriMart',
    hero_visible:true,
    hero_eyebrow:'Our Story',
    hero_title:'Built for the people who feed the nation',
    hero_description:'AgriMart was founded to close the gap between India\'s farmers and the quality agricultural inputs they need — at fair prices, with verified sellers, and delivery that reaches every district.',
    stats_visible:true,
    stats:[
      {value:'2019',label:'Founded'},
      {value:'28 States',label:'Delivery Coverage'},
      {value:'500+',label:'Verified Sellers'},
      {value:'40,000+',label:'Farmers Served'}
    ],
    mission_visible:true,
    mission_eyebrow:'Our mission',
    mission_title:'Quality inputs. Fair prices. Real support.',
    mission_text:'We work directly with manufacturers and verified regional distributors to bring authentic, quality-checked agricultural products to every farmer — with the same convenience, trust and support that urban shoppers expect from e-commerce.'
  };
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render(p){
    p={...DEFAULT,...(p||{})};
    document.title=p.page_title||DEFAULT.page_title;
    const main=document.querySelector('main');
    if(!main)return;
    if(p.is_active===false){
      main.innerHTML='<div class="container"><section class="pad"><div class="panel-card" style="max-width:760px;margin:40px auto;text-align:center"><h2>About AgriMart</h2><p class="sub">This page is temporarily unavailable.</p></div></section></div>';
      return;
    }
    const stats=Array.isArray(p.stats)?p.stats.filter(x=>x&&String(x.value??'').trim()&&String(x.label??'').trim()):[];
    main.innerHTML=`
      ${p.hero_visible!==false?`<div class="hero" style="padding:0"><div class="container hero-inner" style="grid-template-columns:1fr;padding:56px 0"><div style="max-width:640px"><span class="hero-eyebrow">${esc(p.hero_eyebrow)}</span><h1 style="font-size:36px">${esc(p.hero_title)}</h1><p class="sub">${esc(p.hero_description)}</p></div></div></div>`:''}
      ${p.stats_visible!==false?`<section class="pad"><div class="container"><div class="stat-grid">${stats.map(s=>`<div class="stat-card center"><div class="val">${esc(s.value)}</div><div class="lbl">${esc(s.label)}</div></div>`).join('')}</div></div></section>`:''}
      ${p.mission_visible!==false?`<section class="pad bg-alt"><div class="container"><div class="section-head"><div><span class="eyebrow">${esc(p.mission_eyebrow)}</span><h2>${esc(p.mission_title)}</h2><p>${esc(p.mission_text)}</p></div></div></div></section>`:''}
    `;
  }
  async function load(){
    render(DEFAULT);
    try{
      if(!window.agriSupabase)return;
      const {data,error}=await window.agriSupabase.from('about_page_settings').select('*').eq('id',1).maybeSingle();
      if(error)throw error;
      render(data||DEFAULT);
    }catch(e){console.warn('About page settings unavailable; using defaults.',e);}
  }
  document.addEventListener('DOMContentLoaded',load);
})();
