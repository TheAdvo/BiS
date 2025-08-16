// Cleaned composable: abortable fetch + useAsyncData + on-scope cleanup
import type {
  OandaPositionsResponse,
  OandaTradesResponse,
} from "@/types/Oanda";
import { ref, onScopeDispose, useAsyncData } from "#imports";

// Lightweight return types (permissive refs to avoid readonly/ref mismatch)
export type UseOandaPositionsReturn = {
  data: ReturnType<typeof ref>;
  error: ReturnType<typeof ref>;
  pending: ReturnType<typeof ref>;
  fetchNow: () => Promise<void>;
};

export type UseOandaTradesReturn = {
  data: ReturnType<typeof ref>;
  error: ReturnType<typeof ref>;
  pending: ReturnType<typeof ref>;
  fetchNow: () => Promise<void>;
};

function makeAbortableAsync<T>(key: string, url: string) {
  const asyncData = useAsyncData<T>(key, () => ($fetch as any)(url));
  const controller = ref<AbortController | null>(null);

  async function fetchNow() {
    controller.value?.abort();
    controller.value = new AbortController();
    try {
      asyncData.pending.value = true as any;
      const res = await ($fetch as any)(url, {
        signal: controller.value.signal,
      });
      (asyncData as any).data.value = res;
      (asyncData as any).error.value = null;
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // aborted - keep previous data
      } else {
        (asyncData as any).error.value = err;
      }
    } finally {
      asyncData.pending.value = false as any;
    }
  }

  onScopeDispose(() => controller.value?.abort());

  return { asyncData, fetchNow };
}

export function useOandaPositions(): UseOandaPositionsReturn {
  const { asyncData, fetchNow } = makeAbortableAsync<OandaPositionsResponse>(
    "oanda-positions",
    "/api/oanda/positions"
  );
  return {
    data: (asyncData as any).data,
    error: (asyncData as any).error,
    pending: asyncData.pending as any,
    fetchNow,
  };
}

export function useOandaTrades(): UseOandaTradesReturn {
  const { asyncData, fetchNow } = makeAbortableAsync<OandaTradesResponse>(
    "oanda-trades",
    "/api/oanda/trades"
  );
  return {
    data: (asyncData as any).data,
    error: (asyncData as any).error,
    pending: asyncData.pending as any,
    fetchNow,
  };
}
