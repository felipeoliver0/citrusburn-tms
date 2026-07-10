import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/dal';
import { ReviewSchema } from '@/lib/validations';
import { isRateLimited } from '@/lib/rateLimit';

export async function POST(req: Request) {
  try {
    const { userId } = await getSession();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (await isRateLimited(`review:${userId}`, 5)) {
      return NextResponse.json({ error: 'Too many reviews submitted recently. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();

    // Validate input with Zod
    const parsed = ReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { loadId, targetId, rating, comment } = parsed.data;

    // Prevent users from reviewing themselves
    if (targetId === userId) {
      return NextResponse.json({ error: 'Cannot review yourself' }, { status: 400 });
    }

    // Check if user already reviewed this load
    const existing = await prisma.review.findUnique({
      where: { loadId_authorId: { loadId, authorId: userId } }
    });

    if (existing) {
      return NextResponse.json({ error: 'Already reviewed' }, { status: 409 });
    }
    // Security Check: Verify that the user is actually the broker or carrier for this load
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: { brokerId: true, carrierId: true, status: true }
    });

    if (!load) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 });
    }

    if (load.status !== 'DELIVERED') {
      return NextResponse.json({ error: 'Load must be delivered before reviewing' }, { status: 400 });
    }

    const isAuthorized = load.brokerId === userId || load.carrierId === userId;
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: You must be assigned to this load to leave a review' }, { status: 403 });
    }

    const isValidTarget = 
      (userId === load.brokerId && targetId === load.carrierId) ||
      (userId === load.carrierId && targetId === load.brokerId);

    if (!isValidTarget) {
      return NextResponse.json({ error: 'Target must be the other party of this load' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        loadId,
        authorId: userId,
        targetId,
        rating,
        comment: comment || null,
      }
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Error creating review:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
