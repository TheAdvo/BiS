export default defineEventHandler(async () => {
  const apiKey = process.env.OANDA_API_KEY;
  const accountId = process.env.OANDA_ACCOUNT_ID;
  const apiUrl = process.env.OANDA_API_URL ?? 'https://api-fxpractice.oanda.com/v3';

  // Validate required environment variables
  if (!apiKey) {
    console.error('Missing OANDA_API_KEY environment variable');
    throw createError({ statusCode: 500, statusMessage: 'OANDA API key not configured' });
  }

  if (!accountId) {
    console.error('Missing OANDA_ACCOUNT_ID environment variable');
    throw createError({ statusCode: 500, statusMessage: 'OANDA account ID not configured' });
  }

  try {
    const res = await fetch(`${apiUrl}/v3/accounts/${accountId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`OANDA API error: ${res.status} ${res.statusText}`, errorText);

      if (res.status === 401) {
        throw createError({ statusCode: 401, statusMessage: 'Invalid OANDA API credentials' });
      } else if (res.status === 404) {
        throw createError({ statusCode: 404, statusMessage: 'OANDA account not found' });
      } else {
        throw createError({ statusCode: res.status, statusMessage: 'Failed to fetch OANDA account data' });
      }
    }

    const data = await res.json();
    return {
      ...data.account,
      accountID: accountId // Add the account ID from environment variable
    };
  } catch (error: any) {
    if (error.statusCode) {
      // Re-throw our custom errors
      throw error;
    }
    // Handle network errors or other unexpected errors
    console.error('Unexpected error fetching OANDA account:', error);
    throw createError({ statusCode: 500, statusMessage: 'Unable to connect to OANDA API' });
  }
});
