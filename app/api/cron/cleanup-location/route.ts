import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Security: Require CRON_SECRET for Vercel Cron Jobs
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await prisma.locationHistory.deleteMany({
      where: {
        timestamp: {
          lt: ninetyDaysAgo
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Location history cleanup completed',
      deletedCount: result.count 
    });
  } catch (error) {
    console.error('Error in location cleanup cron:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
