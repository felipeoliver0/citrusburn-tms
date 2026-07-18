'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 font-sans text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-200">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Critical Error</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">
          A critical error occurred in the application. Please try reloading the page.
        </p>
        
        <button
          onClick={() => reset()}
          className="bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:-translate-y-0.5"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
