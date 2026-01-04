import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { COLORS } from '../utils/constants';

export default function Holdings({
  setShowAddModal,
  holdings,
  prices,
  handleDeleteHolding,
  formatCurrency
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Holdings</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Add Asset
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Asset</th>
              <th className="text-right p-4 text-sm font-medium text-slate-400">Quantity</th>
              <th className="text-right p-4 text-sm font-medium text-slate-400">Avg Price</th>
              <th className="text-right p-4 text-sm font-medium text-slate-400">Current Price</th>
              <th className="text-right p-4 text-sm font-medium text-slate-400">Value</th>
              <th className="text-right p-4 text-sm font-medium text-slate-400">Gain/Loss</th>
              <th className="text-right p-4 text-sm font-medium text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, i) => {
              const currentPrice = prices[h.symbol] || 0;
              const currentValue = h.quantity * currentPrice;
              const cost = h.quantity * h.avgPrice;
              const gl = currentValue - cost;
              const glPercent = cost > 0 ? (gl / cost * 100) : 0;

              return (
                <tr key={h.id} className="border-t border-slate-800">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                           style={{ backgroundColor: COLORS[i % COLORS.length] + '30', color: COLORS[i % COLORS.length] }}>
                        {h.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium">{h.symbol}</div>
                        <div className="text-xs text-slate-400">{h.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">{h.quantity}</td>
                  <td className="p-4 text-right">{formatCurrency(h.avgPrice)}</td>
                  <td className="p-4 text-right">{formatCurrency(currentPrice)}</td>
                  <td className="p-4 text-right font-medium">{formatCurrency(currentValue)}</td>
                  <td className={`p-4 text-right ${gl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    <div>{gl >= 0 ? '+' : ''}{formatCurrency(gl)}</div>
                    <div className="text-xs">{glPercent.toFixed(2)}%</div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDeleteHolding(h.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
