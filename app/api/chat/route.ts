import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/dal';
import { isRateLimited } from '@/lib/rateLimit';
import { z } from 'zod';

// Buscas mensagens
export async function GET(req: Request) {
  try {
    const { userId, role } = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const loadId = url.searchParams.get('loadId');
    const lastSync = url.searchParams.get('lastSync');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    if (!loadId) return NextResponse.json({ error: 'loadId is required' }, { status: 400 });

    // Validate loadId format
    const parsedLoadId = z.string().uuid().safeParse(loadId);
    if (!parsedLoadId.success) return NextResponse.json({ error: 'Invalid loadId' }, { status: 400 });

    // Validate if user has access to this load
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: { brokerId: true, carrierId: true, driverId: true }
    });

    if (!load) return NextResponse.json({ error: 'Load not found' }, { status: 404 });

    const hasAccess = 
      load.brokerId === userId || 
      load.carrierId === userId || 
      load.driverId === userId || 
      role === 'ADMIN';

    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const messages = await prisma.message.findMany({
      where: { 
        loadId,
        ...(lastSync ? { createdAt: { gt: new Date(lastSync) } } : {})
      },
      orderBy: { createdAt: 'desc' }, // Descending for pagination to get latest, will reverse later
      take: limit,
      skip: (page - 1) * limit,
      include: {
        sender: {
          select: { id: true, fullName: true, companyName: true, role: true }
        }
      }
    });

    // Reverse the messages to return chronological order (oldest to newest)
    const chronologicalMessages = messages.reverse();

    // Get total count for pagination metadata
    const total = await prisma.message.count({ where: { loadId } });
    
    return NextResponse.json({ 
      messages: chronologicalMessages, 
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('API /chat GET error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Enviar mensagem
export async function POST(req: Request) {
  try {
    const { userId, role } = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (await isRateLimited(`chat:${userId}`, 30)) {
      return NextResponse.json({ error: 'Too many messages' }, { status: 429 });
    }

    const body = await req.json();

    // Validate input with Zod
    const parsed = z.object({
      loadId: z.string().uuid('Invalid load ID'),
      content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long').trim(),
    }).safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { loadId, content } = parsed.data;

    // Validate access
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: { brokerId: true, carrierId: true, driverId: true }
    });

    if (!load) return NextResponse.json({ error: 'Load not found' }, { status: 404 });

    const hasAccess = 
      load.brokerId === userId || 
      load.carrierId === userId || 
      load.driverId === userId;

    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const message = await prisma.message.create({
      data: {
        content,
        loadId,
        senderId: userId
      },
      include: {
        sender: {
          select: { id: true, fullName: true, companyName: true, role: true }
        }
      }
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('API /chat POST error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
