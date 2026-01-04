import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { fetchStockPrices } from './services/stockService';

// Portfolio data - customize your holdings here
// You can add any stock symbols (e.g., AAPL, GOOGL, TSLA, MSFT)
// or crypto symbols with -USD suffix (e.g., BTC-USD, ETH-USD)
const PORTFOLIO = [
  { symbol: 'AAPL', name: 'Apple Inc.', amount: 10, costBasis: 1500 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', amount: 5, costBasis: 700 },
  { symbol: 'TSLA', name: 'Tesla Inc.', amount: 8, costBasis: 2000 },
  { symbol: 'BTC-USD', name: 'Bitcoin', amount: 0.5, costBasis: 15000 },
  { symbol: 'ETH-USD', name: 'Ethereum', amount: 4.2, costBasis: 8400 },
];

const ASSET_COLORS = {
  AAPL: { primary: '#A6B1E1', gradient: 'linear-gradient(135deg, #A6B1E1 0%, #DCD6F7 100%)' },
  GOOGL: { primary: '#4285F4', gradient: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)' },
  TSLA: { primary: '#E82127', gradient: 'linear-gradient(135deg, #E82127 0%, #CC0000 100%)' },
  'BTC-USD': { primary: '#F7931A', gradient: 'linear-gradient(135deg, #F7931A 0%, #FFAB40 100%)' },
  'ETH-USD': { primary: '#627EEA', gradient: 'linear-gradient(135deg, #627EEA 0%, #8B9FFF 100%)' },
};

function App() {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [priceHistory, setPriceHistory] = useState([]);

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);

      // Get all symbols from portfolio
      const symbols = PORTFOLIO.map(holding => holding.symbol);

      // Fetch real prices from Yahoo Finance
      const realPrices = await fetchStockPrices(symbols);

      setPrices(realPrices);
      setLastUpdated(new Date());
      setLoading(false);

      // Add to price history for chart
      setPriceHistory(prev => {
        const newEntry = {
          time: new Date(),
          value: PORTFOLIO.reduce((sum, holding) => {
            return sum + (holding.amount * (realPrices[holding.symbol] || 0));
          }, 0)
        };
        const updated = [...prev, newEntry].slice(-20);
        return updated;
      });
    } catch (error) {
      console.error('Error fetching prices:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const calculatePortfolioValue = () => {
    return PORTFOLIO.reduce((sum, holding) => {
      const price = prices[holding.symbol] || 0;
      return sum + (holding.amount * price);
    }, 0);
  };

  const totalCostBasis = PORTFOLIO.reduce((sum, h) => sum + h.costBasis, 0);
  const portfolioValue = calculatePortfolioValue();
  const totalGain = portfolioValue - totalCostBasis;
  const gainPercent = totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

  const holdings = PORTFOLIO.map(holding => {
    const price = prices[holding.symbol] || 0;
    const value = holding.amount * price;
    const gain = value - holding.costBasis;
    const gainPct = holding.costBasis > 0 ? (gain / holding.costBasis) * 100 : 0;
    const allocation = portfolioValue > 0 ? (value / portfolioValue) * 100 : 0;
    
    return { ...holding, price, value, gain, gainPct, allocation };
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  return (
    <div className="app">
      <div className="background-effects">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
      
      <header className="header">
        <div className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="logo-text">
            <span className="logo-name">Portfolio</span>
            <span className="logo-tagline">Real-time portfolio tracking</span>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="last-updated">
            {lastUpdated && (
              <>
                <span className="pulse"></span>
                Updated {lastUpdated.toLocaleTimeString()}
              </>
            )}
          </div>
          <button className="refresh-btn" onClick={fetchPrices} disabled={loading}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? 'spinning' : ''}>
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Refresh
          </button>
        </div>
      </header>

      <nav className="tabs">
        {['dashboard', 'holdings', 'transactions'].map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'dashboard' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
            )}
            {tab === 'holdings' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            )}
            {tab === 'transactions' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
            )}
            <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
          </button>
        ))}
      </nav>

      <main className="main">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                </div>
                <div className="stat-content">
                  <span className="stat-label">Portfolio Value</span>
                  <span className="stat-value">{loading ? '—' : formatCurrency(portfolioValue)}</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <div className="stat-content">
                  <span className="stat-label">Cost Basis</span>
                  <span className="stat-value">{formatCurrency(totalCostBasis)}</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon gain">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M23 6l-9.5 9.5-5-5L1 18" />
                    <path d="M17 6h6v6" />
                  </svg>
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Gain/Loss</span>
                  <span className={`stat-value ${totalGain >= 0 ? 'positive' : 'negative'}`}>
                    {loading ? '—' : `${totalGain >= 0 ? '+' : ''}${formatCurrency(totalGain)}`}
                    <span className="stat-percent">({formatNumber(gainPercent)}%)</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-card allocation-card">
                <h3>Asset Allocation</h3>
                <div className="allocation-chart">
                  <svg viewBox="0 0 100 100" className="donut-chart">
                    {holdings.reduce((acc, holding, index) => {
                      const startAngle = acc.angle;
                      const sweepAngle = (holding.allocation / 100) * 360;
                      const endAngle = startAngle + sweepAngle;
                      
                      const startRad = (startAngle - 90) * Math.PI / 180;
                      const endRad = (endAngle - 90) * Math.PI / 180;
                      
                      const x1 = 50 + 40 * Math.cos(startRad);
                      const y1 = 50 + 40 * Math.sin(startRad);
                      const x2 = 50 + 40 * Math.cos(endRad);
                      const y2 = 50 + 40 * Math.sin(endRad);
                      
                      const largeArc = sweepAngle > 180 ? 1 : 0;
                      
                      const path = (
                        <path
                          key={holding.symbol}
                          d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={ASSET_COLORS[holding.symbol]?.primary || '#666'}
                          className="donut-segment"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        />
                      );
                      
                      acc.paths.push(path);
                      acc.angle = endAngle;
                      return acc;
                    }, { paths: [], angle: 0 }).paths}
                    <circle cx="50" cy="50" r="25" fill="var(--card-bg)" />
                  </svg>
                </div>
                <div className="allocation-legend">
                  {holdings.map(holding => (
                    <div key={holding.symbol} className="legend-item">
                      <span
                        className="legend-dot"
                        style={{ background: ASSET_COLORS[holding.symbol]?.gradient || '#666' }}
                      ></span>
                      <span className="legend-symbol">{holding.symbol}</span>
                      <span className="legend-value">{formatNumber(holding.allocation)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card performance-card">
                <h3>Portfolio Performance</h3>
                <div className="performance-chart">
                  {priceHistory.length > 1 && (
                    <svg viewBox="0 0 400 150" preserveAspectRatio="none" className="line-chart">
                      <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {(() => {
                        const values = priceHistory.map(p => p.value);
                        const min = Math.min(...values) * 0.995;
                        const max = Math.max(...values) * 1.005;
                        const range = max - min || 1;
                        
                        const points = priceHistory.map((p, i) => {
                          const x = (i / (priceHistory.length - 1)) * 400;
                          const y = 150 - ((p.value - min) / range) * 140 - 5;
                          return `${x},${y}`;
                        }).join(' ');
                        
                        const areaPoints = `0,150 ${points} 400,150`;
                        
                        return (
                          <>
                            <polygon points={areaPoints} fill="url(#chartGradient)" className="chart-area" />
                            <polyline
                              points={points}
                              fill="none"
                              stroke="var(--accent)"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="chart-line"
                            />
                          </>
                        );
                      })()}
                    </svg>
                  )}
                  {priceHistory.length <= 1 && (
                    <div className="chart-placeholder">
                      <span>Collecting data...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'holdings' && (
          <div className="holdings">
            <div className="holdings-header">
              <h2>Your Holdings</h2>
              <span className="holdings-count">{holdings.length} assets</span>
            </div>
            <div className="holdings-list">
              {holdings.map((holding, index) => (
                <div 
                  key={holding.symbol} 
                  className="holding-card"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="holding-icon" style={{ background: ASSET_COLORS[holding.symbol]?.gradient || '#666' }}>
                    {holding.symbol.charAt(0)}
                  </div>
                  <div className="holding-info">
                    <span className="holding-name">{holding.name}</span>
                    <span className="holding-symbol">{holding.symbol}</span>
                  </div>
                  <div className="holding-amount">
                    <span className="amount-value">{formatNumber(holding.amount, 4)}</span>
                    <span className="amount-label">{holding.symbol}</span>
                  </div>
                  <div className="holding-price">
                    <span className="price-value">{formatCurrency(holding.price)}</span>
                    <span className="price-label">Price</span>
                  </div>
                  <div className="holding-value">
                    <span className="value-amount">{formatCurrency(holding.value)}</span>
                    <span className={`value-change ${holding.gain >= 0 ? 'positive' : 'negative'}`}>
                      {holding.gain >= 0 ? '+' : ''}{formatNumber(holding.gainPct)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="transactions">
            <div className="transactions-header">
              <h2>Transaction History</h2>
            </div>
            <div className="transactions-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              <span>No transactions yet</span>
              <p>Your transaction history will appear here</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
