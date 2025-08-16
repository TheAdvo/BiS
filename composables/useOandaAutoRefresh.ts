import { useOandaStore } from "~/stores/oanda";

export interface UseOandaAutoRefreshReturn {
  start: () => void;
  stop: () => void;
  isActive: import("vue").Ref<boolean>;
}
// composables/useOandaAutoRefresh.ts - Centralized auto-refresh service
export const useOandaAutoRefresh = () => {
  const { refreshAll } = useOandaStore();

  let refreshInterval: NodeJS.Timeout | null = null;
  let visibilityHandler: (() => void) | null = null;
  const isActive = ref(false);

  // Configurable refresh frequencies
  const config = {
    normalInterval: 30000, // 30 seconds when page is visible
    backgroundInterval: 120000, // 2 minutes when page is hidden
  };

  const start = () => {
    if (refreshInterval) return; // Already running

    isActive.value = true;

    const setupInterval = () => {
      const interval = document.hidden
        ? config.backgroundInterval
        : config.normalInterval;

      if (refreshInterval) clearInterval(refreshInterval);

      refreshInterval = setInterval(() => {
        if (!document.hidden) {
          refreshAll(); // Don't force refresh on auto-refresh
        }
      }, interval);
    };

    // Store handler reference for cleanup
    visibilityHandler = setupInterval;

    // Initial setup
    setupInterval();

    // Adjust interval based on page visibility
    document.addEventListener("visibilitychange", visibilityHandler);
  };

  const stop = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }

    if (visibilityHandler) {
      document.removeEventListener("visibilitychange", visibilityHandler);
      visibilityHandler = null;
    }

    isActive.value = false;
  };

  // Auto-cleanup on unmount
  onUnmounted(() => {
    stop();
  });

  return {
    start,
    stop,
    isActive: readonly(isActive),
  };
};
