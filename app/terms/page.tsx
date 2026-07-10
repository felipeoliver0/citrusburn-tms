import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-gray-200">
        <Link href="/" className="text-brand-600 hover:text-brand-700 text-sm font-bold uppercase tracking-wider mb-8 inline-block">
          &larr; Back to Home
        </Link>
        
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 tracking-tight">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8 font-medium">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-8 text-base leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing or using the America Dispatch TMS platform, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. FMCSA Compliance</h2>
            <p className="text-gray-600 mb-4">
              All Carriers and Brokers utilizing America Dispatch TMS must maintain active operating authority, insurance, and surety bonds as required by the Federal Motor Carrier Safety Administration (FMCSA). It is the sole responsibility of the Carrier to ensure their Cargo Liability Insurance and Auto Liability Insurance remain active and meet or exceed federal minimums.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Cargo Liability Exemption</h2>
            <p className="text-gray-600 mb-4">
              America Dispatch TMS operates solely as a technology platform connecting Carriers, Brokers, and Dealers. We do not take possession of, transport, or broker freight. We hold no liability for damaged, lost, or stolen vehicles. Any claims must be resolved directly between the Shipper/Broker and the Carrier using the Electronic Bill of Lading (eBOL) generated on our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Payment Terms</h2>
            <p className="text-gray-600 mb-4">
              Payment terms for transported loads are strictly between the Carrier and the Broker or Shipper. America Dispatch TMS provides invoicing generation tools and tracking, but is not responsible for the collection, remittance, or guarantee of any freight charges, COD (Cash on Delivery), or COP (Cash on Pickup) payments.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Account Responsibilities</h2>
            <p className="text-gray-600 mb-4">
              You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Liability Limitation</h2>
            <p className="text-gray-600">
              In no event shall America Dispatch TMS, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
