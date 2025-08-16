// composables/useLogger.ts
import type { Ref } from "vue";

export interface UseLogger {
  info: (...args: any[]) => void;
  success: (...args: any[]) => void;
  warning: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

export const useLogger = (): UseLogger => {
  return {
    info: () => {},
    success: () => {},
    warning: () => {},
    error: () => {},
  };
};
