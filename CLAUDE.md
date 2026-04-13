# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**StockUp** is a Progressive Web App (PWA) for kirana (small grocery) store management in India. It targets mobile-first usage with features like billing, inventory, credit/lending ("Udhar Book"), expense tracking, multi-language support (English, Hindi, Tamil), and an AI assistant ("BOO AI").

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173 (Vite HMR)
npm run build     # TypeScript type-check + Vite production build → dist/
npm run lint      # ESLint with TypeScript + React Hooks rules
npm run preview   # Preview the production build locally
```

There is no test framework configured.

## Architecture

### Routing & Auth (`src/App.tsx`)

All routes are wrapped in a `ProtectedRoute` component. Unauthenticated users are redirected to `/login`; authenticated users who haven't onboarded go to `/onboarding`. Routes map directly to screen files in `src/screens/`.

### State Management (`src/store/`)

All application state lives in Zustand stores. **Currently all data is mocked — no real backend calls are made despite Supabase being installed.**

| Store | Responsibility |
|-------|---------------|
| `auth.ts` | Login state, onboarding flag, store profile |
| `inventory.ts` | Product catalog, stock levels, expiry dates |
| `customers.ts` | Udhar Book — credit lending & repayments |
| `cart.ts` | Active billing cart |
| `expenses.ts` | Expense records by category |
| `finance.ts` | Revenue/profit aggregation |
| `toast.ts` | Global notification queue |
| `layout.ts` | Header action buttons injected by screens |

### Layout System (`src/components/layout/`)

- `AppLayout` wraps all authenticated screens with `Sidebar` (desktop, 240px fixed) + `BottomNav` (mobile, sticky).
- `Header` receives dynamic action buttons from `layout.ts` store (screens inject their own header actions).
- `PageTransition` wraps screen content in Framer Motion animations.

### Responsive UI Pattern

The app uses a **Modal on desktop / BottomSheet on mobile** pattern. When adding new dialog-style UI, check `components/ui/Modal.tsx` and `components/ui/BottomSheet.tsx` — they share the same interface.

### Feature Gating

`components/ui/PlanGate.tsx` gates features behind `free / basic / pro` plan tiers. Wrap restricted features with `<PlanGate plan="pro">`.

### Styling

- Tailwind CSS v4 via the Vite plugin (no PostCSS config needed).
- Custom color palette defined in `src/index.css` as CSS variables: `--color-darkest` (`#FF5900`) through `--color-pale` (`#FFFBDC`) — an orange-yellow scale.
- Utility helper: `src/lib/utils.ts` exports `cn()` (clsx + tailwind-merge) for conditional class names.
- Font: Plus Jakarta Sans loaded from Google Fonts in `index.html`.

### Internationalization

Translations live in `src/lib/i18n.ts` (inline, not separate JSON files). Use the `useTranslation` hook from `react-i18next`. Supported locales: `en`, `hi`, `ta`.

### PWA

`public/sw.js` is a basic pass-through service worker. `public/manifest.json` defines the installable PWA metadata. Both are registered in `src/main.tsx`.

## Key Conventions

- **Path alias**: `@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).
- **TypeScript strict mode** is enabled.
- Screens own their own header actions by dispatching to `layout.ts` store on mount.
- All Zustand stores export a single `use<Name>Store` hook.
