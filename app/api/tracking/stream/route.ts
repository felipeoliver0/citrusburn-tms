export const runtime = 'nodejs'; // Use Node.js runtime for long-lived connections
export const dynamic = 'force-dynamic';

import { getSession } from '@/lib/dal';
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { isAuth, role, userId } = await getSession();

  // Only Brokers/Dealers/Admins should watch the live map
  if (!isAuth || !userId || role === 'DRIVER') {
    return new Response('Unauthorized', { status: 403 });
  }

  // Parse query params to optionally filter by loadId
  const { searchParams } = new URL(req.url);
  const loadId = searchParams.get('loadId');

  let lastCheckedTime = new Date();

  // We create a ReadableStream to push SSE data to the client
  const stream = new ReadableStream({
    async start(controller) {
      // Send an initial connected message
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

      const interval = setInterval(async () => {
        try {
          // Find loads that have been updated since our last check
          // and are currently in transit
          const query: any = {
            status: 'IN_TRANSIT',
            updatedAt: {
              gt: lastCheckedTime,
            },
            OR: [
              { brokerId: userId },
              { carrierId: userId },
            ],
          };

          if (loadId) {
            query.id = loadId;
          }

          const updatedLoads = await prisma.load.findMany({
            where: query,
            select: {
              id: true,
              currentLat: true,
              currentLng: true,
              updatedAt: true,
              driver: {
                select: {
                  fullName: true,
                }
              }
            }
          });

          if (updatedLoads.length > 0) {
            lastCheckedTime = new Date(); // update cursor
            
            // Send the updated coordinates to the client
            const payload = JSON.stringify({
              type: 'update',
              loads: updatedLoads,
            });
            
            controller.enqueue(`data: ${payload}\n\n`);
          }

          // Send a heartbeat comment every interval to keep connection alive
          controller.enqueue(`: heartbeat\n\n`);
          
        } catch (error) {
          console.error('SSE Polling error:', error);
          // Don't close connection on temporary DB errors
        }
      }, 3000); // Poll every 3 seconds

      // Cleanup when connection closes
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
