/* AgriMart Supabase client
   Uses the project's publishable key. Never put a Supabase service_role key in frontend code.
*/
(function () {
  const SUPABASE_URL = 'https://ggrypjuwwmiisgtgpozj.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_u12UwcUj8vGHAdo-Lex5kg_ve7PzPxh';

  if (!window.supabase) {
    console.error('Supabase JS SDK is not loaded. Add the Supabase UMD script before this file.');
    return;
  }

  window.agriSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
})();
