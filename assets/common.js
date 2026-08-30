/* =========================================================================
   AGRIMART — SHARED HEADER / FOOTER / NAV (assets/common.js)
   Every page includes <div id="site-header"></div> and <div id="site-footer">
   </div> placeholders plus <body data-page="shop"> so this script can inject
   consistent markup and highlight the active nav link.
   ========================================================================= */

function renderHeader(){
  const el = document.getElementById('site-header');
  if(!el) return;
  const B = (typeof SITE_BASE!=='undefined') ? SITE_BASE : '';
  el.innerHTML = `
  <div id="topbar">
    <div class="container">
      <span>🌾 Trusted by 40,000+ farmers across India</span>
      <div class="tb-links">
        <span id="roleIndicator">Signed in as Customer</span>
        <a href="${B}seller.html" class="hide-mobile">Sell on AgriMart</a>
        <a href="${B}contact.html" class="hide-mobile">Help</a>
      </div>
    </div>
  </div>
  <header id="mainheader">
    <div class="container header-row">
      <a href="${B}index.html" class="logo">
        <svg class="leaf" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20C4 20 3 11 9 6C14 2 20 4 20 4C20 4 21 12 15 17C10 21 4 20 4 20Z" fill="#173B2B"/><path d="M4 20C7 15 11 11 20 4" stroke="#C89B3C" stroke-width="1.3" stroke-linecap="round"/></svg>
        AgriMart
      </a>
      <nav class="nav-desktop" id="navDesktop">
        <a href="${B}index.html" data-page="home">Home</a>
        <a href="${B}shop.html" data-page="shop">Shop</a>
        <a href="${B}shop.html" data-page="categories">Categories</a>
        <a href="${B}offers.html" data-page="offers">Offers</a>
        <a href="${B}about.html" data-page="about">About</a>
        <a href="${B}contact.html" data-page="contact">Contact</a>
      </nav>
      <div class="header-search">
        <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <input id="searchInput" type="text" placeholder="Search for seeds, fertilizers, tools…" autocomplete="off">
      </div>
      <div class="header-actions">
        <a href="${B}wishlist.html" class="icon-btn" title="Wishlist">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.5-4.6-10-9.3C.4 8 2 4 6 4c2.2 0 3.9 1.3 6 3.6C14.1 5.3 15.8 4 18 4c4 0 5.6 4 4 7.7C19.5 16.4 12 21 12 21z"/></svg>
          <span class="badge-count" id="wishBadge">0</span>
        </a>
        <a href="${B}cart.html" class="icon-btn" title="Cart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1.4"/><circle cx="19" cy="21" r="1.4"/><path d="M2 3h2l2.6 12.6a2 2 0 002 1.6h8.7a2 2 0 002-1.6L21 8H6"/></svg>
          <span class="badge-count" id="cartBadge">0</span>
        </a>
        <a href="${B}login.html" class="icon-btn" title="Account">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6"/></svg>
        </a>
      </div>
    </div>
  </header>
  <div id="mobilesearch">
    <div class="header-search">
      <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      <input id="searchInputMobile" type="text" placeholder="Search products…" autocomplete="off">
    </div>
  </div>
  <div id="mobilenav">
    <a href="${B}index.html" data-page="home">🏠<span>Home</span></a>
    <a href="${B}shop.html" data-page="shop">📂<span>Categories</span></a>
    <a href="${B}shop.html" data-page="search">🔍<span>Search</span></a>
    <a href="${B}cart.html" data-page="cart">🛒<span>Cart</span></a>
    <a href="${B}login.html" data-page="account">👤<span>Account</span></a>
  </div>`;
}

function renderFooter(){
  const el = document.getElementById('site-footer');
  if(!el) return;
  const B = (typeof SITE_BASE!=='undefined') ? SITE_BASE : '';
  el.innerHTML = `
  <footer>
    <div class="container footer-top">
      <div>
        <div class="flogo">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 20C4 20 3 11 9 6C14 2 20 4 20 4C20 4 21 12 15 17C10 21 4 20 4 20Z" fill="#fff"/></svg>
          AgriMart
        </div>
        <p class="fdesc">India's trusted marketplace connecting farmers, sellers and retailers — quality agricultural products delivered to your door.</p>
        <div class="socials">
          <a href="#" aria-label="Facebook">f</a><a href="#" aria-label="Instagram">ig</a><a href="#" aria-label="YouTube">yt</a><a href="#" aria-label="Twitter">x</a>
        </div>
      </div>
      <div><h5>Company</h5><ul>
        <li><a href="${B}about.html">About Us</a></li>
        <li><a href="${B}contact.html">Contact</a></li>
        <li><a href="${B}seller.html">Become a Seller</a></li>
        <li><a href="${B}contact.html">FAQ</a></li>
      </ul></div>
      <div><h5>Policies</h5><ul>
        <li><a href="${B}policies/privacy.html">Privacy Policy</a></li>
        <li><a href="${B}policies/terms.html">Terms &amp; Conditions</a></li>
        <li><a href="${B}policies/return.html">Return Policy</a></li>
        <li><a href="${B}policies/shipping.html">Shipping Policy</a></li>
        <li><a href="${B}policies/seller-policy.html">Seller Policy</a></li>
      </ul></div>
      <div><h5>Categories</h5><ul id="footerCats"></ul></div>
      <div><h5>Customer Support</h5><ul>
        <li>📞 ${CONTACT.phone}</li>
        <li>✉️ ${CONTACT.email}</li>
        <li>📍 ${CONTACT.address}</li>
        <li>Mon–Sat, 9am–7pm</li>
      </ul></div>
    </div>
    <div class="container footer-bottom">
      <span>© 2026 AgriMart Technologies Pvt. Ltd. All rights reserved.</span>
      <span>Made for Indian farmers 🌱 | Secure payments via Razorpay</span>
    </div>
  </footer>`;
  const fc = document.getElementById('footerCats');
  if(fc) fc.innerHTML = CATEGORIES.slice(0,5).map(c=>`<li><a href="${B}shop.html">${c.name}</a></li>`).join('');
}

function highlightNav(){
  const page = document.body.getAttribute('data-page');
  document.querySelectorAll('#navDesktop a, #mobilenav a').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('data-page')===page);
  });
}

function wireSearch(){
  ['searchInput','searchInputMobile'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('keydown', (e)=>{
      if(e.key==='Enter' && el.value.trim()){
        window.location.href = 'shop.html?q=' + encodeURIComponent(el.value.trim());
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  renderHeader();
  renderFooter();
  highlightNav();
  wireSearch();
  updateBadges();
  const roleEl = document.getElementById('roleIndicator');
  if(roleEl){ const r = state.role; roleEl.textContent = 'Signed in as ' + r.charAt(0).toUpperCase()+r.slice(1); }
  if(typeof initPage === 'function') initPage();
});
