const BASE_URL = '/api/v1'

// The auth service is a separate origin from the recipe backend behind /api.
// Override in local dev with VITE_AUTH_BASE_URL=http://localhost:8081/api
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL || 'https://auth.what4dinner.today/api'

function authHeaders() {
  const token = localStorage.getItem('auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
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
  const res = await fetch(`${BASE_URL}/recipe`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
