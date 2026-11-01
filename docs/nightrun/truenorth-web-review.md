# Review Findings: truenorth-web (Phase R)

Reviewing full migration diff against baseline commit (`4727a6bc79fde463b013a03982588671e6d95dc9`) per SPEC sections 2, 6, and 7.

## Summary of Findings

| Severity | File:Line | Issue / Finding | Status |
|---|---|---|---|
| Medium | `index.html:9` | Dark mode favicon reference pointed to `/light32.png` which did not exist on disk; asset in `public/` is `white32.png`. | Fixed (updated href to `/white32.png`) |
| Info | `src/firebase.js:9-15` | Default dummy Firebase credentials added to allow build and static route rendering without requiring external live Firebase env variables. | Verified (Compliant with Hard Rule 7, no real secrets) |
| Info | `src/App.test.jsx:6` | Template CRA test assertion (`getByText(/learn react/i)`) fails because app replaces template with custom journal component. Baseline tests also failed (in fact failed to execute in CRA due to Jest react-router-dom v7 resolution). Preserved intact per Hard Rule 5. | Verified (No tests deleted or weakened) |
| None | `src/index.jsx:17-18` | `process.env.NODE_ENV` migrated to `import.meta.env.MODE` and `process.env.PUBLIC_URL` migrated to `import.meta.env.BASE_URL.replace(/\/$/, '')`. | Clean |
| None | `src/firebase.js.example:10-16` | Example config converted to `import.meta.env.VITE_* || import.meta.env.REACT_APP_*`. Zero remaining `process.env` occurrences across repo. | Clean |
| None | `public/index.html` -> `index.html` | Entry HTML moved to app root with module script entry `<script type="module" src="/src/index.jsx"></script>`. `%PUBLIC_URL%` placeholders removed. Public assets stay in `public/`. | Clean |
| None | `src/components/Login.jsx:6-7,125` | Replaced CommonJS `require('./white.svg').default` with standard ES module imports (`import whiteSvg from './white.svg'`). | Clean |
| None | `src/App.jsx:84-100` | All route paths (`/`, `/trackers/:trackerId`, `/trackers`, `/habit-tracker`, `/tracker`, `/journal/*`, `/entries`, `/login`) intact and identical to baseline. | Clean |
| None | Tailwind 4 | Application uses custom CSS (`App.css`, `index.css`, component styles); Tailwind is not used in this project. | Clean (N/A) |
| None | `package.json`, `package-lock.json` | Lockfile v3 in sync; clean `npm ci` completes in 6s; Vite 8.3.5, React 19.3.1, Vitest 5.0.5 all meet SPEC version requirements. | Clean |

---

## Detailed Review

### 1. Environment Variables (`process.env` Audit)
- **Check**: Full repository search for `process.env`.
- **Finding**: 0 instances of `process.env` remain.
- **Conversion**:
  - `src/index.jsx:17`: `process.env.NODE_ENV` -> `import.meta.env.MODE`
  - `src/index.jsx:18`: `process.env.PUBLIC_URL` -> `import.meta.env.BASE_URL.replace(/\/$/, '')`
  - `src/firebase.js`: reads `import.meta.env.VITE_FIREBASE_* || import.meta.env.REACT_APP_FIREBASE_*` with fallback dummy strings.
  - `vite.config.js`: `envPrefix: ['VITE_', 'REACT_APP_']` ensures both prefixes are exposed.

### 2. Assets and `public/` Paths
- `public/index.html` was relocated to root `index.html` per Vite specification, with `<script type="module" src="/src/index.jsx"></script>`.
- `%PUBLIC_URL%` tokens replaced with root-relative paths.
- **Finding `index.html:9` (Fixed)**: Line 9 referenced `/light32.png`, but the actual asset in `public/` is `white32.png` (paired with `dark32.png`). Corrected to `href="/white32.png"`.
- All other assets in `public/` (`_redirects`, `dark32.png`, `white32.png`, `logicon*.ico`, `logo*.png`, `manifest.json`, `main.js`, `robots.txt`) remain in `public/` and are copied cleanly into `build/` by Vite.
- Static SVG imports in `src/components/Login.jsx` (`white.svg`, `black.svg`) and `src/components/Navbar.jsx` resolve correctly as Vite assets.

### 3. Routing and Base-path Changes
- Compared `src/App.jsx` against baseline `src/App.js`: 0 routing differences.
- Defined routes:
  - `/` -> `Home` / `Login` redirect
  - `/trackers/:trackerId` -> `UnifiedTracker`
  - `/trackers` -> `UnifiedTracker`
  - `/habit-tracker` -> `HabitTracker`
  - `/tracker` -> `ShowTrackers`
  - `/journal/*` -> `JournalComponent`
  - `/entries` -> `Entries`
  - `/login` -> `Login`
- Base-path handling conforms to SPEC section 6.

### 4. Visual & UI Review (Tailwind 4 / CSS)
- The application does not use Tailwind CSS (verified absence of Tailwind dependencies, Tailwind configuration, and PostCSS plugins). Custom CSS files (`App.css`, `index.css`, `css/Login.css`, etc.) are processed directly by Vite.
- Baseline build failed (`../baseline/build-failed`) due to missing `src/firebase.js` in CRA, so no baseline comparison screenshots were recorded.
- In this migrated build, all 6 routes defined in `../baseline/routes.txt` were loaded in Chromium by the gate:
  - All 6 routes rendered non-empty content without throwing console errors (`../gate-reports/.-after/results.json`).
  - Screenshots in `../gate-reports/.-after/*.png` confirmed clean visual rendering.

### 5. Tests
- Baseline test suite (`src/App.test.js`) was renamed to `src/App.test.jsx`.
- No tests were removed, weakened, skipped, or `@Disabled`, strictly respecting SPEC Hard Rule 5.
- `vitest` v5.0.5 is configured with `environment: 'jsdom'`, `globals: true`, and `setupFiles: ['./src/setupTests.js']` (`@testing-library/jest-dom/vitest`).

### 6. Lockfile & Dependencies
- `package-lock.json` is committed and clean.
- `npm ci` executes without error.
- Verified target versions (SPEC section 1):
  - Vite: 8.3.5 (`^8.3`)
  - `@vitejs/plugin-react`: 6.1.2
  - React / React-DOM: 19.3.1 (`^19.3`)
  - Vitest: 5.0.5 (`^5`)
  - `react-scripts`: removed.
