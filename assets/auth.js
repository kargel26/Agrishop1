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
    window.location.href = 'index.html';
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

  window.AgriAuth = { signUp, signIn, signOut, getCurrentUser, getProfile, requireRole };
})();
