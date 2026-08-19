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
// usable 60-minute API token. The code query param is itself the credential,
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
