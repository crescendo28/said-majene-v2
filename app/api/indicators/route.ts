import { NextResponse } from 'next/server';
import { getAllVariables } from '@/lib/googleSheets'; 

export async function GET() {
  try {
    const allVariables = await getAllVariables();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    
    //filter untuk buat katalog variabel yang aktif
    const catalog = allVariables
      .filter((ind) => ind.Status === 'Aktif')
      .map((ind) => ({
        id: ind.Id,
        label: ind.Label,
        category: ind.Kategori,
        api_url: `${baseUrl}/api/indicators/${ind.Id}`
      }));

    return NextResponse.json(catalog, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  } catch (error) {
    console.error('Error fetching indicator catalog:', error);
    return NextResponse.json({ error: 'Gagal memuat katalog' }, { status: 500 });
  }
}
