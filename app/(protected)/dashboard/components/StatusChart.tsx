'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Link from 'next/link';

export default function StatusChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] w-full flex flex-col items-center justify-center gap-3 text-gray-400 bg-gray-50/50 rounded-xl border border-gray-100">
        <span>No active loads.</span>
        <Link
          href="/loadboard"
          className="text-sm font-bold text-brand-600 hover:text-brand-700 bg-white border border-brand-200 px-4 py-2 rounded-full transition-colors"
        >
          Browse the loadboard &rarr;
        </Link>
      </div>
    );
  }

  const COLORS = {
    'DELIVERED': '#10b981', // emerald
    'INVOICED': '#059669', // dark emerald
    'IN_TRANSIT': '#3b82f6', // blue
    'BOOKED': '#8b5cf6', // purple
    'PENDING': '#f59e0b', // amber
    'CANCELLED': '#ef4444', // red
  };

  return (
    <div className="h-[300px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.name] || '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
            formatter={(value: any) => [value, 'Loads']}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-sm font-medium text-gray-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
