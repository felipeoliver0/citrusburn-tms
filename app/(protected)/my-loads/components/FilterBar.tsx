'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Filter } from 'lucide-react';

interface CompanyOption {
  id: string;
  companyName: string | null;
}

interface FilterBarProps {
  companies: CompanyOption[];
  currentCompanyId?: string;
  currentStatus?: string;
  isBroker: boolean;
}

export default function FilterBar({ companies, currentCompanyId, currentStatus, isBroker }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset page to 1 when filtering
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="glass-panel border border-gray-100 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center gap-4 bg-white shadow-sm">
      <div className="flex items-center gap-2 text-gray-500 font-bold text-sm uppercase tracking-wider whitespace-nowrap">
        <Filter size={16} /> Filters
      </div>
      
      <div className="flex flex-1 gap-4 w-full sm:w-auto">
        <select 
          className="flex-1 min-w-[150px] bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-2.5 transition-colors"
          value={currentStatus || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="OFFERED">Pending Signature</option>
          <option value="BOOKED">Dispatched</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="DELIVERED">Delivered</option>
        </select>

        <select 
          className="flex-1 min-w-[150px] bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-2.5 transition-colors"
          value={currentCompanyId || ''}
          onChange={(e) => handleFilterChange('companyId', e.target.value)}
        >
          <option value="">All {isBroker ? 'Carriers' : 'Brokers'}</option>
          {companies.map(company => (
            <option key={company.id} value={company.id}>
              {company.companyName || 'Unknown Company'}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
