export default defineEventHandler(async () => {
  const apiKey = process.env.OANDA_API_KEY;
  const accountId = process.env.OANDA_ACCOUNT_ID;
  const apiUrl = process.env.OANDA_API_URL ?? 'https://api-fxpractice.oanda.com/v3';

  // You can pass `instruments` via query later if needed
  const instruments = ['EUR_USD']; // Can be dynamic later

  const res = await fetch(`${apiUrl}/accounts/${accountId}/pricing?instruments=${instruments.join(',')}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    console.error('Pricing fetch failed', await res.text());
    throw createError({ statusCode: res.status, statusMessage: 'Failed to fetch pricing' });
  }

  const data = await res.json();
  return data.prices;
});
