// Price service for fetching real-time prices
// Supports crypto via Crypto.com API and stocks via Yahoo Finance

// Map common crypto symbols to Crypto.com instrument format
const CRYPTO_SYMBOL_MAP = {
  'BTC': 'BTCUSD',
  'ETH': 'ETHUSD',
  'SOL': 'SOLUSD',
  'DOGE': 'DOGEUSD',
  'XRP': 'XRPUSD',
  'ADA': 'ADAUSD',
  'DOT': 'DOTUSD',
  'LINK': 'LINKUSD',
  'AVAX': 'AVAXUSD',
  'MATIC': 'POLUSD',
  'ATOM': 'ATOMUSD',
  'LTC': 'LTCUSD',
  'UNI': 'UNIUSD',
  'SHIB': 'SHIBUSD',
  'CRO': 'CROUSD',
  'NEAR': 'NEARUSD',
  'APT': 'APTUSD',
  'ARB': 'ARBUSD',
  'OP': 'OPUSD',
  'SUI': 'SUIUSD',
  'PEPE': 'PEPEUSD',
  'BONK': 'BONKUSD',
  'WIF': 'WIFUSD',
  'RENDER': 'RENDERUSD',
  'FET': 'FETUSD',
  'INJ': 'INJUSD',
  'IMX': 'IMXUSD',
  'SEI': 'SEIUSD',
  'TIA': 'TIAUSD',
  'JUP': 'JUPUSD',
};

// Check if a symbol is crypto
export const isCryptoSymbol = (symbol) => {
  const upperSymbol = symbol.toUpperCase();
  return upperSymbol in CRYPTO_SYMBOL_MAP || 
         upperSymbol.endsWith('USD') || 
         upperSymbol.endsWith('-USD');
};

// Convert user symbol to Crypto.com format
export const toCryptoComSymbol = (symbol) => {
  const upperSymbol = symbol.toUpperCase().replace('-USD', '').replace('USD', '');
  return CRYPTO_SYMBOL_MAP[upperSymbol] || `${upperSymbol}USD`;
};

// This function will be called from the React app which has access to the MCP tools
// The actual API calls happen in the App component using the Crypto.com MCP
export const createPriceService = (fetchCryptoPrice) => {
  return {
    async fetchPrice(symbol) {
      if (isCryptoSymbol(symbol)) {
        const cryptoSymbol = toCryptoComSymbol(symbol);
        return await fetchCryptoPrice(cryptoSymbol);
      }
      // For stocks, return null - would need a backend proxy in production
      return null;
    },
    
    async fetchPrices(symbols) {
      const prices = {};
      for (const symbol of symbols) {
        try {
          const price = await this.fetchPrice(symbol);
          prices[symbol] = price || 0;
        } catch (error) {
          console.error(`Error fetching price for ${symbol}:`, error);
          prices[symbol] = 0;
        }
      }
      return prices;
    }
  };
};

// Popular crypto list for autocomplete
export const POPULAR_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A' },
  { symbol: 'ETH', name: 'Ethereum', color: '#627EEA' },
  { symbol: 'SOL', name: 'Solana', color: '#9945FF' },
  { symbol: 'XRP', name: 'Ripple', color: '#23292F' },
  { symbol: 'DOGE', name: 'Dogecoin', color: '#C2A633' },
  { symbol: 'ADA', name: 'Cardano', color: '#0033AD' },
  { symbol: 'AVAX', name: 'Avalanche', color: '#E84142' },
  { symbol: 'DOT', name: 'Polkadot', color: '#E6007A' },
  { symbol: 'LINK', name: 'Chainlink', color: '#2A5ADA' },
  { symbol: 'ATOM', name: 'Cosmos', color: '#2E3148' },
  { symbol: 'LTC', name: 'Litecoin', color: '#BFBBBB' },
  { symbol: 'UNI', name: 'Uniswap', color: '#FF007A' },
  { symbol: 'SHIB', name: 'Shiba Inu', color: '#FFA409' },
  { symbol: 'CRO', name: 'Cronos', color: '#002D74' },
  { symbol: 'NEAR', name: 'NEAR Protocol', color: '#00C08B' },
  { symbol: 'APT', name: 'Aptos', color: '#4CD7D0' },
  { symbol: 'ARB', name: 'Arbitrum', color: '#28A0F0' },
  { symbol: 'OP', name: 'Optimism', color: '#FF0420' },
  { symbol: 'SUI', name: 'Sui', color: '#6FBCF0' },
  { symbol: 'PEPE', name: 'Pepe', color: '#4D8C2A' },
  { symbol: 'BONK', name: 'Bonk', color: '#F9A825' },
  { symbol: 'WIF', name: 'dogwifhat', color: '#E8B849' },
  { symbol: 'RENDER', name: 'Render', color: '#000000' },
  { symbol: 'FET', name: 'Fetch.ai', color: '#1D2951' },
  { symbol: 'INJ', name: 'Injective', color: '#00F2FE' },
  { symbol: 'SEI', name: 'Sei', color: '#9B1C1C' },
  { symbol: 'TIA', name: 'Celestia', color: '#7B2BF9' },
  { symbol: 'JUP', name: 'Jupiter', color: '#00D395' },
];

// Get color for a crypto symbol
export const getCryptoColor = (symbol) => {
  const upperSymbol = symbol.toUpperCase().replace('-USD', '').replace('USD', '');
  const crypto = POPULAR_CRYPTOS.find(c => c.symbol === upperSymbol);
  return crypto?.color || '#6366F1';
};

// Format price display
export const formatPrice = (price, decimals = 2) => {
  if (price === null || price === undefined) return '—';
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

// Format large numbers
export const formatLargeNumber = (num) => {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};
