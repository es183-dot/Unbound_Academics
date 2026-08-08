// Project Settings -> API. SUPABASE_ANON_KEY holds the "publishable" key -
// safe for client-side code. Never put the "secret" key (formerly called
// "service_role") here or anywhere in this repo - it bypasses every
// Row Level Security rule on the database.
const SUPABASE_URL = 'https://dqkxqncuvahkmgtlsyrv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_y912K22_A7VYyo6ibnNrlg_O7EDfJ1P';

const isConfigured = SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL';
const sb = isConfigured && window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = 'form-msg show ' + type;
}

async function authSignUp(fullName, email, password) {
  if (!sb) return { error: { message: 'Accounts aren\'t fully set up yet - check back soon.' } };
  // Role is never taken from the client - the database trigger always
  // starts new accounts as 'client', regardless of what's sent here.
  return sb.auth.signUp({
    email: email,
    password: password,
    options: { data: { full_name: fullName } }
  });
}

async function authSignIn(email, password) {
  if (!sb) return { error: { message: 'Accounts aren\'t fully set up yet - check back soon.' } };
  return sb.auth.signInWithPassword({ email: email, password: password });
}

async function authSignOut() {
  if (!sb) return;
  await sb.auth.signOut();
}

async function getCurrentProfile() {
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;
  const { data: profile } = await sb
    .from('profiles')
    .select('full_name, role')
    .eq('id', session.user.id)
    .single();
  return profile ? { full_name: profile.full_name, role: profile.role, email: session.user.email } : null;
}

// Admin-only from here down. These calls only ever return data for
// accounts with role = 'admin' - enforced by Supabase's Row Level
// Security policies on the profiles table, not by anything in this
// file. A non-admin calling these gets back only their own row (or
// a failed update), no matter what the page around it does.

async function getAllProfiles() {
  if (!sb) return [];
  const { data } = await sb
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false });
  return data || [];
}

async function setProfileRole(userId, newRole) {
  if (!sb) return { error: { message: 'Accounts aren\'t fully set up yet - check back soon.' } };
  return sb.from('profiles').update({ role: newRole }).eq('id', userId);
}
