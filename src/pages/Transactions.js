import React from 'react';

export default function Transactions({ transactions, formatCurrency }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Transaction Ledger</h2>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Date</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Type</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Asset</th>
              <th className="text-right p-4 text-sm font-medium text-slate-400">Quantity</th>
              <th className="text-right p-4 text-sm font-medium text-slate-400">Price</th>
              <th className="text-right p-4 text-sm font-medium text-slate-400">Total</th>
            </tr>
          </thead>
          <tbody>
            {[...transactions].reverse().map(tx => (
              <tr key={tx.id} className="border-t border-slate-800">
                <td className="p-4 text-slate-400">{tx.date}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    tx.type === 'BUY' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                  }`}>
                    {tx.type}
                  </span>
                </td>
                <td className="p-4 font-medium">{tx.symbol}</td>
                <td className="p-4 text-right">{tx.quantity}</td>
                <td className="p-4 text-right">{formatCurrency(tx.price)}</td>
                <td className="p-4 text-right font-medium">{formatCurrency(tx.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
