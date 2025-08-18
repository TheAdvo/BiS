// OANDA Price Streaming SSE Endpoint
// This endpoint connects to OANDA's streaming pricing API using Node's https module.
// It authenticates using credentials from .env and streams real-time price updates as Server-Sent Events (SSE).
// Compatible with Nuxt 3 server API routes.
//
// Environment variables required in .env:
//   OANDA_API_KEY - Your OANDA API key
//   OANDA_ACCOUNT_ID - Your OANDA account ID
//   OANDA_STREAM_API_URL - Base URL for OANDA streaming (e.g. https://stream-fxpractice.oanda.com/v3)
//
// Usage:
//   GET /api/oanda/price-stream?instruments=EUR_USD,GBP_USD
//   Response: SSE stream of price updates for specified instruments

import { defineEventHandler, getQuery } from "h3";
import https from "https";
import {
  parseInstruments,
  buildStreamUrl,
  validateInstruments,
} from "./_helpers";
import { createServerLogger } from "~/server/utils/logger";

// Main handler for price streaming
export default defineEventHandler(async (event) => {
  const logger = createServerLogger("oanda:price-stream");

  // 1. Parse instruments from query string, fallback to EUR_USD
  const instruments: string[] = parseInstruments(event);

  // 2. Instrument validation (basic regex for OANDA format)
  // Only allow uppercase letters, numbers, and underscores, e.g. EUR_USD
  const valid = validateInstruments(instruments);
  if (valid.length !== instruments.length) {
    const invalid = instruments.filter((i) => !valid.includes(i));
    event.res.writeHead(400, { "Content-Type": "application/json" });
    event.res.end(
      JSON.stringify({ error: `Invalid instrument(s): ${invalid.join(", ")}` })
    );
    return;
  }

  // 3. Load credentials and streaming base URL from environment
  const apiKey = process.env.OANDA_API_KEY;
  const accountId = process.env.OANDA_ACCOUNT_ID;
  const streamBaseUrl =
    process.env.OANDA_STREAM_API_URL ||
    "https://stream-fxpractice.oanda.com/v3";

  // 4. Return 401 if credentials are missing
  if (!apiKey || !accountId) {
    event.res.writeHead(401, { "Content-Type": "application/json" });
    event.res.end(JSON.stringify({ error: "Missing OANDA credentials" }));
    return;
  }

  // 5. Set SSE headers for streaming response
  event.res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // 6. Heartbeat: Send a comment every 20 seconds to keep connection alive
  const HEARTBEAT_MS = 20_000;
  const heartbeatInterval = setInterval(() => {
    if (!event.res.writableEnded) {
      try {
        event.res.write(": heartbeat\n\n"); // SSE comment event
      } catch (e) {
        logger.error("failed writing heartbeat", e);
      }
    }
  }, HEARTBEAT_MS);

  // 7. Build OANDA streaming URL and request options
  const streamUrl = buildStreamUrl(streamBaseUrl, accountId, instruments);
  const options = {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Accept-Datetime-Format": "RFC3339",
      "User-Agent": "Nuxt-OANDA-SSE",
    },
  };

  // 8. Connect to OANDA price stream and forward PRICE events as SSE
  //    Add logging for connection status and errors
  logger.info("connecting", { streamUrl, instruments });

  const req = https.get(streamUrl, options, (upstreamRes) => {
    upstreamRes.setEncoding("utf8");
    let buffer = "";

    // Announce connection to client
    try {
      event.res.write(
        `event: status\ndata: ${JSON.stringify({
          status: "connected",
          instruments,
        })}\n\n`
      );
    } catch (e) {
      logger.error("failed writing connected status", e);
    }

    upstreamRes.on("data", (chunk) => {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.type === "PRICE") {
            event.res.write(`data: ${JSON.stringify(data)}\n\n`);
          } else if (data.type === "HEARTBEAT") {
            // Forward heartbeat to client and log it for observability (controlled by LOGGING_ENABLED)
            event.res.write(
              `event: heartbeat\ndata: ${JSON.stringify(data)}\n\n`
            );
            try {
              logger.info("heartbeat", data);
            } catch (e) {
              // Don't fail the stream for logging errors
            }
          }
        } catch (err: any) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          logger.error("parse error", { error: errorMsg, line });
          try {
            event.res.write(
              `event: error\ndata: ${JSON.stringify({
                error: "Parse error",
                details: errorMsg,
                line,
              })}\n\n`
            );
          } catch (e) {
            logger.error("failed writing parse error to client", e);
          }
        }
      }
    });

    upstreamRes.on("end", () => {
      logger.info("upstream stream ended");
      try {
        event.res.write(
          `event: status\ndata: ${JSON.stringify({
            status: "stream ended",
          })}\n\n`
        );
      } catch (e) {
        logger.error("failed writing stream ended", e);
      }
      event.res.end();
    });
  });

  // 9. Handle connection errors and forward as SSE error events
  req.on("error", (err) => {
    logger.error("upstream error", { error: err?.message });
    if (!event.res.writableEnded) {
      try {
        event.res.write(
          `event: error\ndata: ${JSON.stringify({ error: err?.message })}\n\n`
        );
      } catch (e) {
        logger.error("failed writing upstream error to client", e);
      }
      event.res.end();
    }
  });

  // 9. Use AbortController to coordinate single cleanup path
  const controller = new AbortController();

  const doCleanup = () => {
    logger.info("cleanup: aborting and removing listeners");
    try {
      if (!req.destroyed) req.destroy();
    } catch (e) {
      logger.error("error destroying request", e);
    }
    try {
      if (!event.res.writableEnded) event.res.end();
    } catch (e) {
      logger.error("error ending response", e);
    }
    clearInterval(heartbeatInterval);
    // remove cleanup listeners to avoid double-calling
    try {
      event.res.removeListener("close", onClose);
      event.res.removeListener("finish", onFinish);
    } catch (e) {
      // ignore
    }
  };

  const onClose = () => controller.abort();
  const onFinish = () => controller.abort();

  controller.signal.addEventListener("abort", doCleanup);

  event.res.on("close", onClose);
  event.res.on("finish", onFinish);
});
