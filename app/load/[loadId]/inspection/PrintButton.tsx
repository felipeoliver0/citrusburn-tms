'use client';

export default function PrintButton() {
  return (
    <button 
      onClick={() => typeof window !== 'undefined' && window.print()} 
      className="bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 uppercase tracking-wider text-sm flex items-center gap-2 mx-auto"
    >
      🖨️ Print Report / Save as PDF
    </button>
  );
}
