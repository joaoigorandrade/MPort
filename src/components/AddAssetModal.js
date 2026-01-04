import React from 'react';
import { X } from 'lucide-react';

export default function AddAssetModal({
  showAddModal,
  setShowAddModal,
  newHolding,
  setNewHolding,
  handleAddHolding,
  AVAILABLE_ASSETS
}) {
  if (!showAddModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md border border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Add Asset</h3>
          <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Asset</label>
            <select
              value={newHolding.symbol}
              onChange={e => setNewHolding(prev => ({ ...prev, symbol: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500"
            >
              {AVAILABLE_ASSETS.map(a => (
                <option key={a.symbol} value={a.symbol}>{a.symbol} - {a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Quantity</label>
            <input
              type="number"
              step="any"
              value={newHolding.quantity}
              onChange={e => setNewHolding(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder="0.00"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Purchase Price (USD)</label>
            <input
              type="number"
              step="any"
              value={newHolding.avgPrice}
              onChange={e => setNewHolding(prev => ({ ...prev, avgPrice: e.target.value }))}
              placeholder="0.00"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Purchase Date</label>
            <input
              type="date"
              value={newHolding.purchaseDate}
              onChange={e => setNewHolding(prev => ({ ...prev, purchaseDate: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={handleAddHolding}
            disabled={!newHolding.quantity || !newHolding.avgPrice}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed py-3 rounded-lg font-medium transition mt-2"
          >
            Add to Portfolio
          </button>
        </div>
      </div>
    </div>
  );
}
