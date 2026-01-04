import React from 'react';
import { Wallet, RefreshCw } from 'lucide-react';

export default function Header({ lastUpdate, fetchPrices, loading }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Portfolio Manager</h1>
          <p className="text-slate-400 text-sm">Real-time crypto tracking</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {lastUpdate && (
          <span className="text-xs text-slate-500">
            Updated: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
        <button
          onClick={fetchPrices}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
    </div>
  );
}
