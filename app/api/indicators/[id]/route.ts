import { NextResponse } from 'next/server';
import { getIndicatorById } from '@/lib/googleSheets'; 

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getIndicatorById(id);

    if (!result || result.error) {
      return NextResponse.json(
        { 
          error: 'Indikator tidak ditemukan atau berstatus Non-Aktif.',
          hint: 'Gunakan endpoint /api/indicators untuk melihat daftar ID yang tersedia.' 
        }, 
        { status: 404 }
      );
    }

    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  } catch (error) {
    console.error('Error in specific indicator API:', error);
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}