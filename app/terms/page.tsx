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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Subscription, Billing &amp; Cancellation</h2>
            <p className="text-gray-600 mb-4">
              Carrier accounts are billed on a recurring monthly subscription, charged per active Driver seat. New Carrier accounts receive a fourteen (14) day free trial; if you do not cancel before the trial ends, your subscription will automatically convert to a paid plan and your payment method will be charged at the then-current rate.
            </p>
            <p className="text-gray-600 mb-4">
              Subscriptions automatically renew each billing cycle until canceled. You may cancel at any time from your Account Settings; cancellation takes effect at the end of the current billing period, and you will retain access until that date. We do not provide refunds or credits for partial billing periods, except where required by law.
            </p>
            <p className="text-gray-600">
              We reserve the right to change subscription pricing with at least thirty (30) days&apos; notice to active subscribers. Continued use of the Service after a price change takes effect constitutes acceptance of the new pricing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Account Responsibilities</h2>
            <p className="text-gray-600 mb-4">
              You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Termination &amp; Suspension</h2>
            <p className="text-gray-600 mb-4">
              We may suspend or terminate your account, without prior notice, if you breach these Terms, provide false operating authority or insurance information, or engage in fraudulent or abusive conduct on the platform. You may terminate your account at any time by canceling your subscription and discontinuing use of the Service.
            </p>
            <p className="text-gray-600">
              Upon termination, your right to use the Service ceases immediately. Provisions of these Terms that by their nature should survive termination (including Cargo Liability Exemption, Liability Limitation, and Governing Law) will survive.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Liability Limitation</h2>
            <p className="text-gray-600">
              In no event shall America Dispatch TMS, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Governing Law</h2>
            <p className="text-gray-600">
              These Terms are governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law provisions. Any dispute arising from these Terms or your use of the Service shall be brought exclusively in the state or federal courts located in Florida, and you consent to the personal jurisdiction of such courts.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
