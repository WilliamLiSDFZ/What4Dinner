# What4DinnerAuth - Frontend Integration Guide

Base URL: `https://auth.what4dinner.today/api` (local: `http://localhost:8081/api`)

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

The JWT is valid for 12 hours and contains:
- `sub` — user ID
- `email` — user email
- `iss` — `what4dinner-auth`

The token carries **identity only**. It deliberately does not contain `family_id`: a user's family
can change, tokens live for 12 hours and cannot be revoked, so a family id baked into the token
would keep granting access to the family the user just left. Services that need the caller's family
read `users.family_id` for the token's `sub` — this auth service does not expose it.

---

## Endpoints

### 1. Register (Email)

```
POST /v1/email-register
Content-Type: application/x-www-form-urlencoded
```

**Parameters:**

| Name     | Type   | Required | Description       |
|----------|--------|----------|-------------------|
| email    | string | yes      | User email        |
| username | string | yes      | Display name      |
| password | string | yes      | Account password  |

**Success (201):**
```json
{
  "email": "user@example.com",
  "username": "John"
}
```

**Error — email already exists (409):**
```json
{
  "error": "Email already registered"
}
```

**Example:**
```javascript
const res = await fetch('/api/v1/email-register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ email, username, password })
});
```

---

### 2. Login (Email)

```
POST /v1/email-login
Content-Type: application/x-www-form-urlencoded
```

**Parameters:**

| Name     | Type   | Required | Description      |
|----------|--------|----------|------------------|
| email    | string | yes      | User email       |
| password | string | yes      | Account password |

**Success (200):**
```json
{
  "token": "eyJhbGciOiJSUzI1NiJ9...",
  "token_type": "Bearer",
  "email": "user@example.com"
}
```

**Error — invalid credentials (401):**
```json
{
  "error": "Invalid email or password"
}
```

**Example:**
```javascript
const res = await fetch('/api/v1/email-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ email, password })
});
const data = await res.json();
// Store data.token for subsequent requests
localStorage.setItem('token', data.token);
```

---

### 3. Google OAuth2 Login

This uses Spring's server-side OAuth2 flow. Because OAuth success is a browser redirect (it has no
response body), the token is delivered in **two steps**: the server hands the browser a short-lived
`code`, and the frontend exchanges that `code` for the real token.

**Step 1 — Start the flow.** Navigate the browser (full-page redirect, not an AJAX call) to:

```
GET /api/oauth2/authorization/google
```

This redirects to Google's consent screen. After the user authorizes, Google calls back to the server,
which upserts the user (creating an account with no password if they're new).

```javascript
window.location.href = 'https://auth.what4dinner.today/api/oauth2/authorization/google';
```

**Step 2 — Receive the `code`.** The server redirects the browser to:

```
https://dash.what4dinner.today/callback?code=<code>
```

`code` is a **short-lived (15-minute) JWT**. It rides in the URL only as a one-time handoff value, so it
is deliberately disposable — do not store it or use it as the API token.

**Step 3 — Exchange the `code` for the real token.** On the `/callback` page, read `code` from the query
string and call:

```
GET /api/v1/exchange-code?code=<code>
```

**Success (200):**
```json
{
  "token": "eyJhbGciOiJSUzI1NiJ9..."
}
```

**Error — invalid/expired code (401):**
```json
{
  "error": "Invalid code"
}
```

The returned `token` is the usable **12-hour JWT** — store it and send it as `Authorization: Bearer`
on subsequent requests (see [Using the JWT Token](#using-the-jwt-token)).

```javascript
// On https://dash.what4dinner.today/callback
const code = new URLSearchParams(window.location.search).get('code');
const res = await fetch(
  `https://auth.what4dinner.today/api/v1/exchange-code?code=${encodeURIComponent(code)}`
);
const { token } = await res.json();
localStorage.setItem('token', token);
// then redirect into the app
```

> **Note:** No `Authorization` header is sent on `/exchange-code` — the `code` query parameter *is* the
> credential. Call this endpoint once, immediately after the OAuth callback.

---

### 4. Health Check

```
GET /health
```

**Response (200):**
```json
{
  "status": "UP"
}
```

---

## Using the JWT Token

After login, include the token in all requests to protected endpoints:

```javascript
const res = await fetch('/api/v1/some-protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

**Token expiration:** If you receive a `401` response on a protected endpoint, the token has expired. Redirect the user to log in again.