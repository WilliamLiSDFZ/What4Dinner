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

// Creates the recipe, its ordered steps and each step's ingredients in a single
// transaction — if any part is rejected, nothing is written. Step order is
// positional (taken from the array index), so no step_order is ever sent, and
// every ingredientId must already exist in the caller's family. A 400 means a
// blank title, a negative time or amount, or an unknown ingredient.
export async function createRecipe(recipe) {
  const res = await apiFetch(`${BASE_URL}/recipe`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(recipe),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Hands photos to the AI pipeline and returns at once — the work runs in the
// background. Upload each photo with purpose 'recipe-raw' first (the AI input
// record, distinct from the 'recipe' display photos). At most 10 keys.
// The 202 body already carries a usable `recipeId`: the recipe row exists at
// status 'pending' with a placeholder title, so the caller can navigate to it
// immediately and watch it fill in. A 503 means the model or task store is
// unreachable and nothing was written.
export async function generateRecipe(imageKeys) {
  const res = await apiFetch(`${BASE_URL}/recipe/generate`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageKeys }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// The same pipeline as generateRecipe, from a Xiaohongshu share link instead of
// photos: the backend fetches the post's text and images itself, so there is no
// upload-url step here and the client sends no keys. Having the post's body text
// gives the model far more to work with than photos alone.
// Pass the share text *verbatim* — the link inside it must keep its xsec_token
// or the import is refused. The 202 body and the task it names are identical to
// the photo path's, so the caller polls it through getGenerationTask all the same.
// A 400 means no usable link was found in the text; a 422 means the link lost its
// token. Anything that goes wrong after the 202 — expired token, deleted post —
// arrives as a failed task rather than an error here.
export async function generateRecipeFromLink(shareText) {
  const res = await apiFetch(`${BASE_URL}/recipe/generate/link`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ shareText }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Paints a photo of the finished dish and attaches it to the recipe. No request
// body — everything the models need is already on the recipe and its original
// photos. Returns 202 and is polled through the same getGenerationTask as recipe
// generation; the extra `imageId` names the recipe_images row being filled in.
// While it runs that row is deliberately *not* returned by getRecipe, so there is
// never a half-made image to filter out — but nothing appears either, so the wait
// has to be shown client-side.
// Repeat calls are allowed and simply append another image. Each one is a real
// image-model call with no per-family quota, so do not fire it speculatively.
export async function generateRecipeImage(recipeId) {
  const res = await apiFetch(`${BASE_URL}/recipe/${recipeId}/image/generate`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// The generation task's current state: pending -> processing -> done | failed.
// Progress is normally followed through the recipe's own `status`, which works
// without a task id and survives the task's 24h TTL; this is only used to
// recover `errorMessage` after a failure, which the recipe row does not carry.
// A 404 means an unknown or expired task — distinct from the 503 that means the
// task store itself is unreachable.
export async function getGenerationTask(taskId) {
  const res = await apiFetch(`${BASE_URL}/recipe/generate/${taskId}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Mirrors setFavorite: takes the desired state rather than toggling, so retries
// and double-taps are idempotent and can never double-count. Resolves to the
// refreshed { recipeId, liked, likeCount }, so no follow-up read is needed.
// `likeCount` is the global total; `liked` is only this user's own state.
export async function setLike(recipeId, liked) {
  const res = await apiFetch(`${BASE_URL}/like/${recipeId}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ liked }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Mirrors the contentType allowlist the upload-url endpoint enforces, so a file
// the backend would reject is filtered out at pick time rather than at save.
// Lives here beside getUploadUrl because it is that endpoint's contract, not any
// one page's; both the add form and the detail page read it.
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

// Asks for a short-lived signed PUT URL. The object key is always generated
// server-side — `purpose` and `contentType` are only lookup keys against fixed
// allowlists, never interpolated into the path.
export async function getUploadUrl(purpose, contentType) {
  const res = await apiFetch(`${BASE_URL}/image/upload-url`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ purpose, contentType }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Deliberately a bare fetch, not apiFetch: this goes straight to GCS rather than
// our backend, so the 401 -> logout handling would be wrong, and the signature
// covers content-type;host — an Authorization header (or any other extra header)
// would fail it with SignatureDoesNotMatch. The method and headers come from the
// upload-url response verbatim rather than being re-derived here.
export async function uploadToSignedUrl({ uploadUrl, method, requiredHeaders }, file) {
  const res = await fetch(uploadUrl, { method, headers: requiredHeaders, body: file })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

// Attaches already-uploaded photos to the recipe itself — recipe-level images,
// which are a different set from steps[].images. The recipe has to exist first,
// so this is the detail page's job rather than the create form's.
// `primaryIndex` picks the cover and is left out entirely when null, which tells
// the backend to append without disturbing any existing cover. There is no way
// to change a cover afterwards, and no endpoint to detach or reorder an image.
// Resolves to *every* image on the recipe, ordered by displayOrder, so the
// response replaces the local list rather than being appended to it.
export async function addRecipeImages(recipeId, imageKeys, primaryIndex = null) {
  const res = await apiFetch(`${BASE_URL}/recipe/${recipeId}/image`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(primaryIndex == null ? { imageKeys } : { imageKeys, primaryIndex }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// 204 No Content: the one endpoint here with no body, so it must not call
// res.json() — resolving to undefined is correct, not an oversight.
// Family-scoped: any member may delete any of the family's recipes, and
// everything attached (steps, images, favorites, likes, shopping-list entries)
// cascades away with it. A 404 means "not in your family".
export async function deleteRecipe(recipeId) {
  const res = await apiFetch(`${BASE_URL}/recipe/${recipeId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

// One recipe in full: header, your favorite/like state, and steps ordered by
// stepOrder with their ingredients (names joined in, so no second call) and
// images. Family-scoped, so a 404 means "not in your family".
// `steps[].images` are short-lived *signed GET URLs*, not object keys — they
// expire in about 15 minutes, so fetch this fresh rather than caching them.
export async function getRecipe(recipeId) {
  const res = await apiFetch(`${BASE_URL}/recipe/${recipeId}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// The family's shared shopping list. Each recipe carries its own ingredients
// (no checked state — a shared ingredient appears under every recipe using it),
// while the top-level `ingredients` is de-duplicated and owns `checked`.
// Recipe entries here are slimmer than getRecipes' rows: no like/favorite state.
export async function getShoppingList() {
  const res = await apiFetch(`${BASE_URL}/shopping-list`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// 204 No Content, so no res.json(). Idempotent: re-adding a recipe already on
// the list keeps its checked state. A 400 means the recipe has no ingredients.
export async function addToShoppingList(recipeId) {
  const res = await apiFetch(`${BASE_URL}/shopping-list/recipes/${recipeId}`, {
    method: 'PUT',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

// 204 No Content. Ingredients still used by another recipe on the list stay, and
// their checked state is recomputed server-side — re-read the list afterwards
// rather than deriving it locally.
export async function removeFromShoppingList(recipeId) {
  const res = await apiFetch(`${BASE_URL}/shopping-list/recipes/${recipeId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

// Takes the desired state rather than toggling, so it is idempotent. Applies to
// the ingredient for every recipe on the list that uses it.
export async function setIngredientChecked(ingredientId, checked) {
  const res = await apiFetch(`${BASE_URL}/shopping-list/ingredients/${ingredientId}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ checked }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
