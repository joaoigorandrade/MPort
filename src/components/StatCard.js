import React from 'react';

export default function StatCard({ title, value, icon: Icon, valueColorClass = 'text-white', description }) {
  return (
    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
      <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
        {Icon && <Icon className="w-4 h-4" />}
        {title}
      </div>
      <div className={`text-2xl font-bold ${valueColorClass}`}>{value}</div>
      {description && <div className="text-sm text-slate-500">{description}</div>}
    </div>
  );
}
