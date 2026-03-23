import { NextResponse } from 'next/server'
import { scrapeResArtis } from '../../../../lib/scrapers/sources/resartis'

export async function GET() {
  const result = await scrapeResArtis()

  if (result.success) {
    return NextResponse.json({
      message: `Scraping completado. Found: ${result.totalFound}, New: ${result.totalNew}`,
      ...result
    })
  } else {
    return NextResponse.json(
      { error: result.error },
      { status: 500 }
    )
  }
}

