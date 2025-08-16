import { getQuery } from "h3";

export function parseInstruments(eventOrQuery: any): string[] {
  const isQuery =
    eventOrQuery &&
    (eventOrQuery.instruments !== undefined ||
      eventOrQuery.query !== undefined);
  const query = isQuery
    ? eventOrQuery.query ?? eventOrQuery
    : getQuery(eventOrQuery);
  const raw = query?.instruments;
  if (!raw) return ["EUR_USD"];
  if (Array.isArray(raw)) return raw as string[];
  return (raw as string)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function validateInstruments(instruments: string[]): string[] {
  const validInstrument = /^[A-Z0-9_]+$/;
  return instruments.filter((i) => validInstrument.test(i));
}

export function buildStreamUrl(
  baseUrl: string,
  accountId: string,
  instruments: string[]
) {
  return `${baseUrl}/accounts/${accountId}/pricing/stream?instruments=${instruments.join(
    ","
  )}`;
}
