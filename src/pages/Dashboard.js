import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Activity } from 'lucide-react';
import StatCard from '../components/StatCard';
import AllocationChart from '../components/AllocationChart';
import PerformanceChart from '../components/PerformanceChart';

export default function Dashboard({
  portfolioValue,
  costBasis,
  gainLoss,
  gainLossPercent,
  sharpeRatio,
  allocationData,
  priceHistory,
  holdings,
  formatCurrency,
  COLORS
}) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Portfolio Value"
          value={formatCurrency(portfolioValue)}
          icon={DollarSign}
        />

        <StatCard
          title="Cost Basis"
          value={formatCurrency(costBasis)}
          icon={Wallet}
        />

        <StatCard
          title="Total Gain/Loss"
          value={`${gainLoss >= 0 ? '+' : ''}${formatCurrency(gainLoss)} (${gainLossPercent.toFixed(2)}%)`}
          icon={gainLoss >= 0 ? TrendingUp : TrendingDown}
          valueColorClass={gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}
        />

        <StatCard
          title="Sharpe Ratio"
          value={sharpeRatio.toFixed(3)}
          icon={Activity}
          description="Risk-adjusted return"
        />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <AllocationChart allocationData={allocationData} formatCurrency={formatCurrency} />
        <PerformanceChart priceHistory={priceHistory} holdings={holdings} formatCurrency={formatCurrency} />
      </div>

      {/* Top Performers */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
        <h3 className="text-lg font-semibold mb-4">Holdings Performance</h3>
        <div className="space-y-3">
          {holdings.map((h, i) => {
            const currentPrice = holdings.reduce((sum, holding) => sum + holding.quantity * (priceHistory.at(-1)?.[holding.symbol] || 0), 0) || 0; // Use latest price from priceHistory
            const currentValue = h.quantity * currentPrice;
            const cost = h.quantity * h.avgPrice;
            const gl = currentValue - cost;
            const glPercent = cost > 0 ? (gl / cost * 100) : 0;

            return (
              <div key={h.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                       style={{ backgroundColor: COLORS[i % COLORS.length] + '30', color: COLORS[i % COLORS.length] }}>
                    {h.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-medium">{h.name}</div>
                    <div className="text-sm text-slate-400">{h.quantity} {h.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(currentValue)}</div>
                  <div className={`text-sm ${gl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {gl >= 0 ? '+' : ''}{formatCurrency(gl)} ({glPercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
