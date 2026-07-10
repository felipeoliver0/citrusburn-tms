import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Truck, ShieldCheck, Mail, Phone, CalendarDays } from 'lucide-react';

export default async function PublicProfile({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = await params;
  const userId = resolvedParams.userId;

  const profileUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      companyName: true,
      companyAddress: true,
      companyCity: true,
      companyState: true,
      companyZip: true,
      mcNumber: true,
      usdotNumber: true,
      ein: true,
      websiteUrl: true,
      yearEstablished: true,
      bondNumber: true,
      insuranceCertUrl: true,
      createdAt: true,
      reviewsReceived: {
        include: { author: { select: { id: true, companyName: true, fullName: true } } },
        orderBy: { createdAt: 'desc' as const }
      }
    }
  });

  if (!profileUser) redirect('/');

  // Calcular média de avaliações
  const totalReviews = profileUser.reviewsReceived.length;
  const averageRating = totalReviews > 0 
    ? (profileUser.reviewsReceived.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews).toFixed(1)
    : 'N/A';

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        
        {/* HEADER / BACK */}
        <header>
          <Link href="/my-loads" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
            &larr; Back
          </Link>
        </header>

        {/* PROFILE CARD */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-r from-brand-600 to-blue-800"></div>
          
          <div className="relative pt-12 flex flex-col md:flex-row gap-8 items-start">
            <div className="w-32 h-32 shrink-0 bg-white rounded-2xl shadow-lg border-4 border-white flex items-center justify-center text-4xl font-black text-brand-600">
              {profileUser.companyName ? profileUser.companyName.substring(0, 2).toUpperCase() : profileUser.fullName?.substring(0, 2).toUpperCase() || 'CP'}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full border ${profileUser.role === 'BROKER' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                  {profileUser.role}
                </span>
                <span className="text-sm font-bold text-gray-500 flex items-center gap-1">
                  <span className="text-amber-400">⭐</span> {averageRating} ({totalReviews} Reviews)
                </span>
              </div>
              
              <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">
                {profileUser.companyName || profileUser.fullName || 'Partner Profile'}
              </h1>
              {profileUser.companyName && <p className="text-gray-500 font-medium">Rep: {profileUser.fullName}</p>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><Mail size={14}/></div>
                  {profileUser.email}
                </div>
                {profileUser.phone && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><Phone size={14}/></div>
                    {profileUser.phone}
                  </div>
                )}
                {profileUser.companyAddress && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><MapPin size={14}/></div>
                    {profileUser.companyAddress}
                    {profileUser.companyCity && `, ${profileUser.companyCity}`}
                    {profileUser.companyState && `, ${profileUser.companyState}`}
                    {profileUser.companyZip && ` ${profileUser.companyZip}`}
                  </div>
                )}
                {profileUser.websiteUrl && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><span className="font-bold">🌐</span></div>
                    <a href={profileUser.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                      {profileUser.websiteUrl.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {profileUser.mcNumber && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><ShieldCheck size={14}/></div>
                    <span className="font-bold">MC:</span> {profileUser.mcNumber}
                  </div>
                )}
                {profileUser.usdotNumber && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><ShieldCheck size={14}/></div>
                    <span className="font-bold">USDOT:</span> {profileUser.usdotNumber}
                  </div>
                )}
                {profileUser.ein && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><span className="font-bold">#</span></div>
                    <span className="font-bold">EIN:</span> {profileUser.ein}
                  </div>
                )}
                {profileUser.bondNumber && profileUser.role === 'BROKER' && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500"><ShieldCheck size={14}/></div>
                    <span className="font-bold">Bond:</span> {profileUser.bondNumber}
                  </div>
                )}
                {profileUser.insuranceCertUrl && profileUser.role === 'CARRIER' && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500"><ShieldCheck size={14}/></div>
                    <a href={profileUser.insuranceCertUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-medium">
                      View Insurance Cert
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><CalendarDays size={14}/></div>
                  Member since {new Date(profileUser.createdAt).getFullYear()} {profileUser.yearEstablished && `(Est. ${profileUser.yearEstablished})`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REVIEWS GRID */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            Recent Feedback
          </h2>
          
          {totalReviews === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500 shadow-sm">
              No reviews available for this partner yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profileUser.reviewsReceived.map(review => (
                <div key={review.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400' : 'fill-gray-200'}`} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <p className="text-sm text-gray-700 italic mb-6 leading-relaxed">"{review.comment}"</p>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Reviewed By</div>
                    <div className="text-xs font-bold text-gray-900 mt-1">{review.author.companyName || review.author.fullName || 'Partner'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
