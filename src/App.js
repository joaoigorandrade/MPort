import { useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import AddAssetModal from './components/AddAssetModal';
import Holdings from './pages/Holdings';
import Transactions from './pages/Transactions';
import { COLORS, AVAILABLE_ASSETS } from './utils/constants';
import { formatCurrency } from './utils/formatters';
import { usePortfolio } from './hooks/usePortfolio';
import { useCryptoPrices } from './hooks/useCryptoPrices';

export default function PortfolioManager() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const { prices, priceHistory, loading, lastUpdate, fetchPrices } = useCryptoPrices();
  const {
    holdings,
    transactions,
    newHolding,
    setNewHolding,
    showAddModal,
    setShowAddModal,
    handleAddHolding,
    handleDeleteHolding,
    portfolioValue,
    costBasis,
    gainLoss,
    gainLossPercent,
    sharpeRatio,
    allocationData,
  } = usePortfolio(prices, priceHistory);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <Header lastUpdate={lastUpdate} fetchPrices={fetchPrices} loading={loading} />

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'dashboard' && (
        <Dashboard
          portfolioValue={portfolioValue}
          costBasis={costBasis}
          gainLoss={gainLoss}
          gainLossPercent={gainLossPercent}
          sharpeRatio={sharpeRatio}
          allocationData={allocationData}
          priceHistory={priceHistory}
          holdings={holdings}
          formatCurrency={formatCurrency}
          COLORS={COLORS}
        />
      )}

      {activeTab === 'holdings' && (
        <Holdings
          setShowAddModal={setShowAddModal}
          holdings={holdings}
          prices={prices}
          handleDeleteHolding={handleDeleteHolding}
          formatCurrency={formatCurrency}
        />
      )}

      {activeTab === 'transactions' && (
        <Transactions transactions={transactions} formatCurrency={formatCurrency} />
      )}

      <AddAssetModal
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        newHolding={newHolding}
        setNewHolding={setNewHolding}
        handleAddHolding={handleAddHolding}
        AVAILABLE_ASSETS={AVAILABLE_ASSETS}
      />
    </div>
  );
}
