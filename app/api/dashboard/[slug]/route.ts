import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/googleSheets'; 

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> } // 1. Type it as a Promise
) {
  try {
    const { slug } = await params; // 2. Await the params to unwrap the slug
    
    const result = await getDashboardData(slug);

    if (!result || !result.meta || result.meta.length === 0) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Gagal mengambil data dari server' }, { status: 500 });
  }
}