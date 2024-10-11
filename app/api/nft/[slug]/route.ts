import { NextResponse } from 'next/server';
import { chipOptions } from '@/data/chipOptions';
import { headers } from 'next/headers';

// Endpoint for the NFT metadata.
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  if (!slug.endsWith('.json')) {
    return NextResponse.json({ error: 'Invalid route' }, { status: 400 });
  }

  const id = parseInt(slug[0], 10);

  // Check if id is a valid number and within the range of chipOptions
  if (isNaN(id) || id < 1 || id > chipOptions.length) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const chipOption = chipOptions[id - 1]; // Arrays are 0-indexed

  // Get the base URL
  const headersList = headers();
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const host = headersList.get('host') || '';
  const baseUrl = `${protocol}://${host}`;

  const dynamicData = {
    name: chipOption,
    description: chipOption,
    image: `${baseUrl}/images/${id}.png`
  };

  return NextResponse.json(dynamicData);
}
