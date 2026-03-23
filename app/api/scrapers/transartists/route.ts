import { NextResponse } from 'next/server'
import { scrapeTransArtists } from '../../../../lib/scrapers/sources/transartists'

export async function GET() {
  const result = await scrapeTransArtists()

  if (result.success) {
    return NextResponse.json({
      message: `Scraping completed. Found: ${result.totalFound}, New: ${result.totalNew}`,
      ...result
    })
  } else {
    return NextResponse.json(
      { error: result.error },
      { status: 500 }
    )
  }
}