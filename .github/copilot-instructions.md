# Copilot Instructions for BiS (Nuxt Trading Dashboard)

## Project Overview

- **Framework:** Nuxt 3 (Vue 3, TypeScript, Pinia)
- **Purpose:** Trading dashboard for OANDA, with real-time strategy, trade, and position management along with Automated Trading Bot features based on OANDA's API and analytics.
- **Key Features:**
  - Real-time trade and position management
  - Strategy grouping and analytics
  - Automated Trading Bot functionality
  - Custom backend endpoints for OANDA data
  - Automation of trading strategies through a centralized bot system aka an Engine.
- **Key Directories:**
  - `components/TradingBot/`: Core trading UI panels (e.g., `ActiveStrategiesPanel.vue`)
  - `composables/`: Data-fetching, business logic, and utility hooks
  - `stores/`: Pinia stores for OANDA data (e.g., `oanda.ts`)
  - `server/api/`: Backend endpoints (Node/Express style)
  - `types/`: TypeScript types for OANDA and analytics

## Architecture & Data Flow

- **State Management:** Centralized in Pinia stores (see `stores/oanda.ts`). Components access data via computed properties and store getters.
- **Data Fetching:** Use composables (e.g., `useOandaPositions.ts`) for API calls and logic. Avoid direct API calls in components.
- **UI Patterns:**
  - Use Components from `components/ui/` for consistent UI elements.
  - Use `<TransitionGroup>` for animated lists (see `ActiveStrategiesPanel.vue`).
  - Skeleton loaders and error states are handled via computed flags and conditional rendering.
- **Strategy Grouping:** Trades and positions are grouped by instrument to form "strategies" (see `ActiveStrategiesPanel.vue`).

## Developer Workflows

- **Install dependencies:** `npm install`
- **Start dev server:** `npx nuxt dev` (or use VS Code task: "Run Nuxt Dev Server")
- **Build for production:** `npm run build`
- **Preview production:** `npm run preview`
- **Debugging:** Use browser console and Pinia devtools for state inspection. Console logs are present in key components for debugging.

## Conventions & Patterns

- **TypeScript:** All business logic and stores use TypeScript. Types are in `types/`.
- **Component Structure:**
  - Use `<script setup lang="ts">` in Vue SFCs.
  - UI state (loading, error, empty) is handled via computed properties and conditional rendering.
  - Use composables for logic, not in components.
- **Styling:** Tailwind CSS is used (see `assets/css/tailwind.css`). Prefer utility classes over custom CSS.
- **Icons:** Use `lucide-vue-next` for icons.
- **Auto-refresh:** Some panels auto-refresh data (see `onMounted`/`setInterval` in `ActiveStrategiesPanel.vue`).

## Error Handling

- **UI Error States:** Always use computed properties to represent error states. Display errors in the UI using conditional rendering (see `ActiveStrategiesPanel.vue`).
- **Composables:** Catch and handle errors in composables. Return error objects or flags for components to consume. Log errors using `useLogger.ts`.
- **Store Errors:** Pinia stores should expose error state via getters (see `stores/oanda.ts`).
- **Backend/API:** Return clear error messages and status codes from custom endpoints in `server/api/`. Handle API errors gracefully in composables and stores.
- **Debugging:** Use browser console and Pinia devtools to inspect error state. Add console logs in key catch blocks for traceability.

## Testing

- **Unit Tests:** Place tests in a `tests/` directory at the project root. Use Vitest or Jest for unit testing composables, stores, and utility functions.
- **Component Tests:** Use Vue Test Utils for SFCs. Mock Pinia stores and composables as needed.
- **API/Backend Tests:** Test custom endpoints in `server/api/` using supertest or a similar tool.
- **Test Patterns:**
  - Test error states and edge cases, not just happy paths.
  - Use mock data that matches the structure in `types/`.
  - Prefer shallow rendering for UI tests unless integration is required.
- **Running Tests:** Add and run tests with `npm run test` (configure in `package.json` if not present).

## Integration Points

- **OANDA API:** All trading data flows through Pinia stores and composables. Do not call OANDA endpoints directly in components.
- **Backend:** Custom endpoints live in `server/api/`.

## Examples

- See `components/TradingBot/ActiveStrategiesPanel.vue` for:
  - Grouping trades/positions into strategies
  - Animated list rendering
  - Skeleton loading and error handling
- See `composables/useOandaPositions.ts` for API logic pattern.
- See `stores/oanda.ts` for state management conventions.

---

**When in doubt, follow patterns from the above files.**
