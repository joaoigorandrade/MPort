import React from 'react';
import { Activity, PieChart as PieIcon, List } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }) {
  return (
    <div className="flex gap-2 mb-6 bg-slate-900 p-1 rounded-lg w-fit">
      {[
        { id: 'dashboard', icon: Activity, label: 'Dashboard' },
        { id: 'holdings', icon: PieIcon, label: 'Holdings' },
        { id: 'transactions', icon: List, label: 'Transactions' },
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition ${
            activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
