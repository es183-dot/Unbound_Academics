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

// Turns Supabase's raw error text into a clear, specific message -
// and deliberately does NOT reveal whether an email exists in the
// system (e.g. "wrong password" vs "no account found" would let an
// attacker enumerate real accounts). "Incorrect email or password"
// covers both cases on purpose.
function friendlyError(error) {
  if (!error) return null;
  const msg = (error.message || '').toLowerCase();
  if (msg.includes('already_registered')) {
    return 'An account with this email already exists. Try logging in instead.';
  }
  if (msg.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please check both and try again.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please confirm your email first - check your inbox for a confirmation link, then log in.';
  }
  if (msg.includes('user already registered')) {
    return 'An account with this email already exists. Try logging in instead.';
  }
  if (msg.includes('rate limit')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (msg.includes('password') && (msg.includes('6 characters') || msg.includes('8 characters'))) {
    return 'Password must be at least 8 characters.';
  }
  if (msg.includes('should be different from the old password')) {
    return 'New password must be different from your current password.';
  }
  if (msg.includes('same_password')) {
    return 'New password must be different from your current password.';
  }
  return error.message;
}

async function authSignUp(fullName, email, password) {
  if (!sb) return { error: { message: 'Accounts aren\'t fully set up yet - check back soon.' } };
  // Role is never taken from the client - the database trigger always
  // starts new accounts as 'client', regardless of what's sent here.
  const result = await sb.auth.signUp({
    email: email,
    password: password,
    options: { data: { full_name: fullName } }
  });
  // Supabase deliberately returns a normal-looking response (not an
  // error) when the email is already registered, to avoid letting an
  // attacker use signup to find out which emails have accounts. The
  // documented way to detect it client-side: a real new signup has at
  // least one entry in identities; an already-registered email comes
  // back with an empty identities array.
  if (!result.error && result.data && result.data.user && Array.isArray(result.data.user.identities) && result.data.user.identities.length === 0) {
    return { data: result.data, error: { message: 'ALREADY_REGISTERED' }, alreadyRegistered: true };
  }
  return result;
}

async function requestPasswordReset(email) {
  if (!sb) return { error: { message: 'Accounts aren\'t fully set up yet - check back soon.' } };
  return sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'reset-password.html'
  });
}

async function updatePassword(newPassword) {
  if (!sb) return { error: { message: 'Accounts aren\'t fully set up yet - check back soon.' } };
  return sb.auth.updateUser({ password: newPassword });
}

// Re-checks the current password before allowing a change, so someone
// who finds an account left logged in on a shared computer can't lock
// the real owner out just by knowing the new password they want to set.
async function changePasswordWithVerification(email, currentPassword, newPassword) {
  if (!sb) return { error: { message: 'Accounts aren\'t fully set up yet - check back soon.' } };
  const verify = await sb.auth.signInWithPassword({ email: email, password: currentPassword });
  if (verify.error) {
    return { error: { message: 'Current password is incorrect.' } };
  }
  return updatePassword(newPassword);
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
