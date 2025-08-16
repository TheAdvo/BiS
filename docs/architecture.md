# Architecture & Patterns (detailed)

This document contains the detailed architecture, patterns, and conventions for the BiS project.

## Project Stack

- Nuxt 3 (Vue 3)
- TypeScript
- Pinia
- Tailwind CSS

## Key Directories

- `components/TradingBot/`: Core trading UI panels and bot components.
- `composables/`: Reusable logic and data fetching (e.g., `useOandaCandles.ts`).
- `stores/`: Pinia stores for central state (e.g., `oanda.ts`).
- `server/api/`: Backend endpoints and server logic.
- `types/`: TypeScript types used across the project.

## Data Flow

- Composables fetch and transform API data.
- Stores persist app-level state and expose actions for side effects (e.g., `placeOrder`).
- Components consume stores/composables via `computed` and `watch`.

## Conventions

- Use `<script setup lang="ts">` for SFCs.
- Keep business logic in composables and stores; components should focus on rendering and UX.
- Types live in `types/` and are used throughout.

## Testing

- Unit tests in `tests/` using Vitest/Jest.
- Component tests with Vue Test Utils.

## Error Handling

- Catch errors in composables; expose error flags to UI.
- Use `useLogger.ts` for consistent logging.

## Suggestions

- Add `docs/contributing.md` for PR checklist and development setup.
- Add `.env.example` listing required environment variables.
