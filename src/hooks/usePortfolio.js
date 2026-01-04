import { useState, useCallback } from 'react';
import { AVAILABLE_ASSETS, COLORS } from '../utils/constants';

export const usePortfolio = (prices, priceHistory) => {
  const [holdings, setHoldings] = useState([
    { id: 1, symbol: 'BTC', name: 'Bitcoin', quantity: 0.5, avgPrice: 42000, purchaseDate: '2024-01-15', type: 'Crypto' },
    { id: 2, symbol: 'ETH', name: 'Ethereum', quantity: 4, avgPrice: 2200, purchaseDate: '2024-02-20', type: 'Crypto' },
    { id: 3, symbol: 'SOL', name: 'Solana', quantity: 25, avgPrice: 95, purchaseDate: '2024-03-10', type: 'Crypto' },
  ]);

  const [transactions, setTransactions] = useState([
    { id: 1, type: 'BUY', symbol: 'BTC', quantity: 0.5, price: 42000, date: '2024-01-15', total: 21000 },
    { id: 2, type: 'BUY', symbol: 'ETH', quantity: 4, price: 2200, date: '2024-02-20', total: 8800 },
    { id: 3, type: 'BUY', symbol: 'SOL', quantity: 25, price: 95, date: '2024-03-10', total: 2375 },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHolding, setEditingHolding] = useState(null);

  const [newHolding, setNewHolding] = useState({
    symbol: 'BTC',
    quantity: '',
    avgPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  const calculatePortfolioValue = useCallback(() => {
    return holdings.reduce((total, h) => total + (h.quantity * (prices[h.symbol] || 0)), 0);
  }, [holdings, prices]);

  const calculateCostBasis = useCallback(() => {
    return holdings.reduce((total, h) => total + (h.quantity * h.avgPrice), 0);
  }, [holdings]);

  const calculateTotalGainLoss = useCallback(() => {
    const currentValue = calculatePortfolioValue();
    const costBasis = calculateCostBasis();
    return currentValue - costBasis;
  }, [calculatePortfolioValue, calculateCostBasis]);

  const calculateGainLossPercent = useCallback(() => {
    const costBasis = calculateCostBasis();
    if (costBasis === 0) return 0;
    return ((calculateTotalGainLoss() / costBasis) * 100);
  }, [calculateTotalGainLoss, calculateCostBasis]);

  const calculateSharpeRatio = useCallback(() => {
    if (priceHistory.length < 2) return 0;
    const returns = [];
    for (let i = 1; i < priceHistory.length; i++) {
      const prevTotal = holdings.reduce((sum, h) => sum + h.quantity * (priceHistory[i-1][h.symbol] || 0), 0);
      const currTotal = holdings.reduce((sum, h) => sum + h.quantity * (priceHistory[i][h.symbol] || 0), 0);
      if (prevTotal > 0) returns.push((currTotal - prevTotal) / prevTotal);
    }
    if (returns.length === 0) return 0;
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const riskFreeRate = 0.0001;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    return stdDev > 0 ? ((avgReturn - riskFreeRate) / stdDev) : 0;
  }, [priceHistory, holdings]);

  const getAllocationData = useCallback(() => {
    const total = calculatePortfolioValue();
    return holdings.map((h, i) => ({
      name: h.symbol,
      value: (h.quantity * (prices[h.symbol] || 0)),
      percentage: total > 0 ? ((h.quantity * (prices[h.symbol] || 0)) / total * 100).toFixed(1) : 0,
      color: COLORS[i % COLORS.length]
    })).filter(d => d.value > 0);
  }, [holdings, prices, calculatePortfolioValue]);

  const handleAddHolding = useCallback(() => {
    const asset = AVAILABLE_ASSETS.find(a => a.symbol === newHolding.symbol);
    const quantity = parseFloat(newHolding.quantity);
    const avgPrice = parseFloat(newHolding.avgPrice);

    if (!quantity || !avgPrice) return;

    const existingIndex = holdings.findIndex(h => h.symbol === newHolding.symbol);

    if (existingIndex >= 0) {
      const existing = holdings[existingIndex];
      const totalQty = existing.quantity + quantity;
      const newAvgPrice = ((existing.quantity * existing.avgPrice) + (quantity * avgPrice)) / totalQty;

      setHoldings(prev => prev.map((h, i) =>
        i === existingIndex ? { ...h, quantity: totalQty, avgPrice: newAvgPrice } : h
      ));
    } else {
      setHoldings(prev => [...prev, {
        id: Date.now(),
        symbol: newHolding.symbol,
        name: asset?.name || newHolding.symbol,
        quantity,
        avgPrice,
        purchaseDate: newHolding.purchaseDate,
        type: 'Crypto'
      }]);
    }

    setTransactions(prev => [...prev, {
      id: Date.now(),
      type: 'BUY',
      symbol: newHolding.symbol,
      quantity,
      price: avgPrice,
      date: newHolding.purchaseDate,
      total: quantity * avgPrice
    }]);

    setNewHolding({ symbol: 'BTC', quantity: '', avgPrice: '', purchaseDate: new Date().toISOString().split('T')[0] });
    setShowAddModal(false);
  }, [holdings, newHolding]);

  const handleDeleteHolding = useCallback((id) => {
    const holding = holdings.find(h => h.id === id);
    if (holding) {
      setTransactions(prev => [...prev, {
        id: Date.now(),
        type: 'SELL',
        symbol: holding.symbol,
        quantity: holding.quantity,
        price: prices[holding.symbol] || holding.avgPrice,
        date: new Date().toISOString().split('T')[0],
        total: holding.quantity * (prices[holding.symbol] || holding.avgPrice)
      }]);
    }
    setHoldings(prev => prev.filter(h => h.id !== id));
  }, [holdings, prices]);

  const portfolioValue = calculatePortfolioValue();
  const costBasis = calculateCostBasis();
  const gainLoss = calculateTotalGainLoss();
  const gainLossPercent = calculateGainLossPercent();
  const sharpeRatio = calculateSharpeRatio();
  const allocationData = getAllocationData();

  return {
    holdings, setHoldings,
    transactions, setTransactions,
    newHolding, setNewHolding,
    showAddModal, setShowAddModal,
    editingHolding, setEditingHolding,
    handleAddHolding,
    handleDeleteHolding,
    portfolioValue,
    costBasis,
    gainLoss,
    gainLossPercent,
    sharpeRatio,
    allocationData,
  };
};
