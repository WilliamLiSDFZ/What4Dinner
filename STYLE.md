# Style Guide — What4Dinner

Reference for building new pages that match the existing design system.

## Color Palette

All colors are defined as CSS custom properties on `:root` (light) and `:root.dark` (dark).

### Light Mode (default)

| Variable | Value | Usage |
|---|---|---|
| `--bg` | `#FBF6F0` | Page background (opaque) |
| `--text` | `#5C4A3A` | Body text |
| `--text-h` | `#2E1E10` | Headings, emphasized text |
| `--accent` | `#A0623A` | Primary accent (terracotta) |
| `--accent-bg` | `rgba(160,98,58,0.1)` | Accent tint for hover states, badges |
| `--accent-border` | `rgba(160,98,58,0.4)` | Accent border on focus/hover |
| `--border` | `#DDD0C0` | Borders, dividers |
| `--card-bg` | `rgba(245,235,224,0.5)` | Card backgrounds (semi-transparent) |
| `--sidebar-bg` | `rgba(245,235,224,0.84)` | Sidebar background (semi-transparent) |
| `--code-bg` | `#F5EBE0` | Code/pre backgrounds |
| `--shadow` | `rgba(0,0,0,0.08) 0 10px 15px -3px, ...` | Card hover shadow |

### Dark Mode (`:root.dark`)

| Variable | Value |
|---|---|
| `--bg` | `#1A1410` |
| `--text` | `#B0A090` |
| `--text-h` | `#EDE4D8` |
| `--accent` | `#C07A4A` |
| `--accent-bg` | `rgba(192,122,74,0.15)` |
| `--accent-border` | `rgba(192,122,74,0.5)` |
| `--border` | `#3D3028` |
| `--card-bg` | `#261E16` (opaque in dark) |
| `--sidebar-bg` | `#211A14` |
| `--code-bg` | `#241C14` |

**Note:** `--card-bg` and `--sidebar-bg` are semi-transparent in light mode. Use `--bg` for elements that must be opaque (e.g., modals on top of overlays).

## Typography

| Element | Font | Size | Weight | Letter-spacing | Color |
|---|---|---|---|---|---|
| Body | `system-ui, 'Segoe UI', Roboto, sans-serif` | 18px (16px ≤1024px) | 400 | 0.18px | `--text` |
| h1 | same | 32px | 500 | -0.5px | `--text-h` |
| h2 | same | 24px | 500 | -0.24px | `--text-h` |
| h3 (in cards) | same | 18px | 600 | — | `--text-h` |
| Body small (descriptions) | same | 15px | 400 | — | `--text` |
| Category label | same | 12px | 600 | 0.5px | `--accent` (uppercase) |
| Brand | same | 22px (20px mobile) | 600 | — | `--accent` |

## Spacing

- **Main content padding:** 40px 48px (24px 20px on mobile)
- **Card padding:** 20px (family cards: 24px)
- **Section margin-bottom:** 32px
- **Grid gaps:** 16–20px
- **h1 margin-bottom:** 24px
- **h2 margin-bottom:** 8px

## Layout

- **Root:** `height: 100svh`, flex row (column on mobile)
- **Sidebar:** 240px fixed width, flex column, scrolls independently
- **Main content:** `flex: 1`, `overflow-y: auto` (this is the only scroll area)
- **Mobile breakpoint:** 768px — sidebar becomes horizontal top bar, grids collapse to 2-col or single-col
- **Font scaling breakpoint:** 1024px — base font 18px → 16px

## Component Patterns

### Card

```css
border: 1px solid var(--border);
border-radius: 10px;
padding: 20px;
background: var(--card-bg);
transition: box-shadow 0.2s, border-color 0.2s;

&:hover {
  box-shadow: var(--shadow);
  border-color: var(--accent-border);
}
```

Card content: `h3` (18px/600) + `p` (15px/150% line-height).

### Card Grid

```css
display: grid;
grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
gap: 20px;
```

### Primary Button (filled)

```css
padding: 8px 20px;  /* or 14px 24px for FAB */
font-size: 15px;
font-weight: 500;
color: #fff;
background: var(--accent);
border: none;
border-radius: 8px;  /* 999px for pill/FAB */
cursor: pointer;
transition: background 0.15s;

&:hover {
  background: color-mix(in srgb, var(--accent) 85%, #000);
}
```

### Secondary Button (outline)

```css
padding: 8px 24px;
font-size: 15px;
font-weight: 500;
color: var(--accent);
background: var(--accent-bg);
border: 1px solid var(--accent-border);
border-radius: 8px;
cursor: pointer;

&:hover {
  background: var(--accent);
  color: #fff;
}
```

### Ghost Button (minimal)

```css
padding: 8px 16px;
color: var(--text);
background: transparent;
border: 1px solid var(--border);
border-radius: 8px;

&:hover {
  background: var(--accent-bg);
  color: var(--text-h);
}
```

### Segmented Toggle

Inline-flex container with `border: 1px solid var(--border)`, `border-radius: 10px`, `overflow: hidden`. Each button: `padding: 10px 20px`, separated by `border-right`. Active button: `background: var(--accent); color: #fff`.

### Text Input

```css
padding: 12px 16px 12px 40px;  /* 40px left for icon */
font-size: 16px;
color: var(--text);
background: var(--bg);
border: 1px solid var(--border);
border-radius: 10px;
outline: none;

&:focus {
  border-color: var(--accent-border);
}
```

### Checkbox

```css
accent-color: var(--accent);
width: 16px;
height: 16px;
```

### List with Separators

```css
list-style: none;
padding: 0;

li {
  padding: 10px 0;  /* or 16px 0 for larger items */
  border-bottom: 1px solid var(--border);
}

li:last-child {
  border-bottom: none;
}
```

### Avatar Circle

```css
width: 48px;   /* 36px for small */
height: 48px;
border-radius: 50%;
background: var(--accent-bg);  /* or var(--accent) for filled */
color: var(--accent);          /* or #fff for filled */
display: flex;
align-items: center;
justify-content: center;
font-size: 20px;  /* 15px for small */
font-weight: 600;
```

### Floating Action Button (FAB)

```css
position: fixed;
bottom: 24px;
right: 24px;
padding: 14px 24px;
font-size: 16px;
font-weight: 600;
color: #fff;
background: var(--accent);
border: none;
border-radius: 999px;
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
z-index: 100;
```

### Modal

- **Overlay:** `position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center`
- **Box:** `background: var(--bg)` (use `--bg`, NOT `--card-bg`), `border: 1px solid var(--border)`, `border-radius: 12px`, `padding: 28px`, `max-width: 400px`, `width: 90%`
- **Actions:** flex row, `gap: 10px`, `justify-content: flex-end`

### Action Card (dashed "add" card)

Same as card, but with `border-style: dashed` and `cursor: pointer`. Avatar inside uses `border: 2px dashed var(--accent-border)` with transparent background.

## Transitions

- **Standard:** `0.15s` for backgrounds, colors, border-color
- **Cards:** `0.2s` for box-shadow, border-color
- **Easing:** default (no explicit easing = `ease`)

## Icons

Bootstrap Icons via CSS classes: `<i className="bi-icon-name" />`. Common icons used: `bi-plus-lg`, `bi-arrow-left`, `bi-search`, `bi-arrow-clockwise`, `bi-sun`, `bi-moon`, `bi-display`.
