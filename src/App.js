import { useState, useEffect, useCallback } from 'react';
import './App.css';
import {
  getHoldings,
  addHolding,
  deleteHolding,
  getTransactions,
  addTransaction,
  deleteTransaction,
  exportData,
  importData,
} from './services/storageService';
import { getCryptoColor, toCryptoComSymbol, POPULAR_CRYPTOS } from './services/priceService';
import Modal from './components/Modal';
import AddHoldingModal from './components/AddHoldingModal';
import AddTransactionModal from './components/AddTransactionModal';
import ConfirmModal from './components/ConfirmModal';

function App() {
  // Core state
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [priceHistory, setPriceHistory] = useState([]);

  // Modal state
  const [showAddHolding, setShowAddHolding] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [preselectedHoldingId, setPreselectedHoldingId] = useState(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadedHoldings = getHoldings();
    const loadedTransactions = getTransactions();
    setHoldings(loadedHoldings);
    setTransactions(loadedTransactions);
  }, []);

  // Fetch prices for all holdings
  const fetchPrices = useCallback(async () => {
    if (holdings.length === 0) return;
    
    setLoading(true);
    const newPrices = {};

    for (const holding of holdings) {
      try {
        const cryptoSymbol = toCryptoComSymbol(holding.symbol);
        // Use the ticker endpoint to get real-time price
        const response = await fetch(`https://api.crypto.com/v2/public/get-ticker?instrument_name=${cryptoSymbol}`);
        const data = await response.json();
        
        if (data.result && data.result.data) {
          newPrices[holding.symbol] = parseFloat(data.result.data.a) || 0; // 'a' is the ask price (current price)
        } else {
          newPrices[holding.symbol] = 0;
        }
      } catch (error) {
        console.error(`Error fetching price for ${holding.symbol}:`, error);
        newPrices[holding.symbol] = prices[holding.symbol] || 0;
      }
    }

    setPrices(newPrices);
    setLastUpdated(new Date());
    setLoading(false);

    // Add to price history for chart
    const portfolioValue = holdings.reduce((sum, holding) => {
      return sum + (holding.amount * (newPrices[holding.symbol] || 0));
    }, 0);

    if (portfolioValue > 0) {
      setPriceHistory(prev => {
        const newEntry = { time: new Date(), value: portfolioValue };
        return [...prev, newEntry].slice(-50);
      });
    }
  }, [holdings, prices]);

  // Fetch prices on mount and periodically
  useEffect(() => {
    if (holdings.length > 0) {
      fetchPrices();
      const interval = setInterval(fetchPrices, 30000);
      return () => clearInterval(interval);
    }
  }, [holdings.length]); // Only re-run when holdings count changes

  // Manual refresh
  const handleRefresh = () => {
    fetchPrices();
  };

  // Add new holding
  const handleAddHolding = (holdingData) => {
    const newHolding = addHolding(holdingData);
    setHoldings(prev => [...prev, newHolding]);
    // Fetch price for new holding
    setTimeout(fetchPrices, 100);
  };

  // Delete holding
  const handleDeleteHolding = (holdingId) => {
    const holding = holdings.find(h => h.id === holdingId);
    setDeleteTarget({ type: 'holding', id: holdingId, name: holding?.symbol });
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
    if (deleteTarget.type === 'holding') {
      deleteHolding(deleteTarget.id);
      setHoldings(prev => prev.filter(h => h.id !== deleteTarget.id));
      setTransactions(prev => prev.filter(t => t.holdingId !== deleteTarget.id));
    } else if (deleteTarget.type === 'transaction') {
      deleteTransaction(deleteTarget.id);
      // Reload holdings to get updated amounts
      setHoldings(getHoldings());
      setTransactions(prev => prev.filter(t => t.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  // Add transaction
  const handleAddTransaction = (txData) => {
    const newTx = addTransaction(txData);
    setTransactions(prev => [...prev, newTx]);
    // Reload holdings to get updated amounts
    setHoldings(getHoldings());
  };

  // Delete transaction
  const handleDeleteTransaction = (txId) => {
    const tx = transactions.find(t => t.id === txId);
    const holding = holdings.find(h => h.id === tx?.holdingId);
    setDeleteTarget({ 
      type: 'transaction', 
      id: txId, 
      name: `${tx?.type} of ${holding?.symbol}` 
    });
    setShowConfirmDelete(true);
  };

  // Quick add transaction from holding card
  const handleQuickAddTransaction = (holdingId) => {
    setPreselectedHoldingId(holdingId);
    setShowAddTransaction(true);
  };

  // Export data
  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import data
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          importData(data);
          setHoldings(getHoldings());
          setTransactions(getTransactions());
          alert('Data imported successfully!');
        } catch (error) {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Calculate portfolio metrics
  const totalCostBasis = holdings.reduce((sum, h) => sum + (h.costBasis || 0), 0);
  const portfolioValue = holdings.reduce((sum, holding) => {
    const price = prices[holding.symbol] || 0;
    return sum + (holding.amount * price);
  }, 0);
  const totalGain = portfolioValue - totalCostBasis;
  const gainPercent = totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

  // Enriched holdings with calculated values
  const enrichedHoldings = holdings.map(holding => {
    const price = prices[holding.symbol] || 0;
    const value = holding.amount * price;
    const gain = value - (holding.costBasis || 0);
    const gainPct = holding.costBasis > 0 ? (gain / holding.costBasis) * 100 : 0;
    const allocation = portfolioValue > 0 ? (value / portfolioValue) * 100 : 0;
    const color = holding.color || getCryptoColor(holding.symbol);
    
    return { ...holding, price, value, gain, gainPct, allocation, color };
  }).sort((a, b) => b.value - a.value);

  // Format helpers
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value, decimals = 2) => {
    if (value === undefined || value === null || isNaN(value)) return '—';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get transactions sorted by date
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

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
          </div>
        </div>
        
        <div className="header-actions">
          {lastUpdated && (
            <div className="last-updated">
              <span className="pulse"></span>
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <button className="refresh-btn" onClick={handleRefresh} disabled={loading}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? 'spinning' : ''}>
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Refresh
          </button>
          <button className="add-btn" onClick={() => setShowAddHolding(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Asset
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
                  <span className="stat-value">
                    {holdings.length === 0 ? '$0.00' : (loading && !lastUpdated ? '—' : formatCurrency(portfolioValue))}
                  </span>
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
                    {holdings.length === 0 ? '$0.00' : (loading && !lastUpdated ? '—' : (
                      <>
                        {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)}
                        <span className="stat-percent">({formatNumber(gainPercent)}%)</span>
                      </>
                    ))}
                  </span>
                </div>
              </div>
            </div>

            {holdings.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                  <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
                </svg>
                <h3>No assets yet</h3>
                <p>Add your first cryptocurrency to start tracking your portfolio</p>
                <button className="btn btn-primary" onClick={() => setShowAddHolding(true)}>
                  Add Your First Asset
                </button>
              </div>
            ) : (
              <div className="charts-grid">
                <div className="chart-card allocation-card">
                  <h3>Asset Allocation</h3>
                  <div className="allocation-chart">
                    <svg viewBox="0 0 100 100" className="donut-chart">
                      {enrichedHoldings.reduce((acc, holding, index) => {
                        const startAngle = acc.angle;
                        const sweepAngle = (holding.allocation / 100) * 360;
                        const endAngle = startAngle + sweepAngle;
                        
                        if (sweepAngle <= 0) {
                          acc.angle = endAngle;
                          return acc;
                        }
                        
                        const startRad = (startAngle - 90) * Math.PI / 180;
                        const endRad = (endAngle - 90) * Math.PI / 180;
                        
                        const x1 = 50 + 40 * Math.cos(startRad);
                        const y1 = 50 + 40 * Math.sin(startRad);
                        const x2 = 50 + 40 * Math.cos(endRad);
                        const y2 = 50 + 40 * Math.sin(endRad);
                        
                        const largeArc = sweepAngle > 180 ? 1 : 0;
                        
                        const path = (
                          <path
                            key={holding.id}
                            d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={holding.color}
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
                    {enrichedHoldings.map(holding => (
                      <div key={holding.id} className="legend-item">
                        <span
                          className="legend-dot"
                          style={{ background: holding.color }}
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
            )}
          </div>
        )}

        {activeTab === 'holdings' && (
          <div className="holdings">
            <div className="holdings-header">
              <h2>Your Holdings</h2>
              <div className="holdings-actions">
                <span className="holdings-count">{holdings.length} asset{holdings.length !== 1 ? 's' : ''}</span>
                <button className="add-btn" onClick={() => setShowAddHolding(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add Asset
                </button>
              </div>
            </div>
            
            {holdings.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <h3>No holdings yet</h3>
                <p>Add your first cryptocurrency to start tracking</p>
                <button className="btn btn-primary" onClick={() => setShowAddHolding(true)}>
                  Add Your First Asset
                </button>
              </div>
            ) : (
              <div className="holdings-list">
                {enrichedHoldings.map((holding, index) => (
                  <div 
                    key={holding.id} 
                    className="holding-card"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="holding-icon" style={{ background: holding.color }}>
                      {holding.symbol.charAt(0)}
                    </div>
                    <div className="holding-info">
                      <span className="holding-name">{holding.name}</span>
                      <span className="holding-symbol">{holding.symbol}</span>
                    </div>
                    <div className="holding-amount">
                      <span className="amount-value">{formatNumber(holding.amount, 6)}</span>
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
                    <div className="holding-actions">
                      <button 
                        className="holding-action-btn" 
                        title="Add transaction"
                        onClick={() => handleQuickAddTransaction(holding.id)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </button>
                      <button 
                        className="holding-action-btn delete" 
                        title="Delete holding"
                        onClick={() => handleDeleteHolding(holding.id)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="transactions">
            <div className="transactions-header">
              <h2>Transaction History</h2>
              <div className="holdings-actions">
                <button className="add-btn" onClick={() => {
                  setPreselectedHoldingId(null);
                  setShowAddTransaction(true);
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add Transaction
                </button>
              </div>
            </div>
            
            {transactions.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
                <h3>No transactions yet</h3>
                <p>Record your first buy or sell to track your cost basis</p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    setPreselectedHoldingId(null);
                    setShowAddTransaction(true);
                  }}
                  disabled={holdings.length === 0}
                >
                  {holdings.length === 0 ? 'Add an asset first' : 'Record Transaction'}
                </button>
              </div>
            ) : (
              <div className="transactions-list">
                {sortedTransactions.map(tx => {
                  const holding = holdings.find(h => h.id === tx.holdingId);
                  const total = tx.amount * tx.price + (tx.type === 'buy' ? tx.fee : -tx.fee);
                  
                  return (
                    <div key={tx.id} className="transaction-card">
                      <div className={`transaction-type-badge ${tx.type}`}>
                        {tx.type === 'buy' ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 19V5M5 12l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12l7 7 7-7" />
                          </svg>
                        )}
                      </div>
                      <div className="transaction-info">
                        <span className="transaction-title">
                          {tx.type === 'buy' ? 'Bought' : 'Sold'} {holding?.symbol || 'Unknown'}
                        </span>
                        <span className="transaction-date">{formatDate(tx.date)}</span>
                      </div>
                      <div className="transaction-amount">
                        <span>{formatNumber(tx.amount, 6)}</span>
                        <span>{holding?.symbol}</span>
                      </div>
                      <div className="transaction-price">
                        <span>{formatCurrency(tx.price)}</span>
                        <span>per unit</span>
                      </div>
                      <div className="transaction-total">
                        <span className={tx.type === 'buy' ? 'negative' : 'positive'}>
                          {tx.type === 'buy' ? '-' : '+'}{formatCurrency(Math.abs(total))}
                        </span>
                        <span>Total</span>
                      </div>
                      <button 
                        className="transaction-delete-btn"
                        onClick={() => handleDeleteTransaction(tx.id)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <AddHoldingModal
        isOpen={showAddHolding}
        onClose={() => setShowAddHolding(false)}
        onAdd={handleAddHolding}
        existingSymbols={holdings.map(h => h.symbol)}
      />

      <AddTransactionModal
        isOpen={showAddTransaction}
        onClose={() => {
          setShowAddTransaction(false);
          setPreselectedHoldingId(null);
        }}
        onAdd={handleAddTransaction}
        holdings={holdings}
        currentPrices={prices}
        preselectedHoldingId={preselectedHoldingId}
      />

      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => {
          setShowConfirmDelete(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title={`Delete ${deleteTarget?.type === 'holding' ? 'Asset' : 'Transaction'}`}
        message={
          deleteTarget?.type === 'holding'
            ? `Are you sure you want to delete ${deleteTarget?.name}? This will also delete all associated transactions.`
            : `Are you sure you want to delete this ${deleteTarget?.name} transaction? This will update your holdings and cost basis.`
        }
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

export default App;
