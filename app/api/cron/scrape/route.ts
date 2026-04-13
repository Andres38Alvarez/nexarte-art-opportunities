import { NextResponse } from 'next/server'
import { scrapeResArtis } from '@/lib/scrapers/sources/resartis'
import { scrapeACA } from '@/lib/scrapers/sources/aca'
import { scrapeColossal } from '@/lib/scrapers/sources/colossal'

export async function GET(request: Request) {
  // Seguridad: verificar que la llamada viene de Vercel
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = []

  // Correr todos los scrapers
  const resartis = await scrapeResArtis()
  results.push({ source: 'ResArtis', ...resartis })

  const aca = await scrapeACA()
  results.push({ source: 'ACA', ...aca })

  const colossal = await scrapeColossal()
  results.push({ source: 'Colossal', ...colossal })

  return NextResponse.json({
    message: 'Cron job completed',
    executedAt: new Date().toISOString(),
    results,
  })
}