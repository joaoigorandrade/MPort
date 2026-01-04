// Browser-compatible Yahoo Finance API service using direct fetch calls

const YAHOO_FINANCE_API = 'https://query1.finance.yahoo.com/v7/finance/quote';

// Fetch real-time stock quotes
export const fetchStockPrices = async (symbols) => {
  try {
    const prices = {};

    // Yahoo Finance API accepts multiple symbols in a single request
    const symbolsParam = symbols.join(',');
    const url = `${YAHOO_FINANCE_API}?symbols=${symbolsParam}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Parse the response and extract prices
    if (data.quoteResponse && data.quoteResponse.result) {
      data.quoteResponse.result.forEach(quote => {
        prices[quote.symbol] = quote.regularMarketPrice || 0;
      });
    }

    // Fill in 0 for symbols that didn't return data
    symbols.forEach(symbol => {
      if (!(symbol in prices)) {
        prices[symbol] = 0;
      }
    });

    return prices;
  } catch (error) {
    console.error('Error fetching stock prices:', error);
    // Return empty prices object on error
    const prices = {};
    symbols.forEach(symbol => {
      prices[symbol] = 0;
    });
    return prices;
  }
};

// Fetch detailed quote information
export const fetchQuoteDetails = async (symbol) => {
  try {
    const url = `${YAHOO_FINANCE_API}?symbols=${symbol}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.quoteResponse && data.quoteResponse.result && data.quoteResponse.result.length > 0) {
      const quote = data.quoteResponse.result[0];
      return {
        symbol: quote.symbol,
        name: quote.longName || quote.shortName || symbol,
        price: quote.regularMarketPrice || 0,
        previousClose: quote.regularMarketPreviousClose || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        dayHigh: quote.regularMarketDayHigh || 0,
        dayLow: quote.regularMarketDayLow || 0,
        volume: quote.regularMarketVolume || 0,
        marketCap: quote.marketCap || 0,
      };
    }

    throw new Error('No data returned for symbol');
  } catch (error) {
    console.error(`Error fetching quote details for ${symbol}:`, error);
    throw error;
  }
};
