import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { verifySession, getSession } from '@/lib/dal';
import { UpdateProfileSchema } from '@/lib/validations';
import { redirect } from 'next/navigation';

export default async function Conta(props: { searchParams: Promise<{ error?: string, success?: string }> }) {
  const { userId } = await verifySession();
  const searchParams = await props.searchParams;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    redirect('/logout');
  }

  // Apenas busca cargas ativas do lado do CARRIER, e evita erros no lado do BROKER
  const activeLoads = await prisma.load.findMany({
    where: user.role === 'CARRIER' ? { carrierId: userId, status: { in: ['OFFERED', 'BOOKED', 'IN_TRANSIT'] } } : { brokerId: userId, status: { in: ['OFFERED', 'BOOKED', 'IN_TRANSIT'] } },
    include: { broker: true, carrier: true },
    orderBy: { createdAt: 'desc' }
  });

  const inTransitLoads = activeLoads.filter(l => l.status === 'IN_TRANSIT');
  const pendingActionLoads = activeLoads.filter(l => l.status === 'OFFERED' || l.status === 'BOOKED');

  const myReviews = await prisma.review.findMany({
    where: { targetId: userId },
    include: { author: true },
    orderBy: { createdAt: 'desc' }
  });

  async function handleUpdateProfile(formData: FormData) {
    'use server';
    const { userId: actionUserId } = await getSession();
    
    if (!actionUserId) redirect('/login');

    const rawFullName = formData.get('fullName') as string;
    const rawPhone = formData.get('phone') as string;
    const rawCompanyName = formData.get('companyName') as string;
    const rawCompanyAddress = formData.get('companyAddress') as string;
    const rawMcNumber = formData.get('mcNumber') as string;
    
    // Novas váriaveis do FMCSA/CCPA
    const rawUsdotNumber = formData.get('usdotNumber') as string;
    const rawEin = formData.get('ein') as string;
    const rawCompanyCity = formData.get('companyCity') as string;
    const rawCompanyState = formData.get('companyState') as string;
    const rawCompanyZip = formData.get('companyZip') as string;
    const rawWebsiteUrl = formData.get('websiteUrl') as string;
    const rawYearEstablished = formData.get('yearEstablished') as string;
    const rawTimeZone = formData.get('timeZone') as string;
    const rawHoursOfOperation = formData.get('hoursOfOperation') as string;
    const rawCellPhone = formData.get('cellPhone') as string;
    const rawBondNumber = formData.get('bondNumber') as string;
    const rawInsuranceCertUrl = formData.get('insuranceCertUrl') as string;

    const parsed = UpdateProfileSchema.safeParse({
      fullName: rawFullName,
      phone: rawPhone,
      companyName: rawCompanyName,
      companyAddress: rawCompanyAddress,
      mcNumber: rawMcNumber,
      usdotNumber: rawUsdotNumber,
      ein: rawEin,
      companyCity: rawCompanyCity,
      companyState: rawCompanyState,
      companyZip: rawCompanyZip,
      websiteUrl: rawWebsiteUrl,
      yearEstablished: rawYearEstablished,
      timeZone: rawTimeZone,
      hoursOfOperation: rawHoursOfOperation,
      cellPhone: rawCellPhone,
      bondNumber: rawBondNumber,
      insuranceCertUrl: rawInsuranceCertUrl,
    });

    if (!parsed.success) {
      redirect(`/account?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
    }

    const { 
      fullName, phone, companyName, companyAddress, mcNumber,
      usdotNumber, ein, companyCity, companyState, companyZip, websiteUrl,
      yearEstablished, timeZone, hoursOfOperation, cellPhone, bondNumber, insuranceCertUrl
    } = parsed.data;

    let success = false;
    try {
      await prisma.user.update({
        where: { id: actionUserId },
        data: {
          fullName: fullName || null,
          phone: phone || null,
          companyName: companyName || null,
          companyAddress: companyAddress || null,
          mcNumber: mcNumber || null,
          usdotNumber: usdotNumber || null,
          ein: ein || null,
          companyCity: companyCity || null,
          companyState: companyState || null,
          companyZip: companyZip || null,
          websiteUrl: websiteUrl || null,
          yearEstablished: yearEstablished || null,
          timeZone: timeZone || null,
          hoursOfOperation: hoursOfOperation || null,
          cellPhone: cellPhone || null,
          bondNumber: bondNumber || null,
          insuranceCertUrl: insuranceCertUrl || null,
        }
      });
      revalidatePath('/account');
      success = true;
    } catch (error) {
      console.error('Error updating profile:', error instanceof Error ? error.message : 'Unknown error');
    }

    if (success) {
      redirect('/account?success=Profile updated successfully');
    } else {
      redirect(`/account?error=Failed to update profile`);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 pb-10">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Profile & <span className="text-brand-400">Account</span>
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Manage your personal information and operations.</p>
        </div>
        <div className="glass-panel border border-gray-100 px-4 py-2 rounded-lg bg-gray-50">
          <span className="text-[10px] uppercase text-gray-500 font-bold block">Account Status</span>
          <span className="text-sm font-bold text-brand-400 flex items-center gap-2">
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div> Active {user.role}
          </span>
        </div>
      </header>

      {/* FEEDBACK MENSAGENS */}
      {searchParams.error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6">
          <strong>Error: </strong> {searchParams.error}
        </div>
      )}
      {searchParams.success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl mb-6">
          <strong>Success: </strong> {searchParams.success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA: Formulário de Perfil */}
        <div className="lg:col-span-2 glass-panel border border-gray-100 rounded-2xl overflow-hidden self-start bg-white">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-gray-900 shadow-lg">
              {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : user.email.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.fullName || user.companyName || 'User Name'}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <form action={handleUpdateProfile} className="p-6 space-y-8">
            <input type="hidden" name="userId" value={user.id} />

            <div>
              <h3 className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-bold uppercase">Full Name</label>
                  <input type="text" name="fullName" defaultValue={user.fullName || ''} className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-brand-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-bold uppercase">Phone Number</label>
                  <input type="tel" name="phone" defaultValue={user.phone || ''} className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-brand-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-bold uppercase">Cell Phone</label>
                  <input type="tel" name="cellPhone" defaultValue={user.cellPhone || ''} className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-brand-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-bold uppercase">Corporate Email</label>
                  <input type="email" disabled defaultValue={user.email} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-500 cursor-not-allowed" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                Business & Compliance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1 font-bold uppercase">Company Name</label>
                  <input type="text" name="companyName" defaultValue={user.companyName || ''} className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1 font-bold uppercase">Street Address</label>
                  <input type="text" name="companyAddress" defaultValue={user.companyAddress || ''} className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-bold uppercase">City</label>
                  <input type="text" name="companyCity" defaultValue={user.companyCity || ''} className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-bold uppercase">State</label>
                  <input type="text" name="companyState" defaultValue={user.companyState || ''} className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-bold uppercase">ZIP Code</label>
                  <input type="text" name="companyZip" defaultValue={user.companyZip || ''} className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-bold uppercase">Website URL</label>
                  <input type="url" name="websiteUrl" defaultValue={user.websiteUrl || ''} className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-bold uppercase">Year Established</label>
                  <input type="text" name="yearEstablished" defaultValue={user.yearEstablished || ''} className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-bold uppercase">Time Zone</label>
                  <input type="text" name="timeZone" defaultValue={user.timeZone || ''} placeholder="e.g. EST, CST" className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-bold uppercase">Hours of Operation</label>
                  <input type="text" name="hoursOfOperation" defaultValue={user.hoursOfOperation || ''} placeholder="e.g. 8AM - 5PM" className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                FMCSA Compliance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-bold uppercase">MC Number</label>
                  <input type="text" name="mcNumber" defaultValue={user.mcNumber || ''} className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-bold uppercase">USDOT Number</label>
                  <input type="text" name="usdotNumber" defaultValue={user.usdotNumber || ''} className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-bold uppercase">EIN / Tax ID</label>
                  <input type="text" name="ein" defaultValue={user.ein || ''} className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                {user.role === 'BROKER' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-bold uppercase">Surety Bond Number</label>
                    <input type="text" name="bondNumber" defaultValue={user.bondNumber || ''} className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                )}
                {user.role === 'CARRIER' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-bold uppercase">Insurance Cert URL</label>
                    <input type="url" name="insuranceCertUrl" defaultValue={user.insuranceCertUrl || ''} className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" className="bg-brand-500 hover:bg-brand-400 text-gray-900 font-bold py-3 px-8 rounded-xl transition-colors text-sm shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* COLUNA DIREITA */}
        <div className="glass-panel border border-gray-100 rounded-2xl shadow-xl p-6 self-start flex flex-col gap-8 bg-white">
          
          {/* Cargas Em Trânsito */}
          <div>
            <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex items-center justify-between">
              <span>🚚 In Transit</span>
              <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-[10px] border border-blue-500/30">{inTransitLoads.length}</span>
            </h3>
            <div className="space-y-3">
              {inTransitLoads.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-2">Nenhuma carga na estrada no momento.</p>
              ) : (
                inTransitLoads.map(load => (
                  <div key={load.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 hover:border-blue-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="animate-pulse bg-blue-500/20 text-blue-400 text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wider border border-blue-500/30">
                        On Route
                      </span>
                    </div>
                    <div className="font-bold text-gray-900 text-sm">
                      {load.originCity} &rarr; {load.destCity}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ações Pendentes */}
          <div>
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex items-center justify-between">
              <span>⚠️ Action Required</span>
              <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-[10px] border border-amber-500/30">{pendingActionLoads.length}</span>
            </h3>
            <div className="space-y-3">
              {pendingActionLoads.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-2">Tudo limpo por aqui.</p>
              ) : (
                pendingActionLoads.map(load => (
                  <div key={load.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 hover:border-amber-500/50 transition-colors">
                    <div className="font-bold text-gray-900 text-sm">
                      {load.originCity} &rarr; {load.destCity}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-2 uppercase tracking-wider">
                      Status: <span className="font-bold text-amber-400">{load.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* REVIEWS SECTION */}
      <div className="mt-8 glass-panel border border-gray-100 rounded-2xl shadow-xl p-6 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-amber-400">⭐</span> Partner Feedback & Reviews
          </h2>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
            {myReviews.length} {myReviews.length === 1 ? 'Review' : 'Reviews'} Received
          </div>
        </div>
        
        {myReviews.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            You haven't received any reviews yet. Complete more loads to build your reputation!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myReviews.map(review => (
              <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-5 hover:border-amber-500/30 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400' : 'fill-zinc-700'}`} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                
                <p className="text-sm text-gray-600 italic mb-4">"{review.comment}"</p>
                
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Reviewed By</div>
                    <div className="text-xs font-bold text-brand-400">{review.author.companyName || review.author.fullName || 'Partner'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Load</div>
                    <div className="text-xs font-mono text-gray-500">#{review.loadId.substring(0,6).toUpperCase()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
