import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/dal';
import prisma from '@/lib/prisma';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Authorize the user before generating the token
        const { userId, role } = await getSession();
        if (!userId || role !== 'DRIVER') {
          throw new Error('Unauthorized');
        }

        if (!clientPayload) {
          throw new Error('Missing client payload context');
        }

        const { loadId, type } = JSON.parse(clientPayload);

        // P1-05: validate load context
        const load = await prisma.load.findUnique({
          where: { id: loadId },
          select: { driverId: true, status: true }
        });

        if (!load || load.driverId !== userId) {
          throw new Error('Forbidden: Not authorized for this load');
        }

        if (load.status !== 'BOOKED' && load.status !== 'IN_TRANSIT') {
          throw new Error('Load is not in a valid state for inspections');
        }

        const validTypes = ['VIN', 'SIGNATURE', 'POD', 'VEHICLE', 'DAMAGE'];
        if (!validTypes.includes(type)) {
          throw new Error('Invalid upload type');
        }

        // Return the client payload which limits what they can upload if needed
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          tokenPayload: JSON.stringify({ userId, loadId, type }),
          maximumSizeInBytes: 15 * 1024 * 1024 // P1-06: 15MB limit per file
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // You can run any backend logic here after successful upload if needed.
        console.log('Upload completed', blob.url, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
