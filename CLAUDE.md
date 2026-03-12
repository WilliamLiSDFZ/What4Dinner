# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (Vite with HMR)
- **Build:** `npm run build` (outputs to `dist/`)
- **Preview production build:** `npm run preview`
- **Lint:** `npm run lint` (ESLint 9 flat config)

No test framework is currently configured.

## Architecture

React 19 + Vite 8 single-page app using plain JavaScript (JSX, not TypeScript).

- `src/main.jsx` — Entry point, renders `<App />` into `#root` with StrictMode
- `src/App.jsx` — Root component (currently Vite starter template)
- `src/index.css` — Global styles including CSS custom properties for theming
- `src/App.css` — Component-specific styles
- `public/` — Static assets (favicon, SVG icon sprite)

## Style Conventions

- CSS uses native nesting and `prefers-color-scheme` media query for light/dark themes via CSS custom properties (defined in `index.css`)
- ESLint rule: `no-unused-vars` ignores variables starting with uppercase or underscore (`varsIgnorePattern: '^[A-Z_]'`)
