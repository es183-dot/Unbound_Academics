// Fill these in once your Supabase project exists (Project Settings -> API).
// SUPABASE_ANON_KEY is the public "anon" key - safe for client-side code.
// Never put the "service_role" key here or anywhere in this repo.
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const isConfigured = SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL';
const sb = isConfigured && window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = 'form-msg show ' + type;
}

async function authSignUp(fullName, role, email, password) {
  if (!sb) return { error: { message: 'Accounts aren\'t fully set up yet - check back soon.' } };
  return sb.auth.signUp({
    email: email,
    password: password,
    options: { data: { full_name: fullName, role: role } }
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
