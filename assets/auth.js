(function () {
  function getClient() { return window.agriSupabase; }

  async function signUp(email, password, fullName, phone) {
    const { data, error } = await getClient().auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName || null, phone: phone || null } }
    });
    if (error) throw error;
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await getClient().auth.signInWithPassword({
      email: email.trim(),
      password
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await getClient().auth.signOut();
    if (error) throw error;
    window.location.href = '/';
  }

  async function getCurrentUser() {
    const { data } = await getClient().auth.getUser();
    return data && data.user ? data.user : null;
  }

  async function getProfile(userId) {
    const { data, error } = await getClient()
      .from('profiles')
      .select('id, full_name, phone, role, avatar_url')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function requireRole(roles) {
    const user = await getCurrentUser();
    if (!user) { window.location.href = 'login.html'; return null; }
    const profile = await getProfile(user.id);
    if (!profile || !roles.includes(profile.role)) {
      alert('You do not have permission to access this page.');
      window.location.href = 'index.html';
      return null;
    }
    return { user, profile };
  }

  function addSellerLogoutButton() {
    if (!['/seller/dashboard', '/seller/dashboard/'].includes(window.location.pathname)) return;
    const top = document.querySelector('.top');
    if (!top || document.getElementById('sellerLogoutBtn')) return;
    top.style.display = 'flex';
    top.style.justifyContent = 'space-between';
    top.style.alignItems = 'center';
    top.style.gap = '16px';

    const button = document.createElement('button');
    button.id = 'sellerLogoutBtn';
    button.type = 'button';
    button.textContent = 'Log Out';
    button.style.cssText = 'border:1px solid #ffffff66;background:#fff;color:#173b2b;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;white-space:nowrap';
    button.addEventListener('click', async function () {
      if (!confirm('Are you sure you want to log out?')) return;
      button.disabled = true;
      button.textContent = 'Logging out…';
      try {
        await signOut();
      } catch (error) {
        button.disabled = false;
        button.textContent = 'Log Out';
        alert(error.message || 'Unable to log out. Please try again.');
      }
    });
    top.appendChild(button);
  }

  window.AgriAuth = { signUp, signIn, signOut, getCurrentUser, getProfile, requireRole };
  addSellerLogoutButton();
})();
