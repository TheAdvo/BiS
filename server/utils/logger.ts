import pino from "pino";

const isDev = process.env.NODE_ENV === "development";

const logger = pino({
  level: isDev ? "debug" : "info",
  transport: isDev
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined,
});

/**
 * Logs a message with contextual information.
 * @param level Log level ('info', 'warn', 'error', 'debug').
 * @param message Log message.
 * @param context Additional context (e.g., API name, user ID).
 */
export const log = (
  level: "info" | "warn" | "error" | "debug",
  message: string,
  context?: Record<string, any>,
  debugEnabled?: boolean
) => {
  const timestamp = new Date().toISOString();
  if (level === "debug" && !debugEnabled) return;
  logger[level]({ timestamp, message, ...context });
};

export const info = (message: string, context?: Record<string, any>) =>
  log("info", message, context);
export const warn = (message: string, context?: Record<string, any>) =>
  log("warn", message, context);
export const error = (message: string, context?: Record<string, any>) =>
  log("error", message, context);
export const debug = (
  message: string,
  context?: Record<string, any>,
  debugEnabled?: boolean
) => log("debug", message, context, debugEnabled);

export const createServerLogger = (apiName: string) => {
  const isDev = process.env.NODE_ENV === "development";

  const extractOandaAction = (msg: string) => {
    const actions = [
      "positions",
      "trades",
      "candles",
      "pricing",
      "accounts",
      "orders",
    ];
    for (const action of actions) {
      if (msg.includes(action)) return action;
    }
    return "";
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString();
    const time = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return `${date} ${time}`;
  };

  const logger = pino({
    level: isDev ? "debug" : "info",
    transport: isDev
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  });

  const log = (
    level: "info" | "warn" | "error",
    message: string,
    data?: any
  ) => {
    const timestamp = formatTimestamp(new Date().toISOString());
    const action = extractOandaAction(message);
    const formattedMessage = action
      ? `[${timestamp}] [${apiName}] ${level.toUpperCase()} - ${message} (Action: ${action})`
      : `[${timestamp}] [${apiName}] ${level.toUpperCase()} - ${message}`;

    const logData = {
      message: formattedMessage,
      data,
      stack:
        level === "error" && data instanceof Error ? data.stack : undefined,
    };

    logger[level](logData);
  };

  return {
    info: (message: string, data?: any) => log("info", message, data),
    warn: (message: string, data?: any) => log("warn", message, data),
    error: (message: string, data?: any) => log("error", message, data),
  };
};
