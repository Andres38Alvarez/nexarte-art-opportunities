import { NextResponse } from 'next/server'
import { scrapeColossal } from '../../../../lib/scrapers/sources/colossal'

export async function GET() {
  const result = await scrapeColossal()
  if (result.success) {
    return NextResponse.json({
      message: `Scraping completed. Found: ${result.totalFound}, New: ${result.totalNew}`,
      ...result
    })
  } else {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
}