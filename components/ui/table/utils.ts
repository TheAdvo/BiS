import type { Ref } from 'vue'

// Simple updater type to replace @tanstack/vue-table dependency
type Updater<T> = T | ((old: T) => T)

export function valueUpdater<T extends Updater<any>>(updaterOrValue: T, ref: Ref) {
  ref.value
    = typeof updaterOrValue === 'function'
      ? updaterOrValue(ref.value)
      : updaterOrValue
}
