import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-gray-200">
        <Link href="/" className="text-brand-600 hover:text-brand-700 text-sm font-bold uppercase tracking-wider mb-8 inline-block">
          &larr; Back to Home
        </Link>
        
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8 font-medium">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-8 text-base leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            <p className="mb-4">When you use AxleGrid TMS, we may collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><strong>Account Information:</strong> Name, email address, company name, phone number, EIN, and MC/USDOT Numbers.</li>
              <li><strong>Location Data:</strong> To provide load tracking, we collect GPS data from drivers when a load is marked as IN_TRANSIT.</li>
              <li><strong>Logistics Data:</strong> Delivery signatures, photos of vehicles, and damages uploaded via our platform.</li>
              <li><strong>Device Information:</strong> IP addresses and browser fingerprints to prevent fraud and ensure security.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. California Consumer Privacy Act (CCPA) Compliance</h2>
            <p className="text-gray-600 mb-4">
              Under the CCPA, California residents have the right to request access to their personal data, request deletion, and opt-out of the sale of personal information. AxleGrid TMS <strong>does not sell your personal or location data to third parties.</strong> GPS tracking is strictly utilized to facilitate logistics operations between the assigned Carrier and the Broker/Shipper.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Retention</h2>
            <p className="text-gray-600 mb-4">
              We retain account information for as long as your account is active. To comply with FMCSA record-keeping regulations, Bill of Lading (BOL) data, including vehicle photos, damage reports, and electronic signatures, are retained for a minimum of <strong>three (3) years</strong>. Location tracking data is purged automatically 30 days after the load is marked as DELIVERED.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Use Your Information</h2>
            <p className="text-gray-600">
              We use the collected information strictly to operate the TMS platform, facilitate communication between Brokers and Carriers, generate compliance documents (eBOL, Invoices), and ensure the safe transit of freight.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-600">
              We implement industry-standard security measures, including HTTPS, database indexing, and encrypted cloud storage for documents (eBOL and Signatures). However, no internet-based service can be 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Contact Us</h2>
            <p className="text-gray-600">
              If you have any questions about this Privacy Policy or wish to exercise your CCPA rights, please contact our Data Protection Officer at <strong>privacy@americadispatch.com</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
