// Storage service for persisting portfolio data in localStorage

const STORAGE_KEYS = {
  HOLDINGS: 'portfolio_holdings',
  TRANSACTIONS: 'portfolio_transactions',
  SETTINGS: 'portfolio_settings',
};

// Generate a unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Holdings CRUD operations
export const getHoldings = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HOLDINGS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading holdings:', error);
    return [];
  }
};

export const saveHoldings = (holdings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.HOLDINGS, JSON.stringify(holdings));
    return true;
  } catch (error) {
    console.error('Error saving holdings:', error);
    return false;
  }
};

export const addHolding = (holding) => {
  const holdings = getHoldings();
  const newHolding = {
    ...holding,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  holdings.push(newHolding);
  saveHoldings(holdings);
  return newHolding;
};

export const updateHolding = (id, updates) => {
  const holdings = getHoldings();
  const index = holdings.findIndex(h => h.id === id);
  if (index !== -1) {
    holdings[index] = { ...holdings[index], ...updates, updatedAt: new Date().toISOString() };
    saveHoldings(holdings);
    return holdings[index];
  }
  return null;
};

export const deleteHolding = (id) => {
  const holdings = getHoldings();
  const filtered = holdings.filter(h => h.id !== id);
  saveHoldings(filtered);
  // Also delete related transactions
  const transactions = getTransactions();
  const filteredTx = transactions.filter(t => t.holdingId !== id);
  saveTransactions(filteredTx);
  return true;
};

// Transactions CRUD operations
export const getTransactions = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading transactions:', error);
    return [];
  }
};

export const saveTransactions = (transactions) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return true;
  } catch (error) {
    console.error('Error saving transactions:', error);
    return false;
  }
};

export const addTransaction = (transaction) => {
  const transactions = getTransactions();
  const newTransaction = {
    ...transaction,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  transactions.push(newTransaction);
  saveTransactions(transactions);
  
  // Update holding amounts based on transaction
  updateHoldingFromTransaction(newTransaction);
  
  return newTransaction;
};

export const deleteTransaction = (id) => {
  const transactions = getTransactions();
  const transaction = transactions.find(t => t.id === id);
  const filtered = transactions.filter(t => t.id !== id);
  saveTransactions(filtered);
  
  // Recalculate holding from remaining transactions
  if (transaction) {
    recalculateHolding(transaction.holdingId);
  }
  
  return true;
};

// Helper to update holding based on transaction
const updateHoldingFromTransaction = (transaction) => {
  const holdings = getHoldings();
  const holding = holdings.find(h => h.id === transaction.holdingId);
  
  if (holding) {
    const transactions = getTransactions().filter(t => t.holdingId === holding.id);
    const { totalAmount, totalCost } = calculateFromTransactions(transactions);
    
    holding.amount = totalAmount;
    holding.costBasis = totalCost;
    saveHoldings(holdings);
  }
};

// Recalculate holding from all its transactions
const recalculateHolding = (holdingId) => {
  const holdings = getHoldings();
  const holding = holdings.find(h => h.id === holdingId);
  
  if (holding) {
    const transactions = getTransactions().filter(t => t.holdingId === holdingId);
    const { totalAmount, totalCost } = calculateFromTransactions(transactions);
    
    holding.amount = totalAmount;
    holding.costBasis = totalCost;
    saveHoldings(holdings);
  }
};

// Calculate total amount and cost basis from transactions
const calculateFromTransactions = (transactions) => {
  let totalAmount = 0;
  let totalCost = 0;
  
  transactions.forEach(tx => {
    const amount = parseFloat(tx.amount) || 0;
    const price = parseFloat(tx.price) || 0;
    const fee = parseFloat(tx.fee) || 0;
    
    if (tx.type === 'buy') {
      totalAmount += amount;
      totalCost += (amount * price) + fee;
    } else if (tx.type === 'sell') {
      // For sells, reduce amount and proportionally reduce cost basis
      const sellRatio = totalAmount > 0 ? amount / totalAmount : 0;
      totalAmount -= amount;
      totalCost -= totalCost * sellRatio;
      // Fee still adds to effective cost
      totalCost += fee;
    }
  });
  
  return {
    totalAmount: Math.max(0, totalAmount),
    totalCost: Math.max(0, totalCost),
  };
};

// Get transactions for a specific holding
export const getTransactionsForHolding = (holdingId) => {
  return getTransactions().filter(t => t.holdingId === holdingId);
};

// Settings
export const getSettings = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : { currency: 'USD', theme: 'dark' };
  } catch (error) {
    return { currency: 'USD', theme: 'dark' };
  }
};

export const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    return false;
  }
};

// Export/Import functionality
export const exportData = () => {
  return {
    holdings: getHoldings(),
    transactions: getTransactions(),
    settings: getSettings(),
    exportedAt: new Date().toISOString(),
  };
};

export const importData = (data) => {
  try {
    if (data.holdings) saveHoldings(data.holdings);
    if (data.transactions) saveTransactions(data.transactions);
    if (data.settings) saveSettings(data.settings);
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

// Clear all data
export const clearAllData = () => {
  localStorage.removeItem(STORAGE_KEYS.HOLDINGS);
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
};

// Initialize with sample data if empty
export const initializeSampleData = () => {
  const holdings = getHoldings();
  if (holdings.length === 0) {
    // Don't add sample data - let user start fresh
    return false;
  }
  return true;
};
