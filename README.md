# what4dinner

A meal planning SPA that helps you decide what to cook. Browse personalized dish suggestions, manage your menu, track favorites, build shopping lists, and coordinate with family members.

## Features

- **Home** — Personalized "Guess you like" suggestions and top choice dishes
- **My Menu** — Browse and search your full dish collection
- **Favorites** — Top 10 ranked dishes at a glance
- **Shopping List** — Two-panel layout with a consolidated checklist of ingredients (left) and per-dish breakdowns (right)
- **My Family** — Manage family members with add-member support
- **Settings** — Light / Dark / System theme toggle (persisted in localStorage)
- **Add New Dish** — Dedicated blank page with confirmation modal on exit

## Tech Stack

- React 19 + Vite 8
- Plain JavaScript (JSX)
- CSS custom properties with light/dark theme support
- Bootstrap Icons
- No router — `useState`-based page navigation

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
