# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Expo Router routes (e.g., `_layout.tsx`, `(tabs)/index.tsx`, `modal.tsx`, `+not-found.tsx`).
- `components/`: Reusable UI, hooks, and tests (`__tests__/`).
- `constants/`: App-wide constants (e.g., `Colors.ts`).
- `assets/`: Images and fonts (`assets/images/*`, `assets/fonts/*`).
- `app.json`: Expo app config. TypeScript is enabled via `tsconfig.json` with path alias `@/* → ./`.

## Build, Test, and Development Commands
- `npm run start`: Launches the Expo dev server.
- `npm run ios`: Starts the iOS simulator via Expo.
- `npm run android`: Starts the Android emulator via Expo.
- `npm run web`: Runs the app in a web browser.
- `npm test`: Runs Jest (configured with `jest-expo`) in watch mode.

## Coding Style & Naming Conventions
- **Language**: TypeScript (`.ts`, `.tsx`); compiler is `strict`.
- **Indentation**: 2 spaces; keep lines concise and typed.
- **Components**: PascalCase files and exports (e.g., `Themed.tsx`, `EditScreenInfo.tsx`).
- **Hooks**: Prefix with `use` (e.g., `useColorScheme.ts`).
- **Routes (Expo Router)**: File-based routing in `app/`; use `_layout.tsx`, route groups like `(tabs)/`, and special files `+not-found.tsx`, `+html.tsx`.
- **Imports**: Prefer alias `@/…` for local modules.

## Testing Guidelines
- **Framework**: Jest with `jest-expo`; React Test Renderer for component snapshots.
- **Location**: Co-locate in `__tests__/` next to source, or `*.test.{ts,tsx,js}`.
- **Example**: See `components/__tests__/StyledText-test.js`.
- **Coverage**: Add tests for new UI states and utilities; snapshot critical components.

## Commit & Pull Request Guidelines
- **Commits**: Clear, imperative subject; scope first when helpful (e.g., `components: add Themed.Text variants`).
- **PRs**: Include summary, screenshots for UI changes, steps to test, and linked issues.
- **Checks**: Ensure `npm test` passes and the app boots (`npm run ios|android|web`).

## Security & Configuration Tips
- Do not commit secrets or API keys; use platform secrets or env solutions as appropriate.
- Keep assets in `assets/`; reference via static imports to enable bundling.
- Avoid platform-specific code unless necessary; prefer shared components under `components/`.

