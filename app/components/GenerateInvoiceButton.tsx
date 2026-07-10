'use client';

import { generateInvoice, InvoiceData } from '@/lib/invoiceGenerator';

export default function GenerateInvoiceButton({ invoiceData }: { invoiceData: InvoiceData }) {
  return (
    <button 
      onClick={() => generateInvoice(invoiceData)}
      className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded text-[10px] transition-colors uppercase tracking-wider flex items-center gap-1 shadow-sm"
    >
      💵 Generate Invoice (Factoring)
    </button>
  );
}
