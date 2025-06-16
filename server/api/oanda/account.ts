export default defineEventHandler(async () => {
  const apiKey = process.env.OANDA_API_KEY;
  const accountId = process.env.OANDA_ACCOUNT_ID;
  const apiUrl = process.env.OANDA_API_URL ?? 'https://api-fxpractice.oanda.com/v3';

  const res = await fetch(`${apiUrl}/v3/accounts/${accountId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    console.error('OANDA fetch failed:', res.status, await res.text());
    throw createError({ statusCode: res.status, statusMessage: 'Failed to fetch OANDA account info' });
  }

  const data = await res.json();
  return data.account;
});
