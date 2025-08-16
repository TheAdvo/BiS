// server/utils/oandaClient.ts
import { serverCache } from "./cache";
import { debug as logDebug, error as logError } from "./logger";
import { createError } from "h3";

interface OandaConfig {
  apiKey: string;
  accountId: string;
  apiUrl: string;
}

interface OandaApiOptions {
  cache?: boolean;
  cacheTTL?: number;
  retries?: number;
  timeout?: number;
  debug?: boolean; // New: enable logging for this specific request
}

class OandaApiClient {
  private config: OandaConfig;
  private debugEnabled: boolean;

  constructor() {
    const apiKey = process.env.OANDA_API_KEY;
    const accountId = process.env.OANDA_ACCOUNT_ID;
    let apiUrl =
      process.env.OANDA_API_URL ?? "https://api-fxpractice.oanda.com";

    if (!apiKey) throw new Error("Missing OANDA_API_KEY environment variable");
    if (!accountId)
      throw new Error("Missing OANDA_ACCOUNT_ID environment variable");

    if (!apiUrl.endsWith("/v3")) {
      apiUrl = `${apiUrl}/v3`;
    }

    this.config = { apiKey, accountId, apiUrl };
    // Read debug flag from .env (OANDA_DEBUG or DEBUG)
    const envDebug = process.env.OANDA_DEBUG ?? process.env.DEBUG;
    this.debugEnabled = envDebug === "true" || envDebug === "1";
    logDebug(
      "OandaApiClient debugEnabled",
      { debugEnabled: this.debugEnabled },
      this.debugEnabled
    );
  }

  async request<T>(
    endpoint: string,
    options: OandaApiOptions = {}
  ): Promise<T> {
    const {
      cache = true,
      cacheTTL = 30000,
      retries = 3,
      timeout = 10000,
      debug = this.debugEnabled, // Disable/Enable debug logging for this request
    } = options;

    const url = `${this.config.apiUrl}${endpoint}`;
    const cacheKey = `oanda:${endpoint}`;

    const fetchFn = async (): Promise<T> => {
      const start = Date.now();
      const result = await this.executeRequest<T>(url, retries, timeout, debug);
      const duration = Date.now() - start;
      logDebug(`Request timing`, { url, duration }, debug);
      return result;
    };

    if (cache) {
      logDebug(`Cache access`, { cacheKey, cacheTTL, cache }, debug);
      return serverCache.get(cacheKey, fetchFn, cacheTTL);
    } else {
      logDebug(`Cache bypass`, { cacheKey, cache }, debug);
      return fetchFn();
    }
  }

