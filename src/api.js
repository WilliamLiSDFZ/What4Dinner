const BASE_URL = '/api/v1'

// The auth service is a separate origin from the recipe backend behind /api.
// Override in local dev with VITE_AUTH_BASE_URL=http://localhost:8081/api
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL || 'https://auth.what4dinner.today/api'

const LOGIN_URL = 'https://auth.what4dinner.today/login'

function authHeaders() {
  const token = localStorage.getItem('auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Signing out is purely client-side: the JWT is stateless and the auth service
// exposes no revoke endpoint, so dropping the stored token is the whole
// operation. Shared by the logout button and the 401 handler below.
export function logout() {
  localStorage.removeItem('auth_token')
  window.location.href = LOGIN_URL
}

// Shared wrapper for token-authenticated requests. A 401 means the stored token
// is missing/expired, so drop it and bounce the user to the auth service login.
async function apiFetch(url, options) {
  const res = await fetch(url, options)
  if (res.status === 401) {
    logout()
    throw new Error('Unauthorized — redirecting to login')
  }
  return res
}

// Trade the short-lived one-time `code` from the OAuth callback for the
// usable 12-hour API token. The code query param is itself the credential,
// so no Authorization header is sent.
export async function exchangeCode(code) {
  const res = await fetch(`${AUTH_BASE_URL}/v1/exchange-code?code=${encodeURIComponent(code)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const { token } = await res.json()
  return token
}

export async function getRecipes() {
  const res = await apiFetch(`${BASE_URL}/recipe`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Recipe summaries the user has favorited, newest favorite first. Same shape as
// getRecipes — favorites are not scoped to the recipe's owner.
export async function getFavorites() {
  const res = await apiFetch(`${BASE_URL}/favorite`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Takes the desired state rather than toggling, so retries and double-clicks are
// idempotent. Passing `true` favorites a recipe, `false` unfavorites it.
export async function setFavorite(recipeId, favorited) {
  const res = await apiFetch(`${BASE_URL}/favorite/${recipeId}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ favorited }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// The signed-in user's own profile. The auth service only mints tokens and has
// no profile endpoint, so identity comes from the recipe backend, scoped by the
// JWT `sub` claim rather than any id we send.
export async function getMe() {
  const res = await apiFetch(`${BASE_URL}/user/me`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// The caller's family and its members, oldest member first. The family is
// resolved server-side from the JWT, so there is nothing to pass in.
export async function getFamily() {
  const res = await apiFetch(`${BASE_URL}/family`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Ingredients belong to the caller's family, resolved from the JWT, so there is
// nothing to pass in. Newest first.
export async function getIngredients() {
  const res = await apiFetch(`${BASE_URL}/ingredient`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Takes an options object because only `name` is required and the argument list
// otherwise mirrors the JSON body one-for-one. `categoryId` has no listing
// endpoint yet, so callers leave it null; `referencePrice` and `lastPurchase`
// are optional (the backend stores 0 / null for them). `lastPurchase` goes in as
// a plain yyyy-MM-dd date and comes back as a midnight timestamp.
// A 409 means the family already has an ingredient by that name; a 400 means a
// negative price or a malformed date.
export async function createIngredient({
  name,
  categoryId = null,
  referencePrice = null,
  lastPurchase = null,
}) {
  const res = await apiFetch(`${BASE_URL}/ingredient`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, categoryId, referencePrice, lastPurchase }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Settings are grouped by scope on purpose, so read `settings.family.timezone`
// rather than a top-level `timezone` — future groups arrive as sibling keys.
// The family group lives on the family row, so it is shared by every member.
export async function getSettings() {
  const res = await apiFetch(`${BASE_URL}/setting`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Partial at both levels: omitted groups and omitted fields inside a group are
// left alone, so callers pass an already-nested patch like
// { family: { timezone } }. Resolves to the full document after the change.
// A 400 means an invalid IANA zone id (case-sensitive) or ISO 4217 code.
export async function updateSettings(patch) {
  const res = await apiFetch(`${BASE_URL}/setting`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
