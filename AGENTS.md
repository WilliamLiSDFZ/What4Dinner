# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server with HMR (http://localhost:5173)
npm run build    # Production build to dist/
npm run preview  # Serve the production build locally
npm run lint     # ESLint (flat config, eslint.config.js)
```

There is no test runner configured.

## Architecture

What4Dinner is a meal-planning SPA. React 19 + Vite 8, plain JSX (no TypeScript — `@types/*` are present but unused). `src/api.js` is the sole API layer, talking to the recipe backend (`backendAPI.md`) and the separate auth service (`auth-API.md`); pages that have not been wired up yet still render from static exports in `src/data.js`.

- **Routing** — `react-router-dom` v7. `main.jsx` mounts `<BrowserRouter>`; `App.jsx` declares all routes. A single parent `<Route element={<Layout />}>` renders the sidebar + `<Outlet>`; child routes (`index`/home, `menu`, `favorites`, `shopping`, `family`, `settings`, `add`) are the pages in `src/pages/`. To add a page: create the component, add a `<Route>` in `App.jsx`, and (if it belongs in the sidebar) add an entry to `navItems` in `src/data.js`. Note: the README claims "no router" — that is stale; the app uses react-router.

- **Data** — `src/data.js` holds the remaining seed content: `suggestions`, `initialDishes` (with `ingredients`), and `navItems`. Home and Shopping are still presentational and read these directly, but Menu, Favorites, Family, and the Settings account section now fetch from the backend via `src/api.js` (see `backendAPI.md`). Nothing is persisted except theme and language. The Shopping page derives its consolidated ingredient list at render time from `initialDishes` (flatMap → Set → sort).

- **Theme** — `ThemeContext` (`src/ThemeContext.js`) carries `{ theme, setTheme }` where theme is `'light' | 'dark' | 'system'`. `App.jsx` owns the state, persists it to `localStorage` under `theme`, and toggles a `.dark` class on `document.documentElement` (resolving `system` via `matchMedia`). All theming is CSS-variable-driven off `:root` / `:root.dark` — components never branch on theme in JS.

- **Styling** — Global CSS only: `src/index.css` (resets/base/theme variables) and `src/App.css` (layout + component classes). No CSS modules or styled-components; components reference shared class names. **`STYLE.md` is the authoritative design system** — color tokens, typography, spacing, and copy-paste CSS for every component pattern (cards, buttons, modals, FAB, avatars, etc.). Read it before building or restyling any page so new work matches the existing terracotta/cream design.

- **Layout** — `components/Layout.jsx` renders the fixed sidebar (brand, `navItems` as `NavLink`s, user chip) and the scrollable `<main>`. A floating "Add new dish" FAB is rendered globally except on the `/add` route. Layout also fetches `GET /v1/user/me` once and publishes `{ user, loading, error }` on `UserContext` (`src/UserContext.js`) for the sidebar chip, Settings, and Family. The fetch lives here rather than in `App.jsx` because `/callback` renders outside `Layout`, before a token exists — a 401 there would send the user back to login mid sign-in.

## Conventions

- ESLint `no-unused-vars` ignores identifiers matching `^[A-Z_]` (constants/components). Lint runs over `**/*.{js,jsx}`; `dist` is ignored.
- Icons are Bootstrap Icons via CSS classes, e.g. `<i className="bi-plus-lg" />` (font imported in `main.jsx`).
- Use the `--bg` token (not `--card-bg`) for elements that must be opaque over overlays, e.g. modal boxes — card/sidebar backgrounds are semi-transparent in light mode.