  private async executeRequest<T>(
    url: string,
    retries: number,
    timeout: number,
    debug = false
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (debug) {
          logDebug(
            `OANDA request: ${
              url.split("/v3")[1]
            } (attempt ${attempt}/${retries})`,
            { url, attempt, retries },
            debug
          );
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
            "User-Agent": "ADVOAI-Trading-Engine/1.0",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const raw = await response.text();
          let parsed: any = null;
          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch (parseErr) {
            logDebug(`Response parse error`, { raw, error: parseErr }, debug);
          }

          // Always log errors
          logError(
            `OANDA ${response.status}: ${
              parsed?.errorMessage || response.statusText
            }`,
            { url, status: response.status, parsed }
          );

          if (response.status === 401) {
            throw createError({
              statusCode: 401,
              statusMessage: "Invalid OANDA API credentials",
            });
          } else if (response.status === 404) {
            if (attempt < retries) {
              const waitTime = Math.pow(2, attempt) * 1000;
              if (debug)
                logDebug(
                  `Rate limited, waiting ${waitTime}ms`,
                  { waitTime },
                  debug
                );
              await new Promise((r) => setTimeout(r, waitTime));
              continue;
            }
            throw createError({
              statusCode: 429,
              statusMessage: "OANDA API rate limit exceeded",
            });
          } else if (response.status >= 500 && attempt < retries) {
            const waitTime = Math.pow(2, attempt) * 1000;
            if (debug)
              logDebug(
                `Server error, retrying in ${waitTime}ms`,
                { waitTime },
                debug
              );
            await new Promise((r) => setTimeout(r, waitTime));
            continue;
          }

          const statusMessage =
            parsed?.errorMessage ||
            parsed?.message ||
            `${response.status} ${response.statusText}`;
          throw createError({ statusCode: response.status, statusMessage });
        }
        const data = await response.json();

        if (debug) {
          const endpoint = url.split("/v3")[1];
          const size = JSON.stringify(data).length;
          logDebug(
            `OANDA success: ${endpoint} (${size} bytes)`,
            {
              endpoint,
              size,
            },
            debug
          );
        }

        return data;
      } catch (error: any) {
        lastError = error;

        if (error.statusCode) {
          throw error;
        }

        if (attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          if (debug)
            logDebug(
              `Network error, retrying in ${waitTime}ms`,
              { waitTime },
              debug
            );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
      }
    }
    logError(`OANDA request failed after ${retries} attempts`, {
      url,
      retries,
    });
    throw createError({
      statusCode: 500,
      statusMessage: "Unable to connect to OANDA API after multiple attempts",
    });
  }
  // Regular methods (no logging)
  async getAccount() {
    return this.request(`/accounts/${this.config.accountId}`, {
      cacheTTL: 15000,
    });
  }

  async getInstruments() {
    return this.request(`/accounts/${this.config.accountId}/instruments`, {
      cacheTTL: 60 * 60 * 1000,
    });
  }

  async getPricing(instruments: string[]) {
    const instrumentsParam = instruments.join(",");
    return this.request(
      `/accounts/${this.config.accountId}/pricing?instruments=${instrumentsParam}`,
      { cacheTTL: 5000 }
    );
  }

  async getCandles(
    instrument: string,
    granularity: string = "M5",
    count = 100,
    opts?: {
      price?: "M" | "B" | "A" | "MBA";
      includeFirst?: boolean;
      smooth?: boolean;
      from?: string;
      to?: string;
      cache?: boolean;
      cacheTTL?: number;
    }
  ) {
    const params = new URLSearchParams();
    params.set("granularity", granularity.toUpperCase());
    params.set("price", opts?.price ?? "M");

    if (opts?.from || opts?.to) {
      if (opts?.from) params.set("from", opts.from);
      if (opts?.to) params.set("to", opts.to);
      if (opts?.from && typeof opts.includeFirst === "boolean") {
        params.set("includeFirst", String(opts.includeFirst));
      }
    } else {
      params.set("count", String(count));
    }

    if (typeof opts?.smooth === "boolean") {
      params.set("smooth", String(opts.smooth));
    }

    const endpoint = `/instruments/${instrument}/candles?${params.toString()}`;
    return this.request(endpoint, {
      cache: opts?.cache ?? true,
      cacheTTL: opts?.cacheTTL ?? 30000,
    });
  }

  async getPositions() {
    return this.request(`/accounts/${this.config.accountId}/positions`, {
      cacheTTL: 10000,
    });
  }

  async getTrades() {
    return this.request(`/accounts/${this.config.accountId}/trades`, {
      cacheTTL: 10000,
    });
  }

  // Debug methods (with logging enabled)
  async debugGetAccount() {
    return this.request(`/accounts/${this.config.accountId}`, {
      cacheTTL: 15000,
      debug: true,
    });
  }

  async debugGetCandles(
    instrument: string,
    granularity: string = "M5",
    count = 100
  ) {
    const params = new URLSearchParams();
    params.set("granularity", granularity.toUpperCase());
    params.set("price", "M");
    params.set("count", String(count));

    const endpoint = `/instruments/${instrument}/candles?${params.toString()}`;
    return this.request(endpoint, { cache: false, debug: true });
  }

  async debugPlaceOrder(order: {
    instrument: string;
    units: number;
    type: string;
    takeProfit?: number;
    stopLoss?: number;
  }) {
    logDebug(
      `Placing order: ${order.instrument} ${order.units} units`,
      {
        order,
      },
      this.debugEnabled
    );
    const result = await this.placeOrder(order);
    logDebug(`Order result`, { result }, this.debugEnabled);
    return result;
  }

  async placeOrder(order: {
    instrument: string;
    units: number;
    type: string;
    takeProfit?: number;
    stopLoss?: number;
  }) {
    // Only log errors, not success
    let tpPrice, slPrice;
    if (order.takeProfit || order.stopLoss) {
      const pricing: any = await this.getPricing([order.instrument]);
      const pricesArr = Array.isArray(pricing?.prices) ? pricing.prices : [];
      const priceObj = pricesArr[0] || {};
      const current =
        priceObj.closeoutAsk ||
        (priceObj.asks && priceObj.asks[0]?.price) ||
        (priceObj.bids && priceObj.bids[0]?.price);
      const currentPrice = parseFloat(current);
      const pip = order.instrument.includes("JPY") ? 0.01 : 0.0001;

      if (order.takeProfit && order.takeProfit > 0) {
        tpPrice =
          order.units > 0
            ? currentPrice + order.takeProfit * pip
            : currentPrice - order.takeProfit * pip;
        tpPrice = tpPrice.toFixed(5);
      }
      if (order.stopLoss && order.stopLoss > 0) {
        slPrice =
          order.units > 0
            ? currentPrice - order.stopLoss * pip
            : currentPrice + order.stopLoss * pip;
        slPrice = slPrice.toFixed(5);
      }
    }

    const payload: any = {
      order: {
        instrument: order.instrument,
        units: order.units.toString(),
        type: order.type.toUpperCase(),
        positionFill: "DEFAULT",
      },
    };
    if (tpPrice) payload.order.takeProfitOnFill = { price: tpPrice };
    if (slPrice) payload.order.stopLossOnFill = { price: slPrice };
    logDebug(`Order payload`, { payload }, this.debugEnabled);

    const endpoint = `/accounts/${this.config.accountId}/orders`;
    const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "ADVOAI-Trading-Engine/1.0",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      logError(`OANDA order failed`, {
        responseData: data,
        status: response.status,
      });
      throw createError({
        statusCode: response.status,
        statusMessage: data.errorMessage || "OANDA order failed",
      });
    }

    return data;
  }

  invalidateCache(pattern?: string): void {
    if (pattern) {
      logDebug(`Cache invalidated`, { pattern }, this.debugEnabled);
      serverCache.invalidate(`oanda:${pattern}`);
    } else {
      logDebug(`Cache cleared`, {}, this.debugEnabled);
      serverCache.clear();
    }
  }
}

export const oandaClient = new OandaApiClient();
