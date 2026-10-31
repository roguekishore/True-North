# Handoff Report: truenorth-web (Phase H)

## 1. Phases Passed

From `../PROGRESS.md`:

| Phase | Description | Status | Attempts | Commit |
|---|---|---|---|---|
| W1 | TRUENORTH: CRA to Vite 8, Tailwind 4, React 19.3 | done | 0 | `0f040d665c` |
| R | Review and fix | done | 0 | `20d081a917` |
| H | Handoff report | done | 0 | (current) |

## 2. Gate Results

- **Application Gate (`web-gate.sh . cra`)**: **GATE PASS [.]**
  - Clean `npm ci`: completed successfully.
  - Target versions verified: Vite 8.3.5 (`^8.3`), React 19.3.0 (`^19.3`), React-DOM 19.3.0 (`^19.3`), Vitest 5.0.4 (`^5`), `react-scripts` completely removed.
  - Production build: `npm run build` successfully generated `build/index.html` (1.84 kB) and assets bundle.
  - Chromium Route Verification: All 6 routes defined in baseline (`/`, `/entries`, `/habit-tracker`, `/login`, `/tracker`, `/trackers`) loaded cleanly with 0 console errors and non-empty DOM content recorded in `../gate-reports/.-after/results.json`.
- **Scope Gate (`web-gate.sh - scope`)**: **GATE PASS [scope]**
  - All modified files remain strictly within allowed paths.

## 3. Files Changed

`git diff --stat $(cat ../baseline/sha)`:

```
 .gitignore                                         |    9 +-
 docs/nightrun/truenorth-web-handoff.md             |  ...
 docs/nightrun/truenorth-web-review.md              |   73 +
 public/index.html => index.html                    |   19 +-
 package-lock.json                                  | 4503 ++++++++++++++++++++
 package.json                                       |   35 +-
 src/{App.js => App.jsx}                            |    0
 src/{App.test.js => App.test.jsx}                  |    0
 ...lyMomentsTracker.js => DailyMomentsTracker.jsx} |    0
 src/components/{Entries.js => Entries.jsx}         |    0
 .../{FloatingNavbar.js => FloatingNavbar.jsx}      |    0
 .../{HabitTracker.js => HabitTracker.jsx}          |    0
 src/components/{Home.js => Home.jsx}               |    0
 src/components/{Journal.js => Journal.jsx}         |    0
 .../{JournalComponent.js => JournalComponent.jsx}  |    0
 src/components/{Login.js => Login.jsx}             |    4 +-
 src/components/{MEDS.js => MEDS.jsx}               |    0
 src/components/{Navbar.js => Navbar.jsx}           |    0
 src/components/{SAS.js => SAS.jsx}                 |    0
 src/components/{SasMeds.js => SasMeds.jsx}         |    0
 .../{ShowTrackers.js => ShowTrackers.jsx}          |    0
 .../{TrackerGraphs.js => TrackerGraphs.jsx}        |    0
 .../{TrackerTemplate.js => TrackerTemplate.jsx}    |    0
 src/context/{AuthContext.js => AuthContext.jsx}    |    0
 src/firebase.js                                    |   34 +
 src/firebase.js.example                            |   14 +-
 src/{index.js => index.jsx}                        |   14 +-
 src/setupTests.js                                  |    2 +-
 .../{UnifiedTracker.js => UnifiedTracker.jsx}      |    0
 vite.config.js                                     |   24 +
```

Summary:
- Converted 16 JSX files from `.js` to `.jsx`.
- Relocated `public/index.html` to root `index.html` with `<script type="module" src="/src/index.jsx"></script>`.
- Added `vite.config.js`.
- Added `src/firebase.js` fallback configuration to prevent build/runtime breaks when Firebase env vars are unset.
- Updated `src/components/Login.jsx` to use ES module imports instead of CommonJS `require()`.
- Updated `src/setupTests.js` to import `@testing-library/jest-dom/vitest`.
- Updated `.gitignore` for Vite cache and build output.

## 4. Dependencies Added, Upgraded, and Removed

### Added / Upgraded
- `vite`: `^8.3.5` (devDependencies) — CRA replacement.
- `@vitejs/plugin-react`: `^6.1.2` (devDependencies) — React support in Vite.
- `vitest`: `^5.0.4` (devDependencies) — Jest replacement for unit testing.
- `jsdom`: `^30.1.3` (devDependencies) — DOM environment for Vitest.
- `react`: upgraded from `^18.3.1` to `^19.3.0` (dependencies).
- `react-dom`: upgraded from `^18.3.1` to `^19.3.0` (dependencies).
- `@testing-library/react`: moved/upgraded to `^16.3.3` (devDependencies).
- `@testing-library/jest-dom`: moved/upgraded to `^6.9.1` (devDependencies).
- `@testing-library/user-event`: moved/upgraded to `^14.5.2` (devDependencies).

### Removed
- `react-scripts`: `5.0.1` — deprecated CRA build tooling removed.

### Tailwind
- N/A: Application uses custom vanilla CSS (`App.css`, `index.css`, component CSS); Tailwind CSS was not used in this repository.

## 5. Environment-Variable and Build-Output Decisions

- **Build Output Directory**: Configured `build.outDir: 'build'` in `vite.config.js`. This preserves identical build directory structure for all downstream deployment scripts and container definitions expecting `build/`.
- **Development Server Port**: Configured `server.port: 3000` to match CRA default port.
- **Environment Prefix**: Configured `envPrefix: ['VITE_', 'REACT_APP_']` in `vite.config.js` to ensure backward compatibility with existing deployment environments defining `REACT_APP_*` while supporting modern `VITE_*` naming.
- **Environment Variable Migration**:
  - `process.env.NODE_ENV` converted to `import.meta.env.MODE` (`src/index.jsx`).
  - `process.env.PUBLIC_URL` converted to `import.meta.env.BASE_URL.replace(/\/$/, '')` (`src/index.jsx`).
  - `src/firebase.js`: configured to read `import.meta.env.VITE_FIREBASE_* || import.meta.env.REACT_APP_FIREBASE_*` with safe fallback dummy values so static route rendering and builds succeed without live credentials.
  - Zero instances of `process.env` remain in the repository.

## 6. Left Items (`docs/nightrun/truenorth-web-left.md`)

- No `docs/nightrun/truenorth-web-left.md` file exists.
- All tasks in phases W1, R, and H were completed without blockers or omissions.

## 7. Actions for the Owner

1. **Check Screenshots**:
   - Review route visual captures in `../gate-reports/.-after/` (`_.png`, `_entries.png`, `_habit_tracker.png`, `_login.png`, `_tracker.png`, `_trackers.png`) to verify expected visual presentation.
2. **Hosting Environment Variables**:
   - Existing hosting variables named `REACT_APP_FIREBASE_*` will continue to be recognized due to `envPrefix: ['VITE_', 'REACT_APP_']`.
   - Optionally rename or dual-publish variables with prefix `VITE_FIREBASE_*` (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`).
3. **Merge**:
   - Merge `chore/stack-web` into `main`.
4. **Deploy**:
   - Trigger production deployment (`npm ci && npm run build` -> deploy `build/`).
