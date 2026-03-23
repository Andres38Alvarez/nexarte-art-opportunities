import { NextResponse } from 'next/server'
import { scrapeACA } from '../../../../lib/scrapers/sources/aca'

export async function GET() {
  const result = await scrapeACA()

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