import { NextResponse } from 'next/server'
import { scrapeNYFA } from '../../../../lib/scrapers/sources/nyfa'

export async function GET() {
  const result = await scrapeNYFA()
  if (result.success) {
    return NextResponse.json({
      message: `Scraping completed. Found: ${result.totalFound}, New: ${result.totalNew}`,
      ...result
    })
  } else {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
}